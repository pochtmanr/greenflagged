import AuthenticationServices
import CryptoKit
import Foundation
import OSLog
import Supabase
import SwiftUI

/// Coarse-grained auth state used to drive the root navigation. View code
/// switches on this enum and never reads tokens directly — token plumbing
/// lives entirely inside ``Session`` and the underlying ``SupabaseClient``.
enum AuthState: Equatable {
    case loading
    case signedOut
    case needsOnboarding(user: Supabase.User)
    case signedIn(user: Supabase.User, profile: Profile)

    static func == (lhs: AuthState, rhs: AuthState) -> Bool {
        switch (lhs, rhs) {
        case (.loading, .loading), (.signedOut, .signedOut):
            return true
        case let (.needsOnboarding(a), .needsOnboarding(b)):
            return a.id == b.id
        case let (.signedIn(au, ap), .signedIn(bu, bp)):
            return au.id == bu.id && ap.id == bp.id
        default:
            return false
        }
    }
}

/// Auth-state machine for the app. Owns the supabase-swift session and the
/// derived `profile` row, exposes the strict subset of methods that view code
/// is allowed to call.
@MainActor
@Observable
final class Session {
    private(set) var authState: AuthState = .loading

    private let supabase: SupabaseClient

    init(client: SupabaseClient = SupabaseService.shared) {
        self.supabase = client
    }

    // MARK: - Lifecycle

    /// Called once at app launch. If a session is cached in Keychain,
    /// supabase-swift restores it (and refreshes if expired) so this is a
    /// cheap no-op for already-authenticated users.
    func bootstrap() async {
        authState = .loading
        do {
            let session = try await supabase.auth.session
            await refreshProfile(for: session.user)
        } catch {
            Log.auth.debug("bootstrap: no session — \(error.localizedDescription, privacy: .public)")
            authState = .signedOut
        }
    }

    // MARK: - Sign in / out

    /// Apple ID sign-in via `ASAuthorizationAppleIDProvider`. Generates a
    /// cryptographic nonce, captures the identity token, exchanges it with
    /// Supabase via `signInWithIdToken`, then refreshes the local profile.
    func signInWithApple() async throws {
        let rawNonce = Self.randomNonceString()
        let hashedNonce = Self.sha256(rawNonce)

        let credential = try await AppleSignInCoordinator.requestCredential(nonce: hashedNonce)

        guard let tokenData = credential.identityToken,
              let idToken = String(data: tokenData, encoding: .utf8) else {
            throw SessionError.appleMissingIdentityToken
        }

        let session = try await supabase.auth.signInWithIdToken(
            credentials: OpenIDConnectCredentials(
                provider: .apple,
                idToken: idToken,
                nonce: rawNonce
            )
        )
        await refreshProfile(for: session.user)
    }

    /// Google sign-in via Supabase's OAuth helper, which under the hood opens
    /// an `ASWebAuthenticationSession` against `/auth/v1/authorize?provider=google`.
    func signInWithGoogle() async throws {
        let session = try await supabase.auth.signInWithOAuth(
            provider: .google,
            redirectTo: AppConfig.authCallbackURL
        ) { authSession in
            authSession.prefersEphemeralWebBrowserSession = false
        }
        await refreshProfile(for: session.user)
    }

    /// Tears down the session. Failures are logged but don't propagate — the
    /// UI always returns to `.signedOut` regardless, so a corrupt Keychain
    /// entry can't strand the user in a signed-in shell.
    func signOut() async {
        do {
            try await supabase.auth.signOut()
        } catch {
            Log.auth.error("signOut failed: \(error.localizedDescription, privacy: .public)")
        }
        authState = .signedOut
    }

    /// Returns a valid (auto-refreshed if needed) access token for the API
    /// client to attach as `Authorization: Bearer …`. Throws if the user is
    /// signed out so callers can surface `.unauthorized`.
    func currentAccessToken() async throws -> String {
        try await supabase.auth.session.accessToken
    }

    // MARK: - Profile

    /// Refreshes the `profiles` row for the current user and transitions the
    /// state machine accordingly. Called after every successful auth event.
    func refreshProfile() async {
        do {
            let supaSession = try await supabase.auth.session
            await refreshProfile(for: supaSession.user)
        } catch {
            Log.auth.debug("refreshProfile: no session — \(error.localizedDescription, privacy: .public)")
            authState = .signedOut
        }
    }

