import Foundation

// TODO Phase 2 — auth state machine.
// @Observable class Session backed by supabase-swift:
//   - bootstrap() async: read Keychain refresh token, refreshSession, fetch profile
//   - signIn(email:password:) async throws
//   - signUp(email:password:) async throws
//   - signInWithGoogle() async throws — ASWebAuthenticationSession
//   - signOut() async — clears Keychain
//   - currentAccessToken() async throws -> String — auto-refresh when expired

@MainActor
@Observable
final class Session {
    var isLoading: Bool = true
    var userId: String? = nil

    func bootstrap() async {
        // Phase 2 will replace this with the real flow.
        isLoading = false
    }
}