    private func refreshProfile(for user: Supabase.User) async {
        do {
            let rows: [Profile] = try await supabase
                .from("profiles")
                .select()
                .eq("user_id", value: user.id.uuidString.lowercased())
                .limit(1)
                .execute()
                .value

            if let profile = rows.first, profile.onboardedAt != nil {
                authState = .signedIn(user: user, profile: profile)
            } else {
                authState = .needsOnboarding(user: user)
            }
        } catch {
            Log.auth.error("profile fetch failed: \(error.localizedDescription, privacy: .public)")
            // Treat as onboarding-needed rather than blowing the user back to
            // sign-in: the row probably doesn't exist yet for first-time users.
            authState = .needsOnboarding(user: user)
        }
    }

    // MARK: - Errors

    enum SessionError: Error, LocalizedError {
        case appleMissingIdentityToken
        case appleFailed(String)

        var errorDescription: String? {
            switch self {
            case .appleMissingIdentityToken:
                return "Apple Sign-In didn't return an identity token."
            case .appleFailed(let msg):
                return msg
            }
        }
    }

    // MARK: - Nonce helpers (Apple Sign-In)

    private static func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._")
        var result = ""
        var remaining = length
        while remaining > 0 {
            var random: UInt8 = 0
            let status = SecRandomCopyBytes(kSecRandomDefault, 1, &random)
            guard status == errSecSuccess else {
                preconditionFailure("Unable to generate nonce. SecRandomCopyBytes status: \(status)")
            }
            if random < charset.count {
                result.append(charset[Int(random)])
                remaining -= 1
            }
        }
        return result
    }

    private static func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        let hash = SHA256.hash(data: data)
        return hash.map { String(format: "%02x", $0) }.joined()
    }
}

// MARK: - AppleSignInCoordinator

/// Bridges the closure-based `ASAuthorizationController` delegate API to
/// async/await. Each call creates a one-shot coordinator that holds itself
/// alive via the `Task` continuation until the controller finishes.
@MainActor
private final class AppleSignInCoordinator: NSObject,
    ASAuthorizationControllerDelegate,
    ASAuthorizationControllerPresentationContextProviding
{
    private var continuation: CheckedContinuation<ASAuthorizationAppleIDCredential, Error>?
    // Strong self-reference kept until the delegate fires.
    private var strongSelf: AppleSignInCoordinator?

    static func requestCredential(nonce: String) async throws -> ASAuthorizationAppleIDCredential {
        let coordinator = AppleSignInCoordinator()
        return try await coordinator.start(nonce: nonce)
    }

    private func start(nonce: String) async throws -> ASAuthorizationAppleIDCredential {
        try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            self.strongSelf = self

            let provider = ASAuthorizationAppleIDProvider()
            let request = provider.createRequest()
            request.requestedScopes = [.email, .fullName]
            request.nonce = nonce

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    // MARK: ASAuthorizationControllerDelegate

    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        Task { @MainActor in
            defer { self.cleanup() }
            guard let cred = authorization.credential as? ASAuthorizationAppleIDCredential else {
                self.continuation?.resume(throwing: Session.SessionError.appleFailed("Unexpected credential type."))
                return
            }
            self.continuation?.resume(returning: cred)
        }
    }

    nonisolated func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        Task { @MainActor in
            defer { self.cleanup() }
            self.continuation?.resume(throwing: error)
        }
    }

    // MARK: ASAuthorizationControllerPresentationContextProviding

    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        let scene = scenes.first { $0.activationState == .foregroundActive } ?? scenes.first
        if let anchor = scene?.windows.first(where: { $0.isKeyWindow }) ?? scene?.windows.first {
            return anchor
        }
        // SignInView is on screen by the time we reach this code path, so
        // there is always at least one window scene to anchor against.
        // Force-unwrap deliberately: a nil here means SwiftUI's WindowGroup
        // never produced a scene, which would be a much bigger bug.
        return ASPresentationAnchor(windowScene: scene!)
    }

    private func cleanup() {
        continuation = nil
        strongSelf = nil
    }
}
