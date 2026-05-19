import OSLog
import SwiftUI

/// Apple + Google sign-in surface. No email/password, no magic links.
struct SignInView: View {
    @Environment(Session.self) private var session
    @Environment(\.openURL) private var openURL

    @State private var inflightProvider: SignInProvider? = nil
    @State private var errorMessage: String? = nil

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer().frame(height: Spacing.s9)

                BrandMark()

                Spacer()

                content
                    .padding(.horizontal, Spacing.s5)

                Spacer().frame(height: Spacing.s8)
            }
        }
    }

    // MARK: - Content

    private var content: some View {
        VStack(alignment: .leading, spacing: Spacing.s4) {
            tagline

            VStack(spacing: Spacing.s3) {
                providerButton(.apple)
                providerButton(.google)
            }

            if let errorMessage {
                HStack {
                    Spacer()
                    GFTag(label: errorMessage.uppercased(), severity: .red)
                    Spacer()
                }
                .padding(.top, Spacing.s1)
                .transition(.opacity)
            }

            HStack(spacing: Spacing.s1) {
                Text("BY CONTINUING YOU AGREE TO")
                    .font(.gf.label)
                    .tracking(1.2)
                    .foregroundStyle(Color.gf.fg3)
                Button("TERMS") {
                    if let url = URL(string: "https://greenflagged.xyz/terms") { openURL(url) }
                }
                .buttonStyle(.plain)
                .font(.gf.label)
                .tracking(1.2)
                .foregroundStyle(Color.gf.fg1)
                Text("&")
                    .font(.gf.label)
                    .foregroundStyle(Color.gf.fg3)
                Button("PRIVACY") {
                    if let url = URL(string: "https://greenflagged.xyz/privacy") { openURL(url) }
                }
                .buttonStyle(.plain)
                .font(.gf.label)
                .tracking(1.2)
                .foregroundStyle(Color.gf.fg1)
            }
            .frame(maxWidth: .infinity)
            .padding(.top, Spacing.s2)
        }
    }

    private var tagline: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// SIGN IN")
                .font(.gf.label)
                .tracking(1.2)
                .foregroundStyle(Color.gf.fg3)
            Text("Read the contract before you sign.")
                .font(.gf.h3)
                .foregroundStyle(Color.gf.fg1)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.bottom, Spacing.s2)
    }

    // MARK: - Provider buttons

    @ViewBuilder
    private func providerButton(_ provider: SignInProvider) -> some View {
        let isLoading = (inflightProvider == provider)
        let isAnyLoading = (inflightProvider != nil)

        ZStack {
            GFButton(
                label: isLoading ? "" : provider.label,
                style: provider.buttonStyle,
                showsArrow: !isLoading,
                isDisabled: isAnyLoading && !isLoading
            ) {
                Task { await handleTap(provider) }
            }
            .overlay(alignment: .leading) {
                if !isLoading {
                    Image(systemName: provider.symbolName)
                        .font(.gf.body)
                        .foregroundStyle(provider.symbolColor)
                        .padding(.leading, Spacing.s4)
                        .allowsHitTesting(false)
                }
            }
            .accessibilityIdentifier("signIn.\(provider.rawValue)")

            if isLoading {
                ProgressView()
                    .progressViewStyle(.circular)
                    .tint(provider.spinnerTint)
                    .allowsHitTesting(false)
            }
        }
    }

    // MARK: - Actions

    private func handleTap(_ provider: SignInProvider) async {
        guard inflightProvider == nil else { return }
        errorMessage = nil
        inflightProvider = provider
        defer { inflightProvider = nil }

        do {
            switch provider {
            case .apple:  try await session.signInWithApple()
            case .google: try await session.signInWithGoogle()
            }
        } catch is CancellationError {
            // User cancelled — silent.
        } catch let error as NSError where error.domain == "com.apple.AuthenticationServices.AuthorizationError" && error.code == 1001 {
            // Apple Sign-In user-cancelled — silent.
        } catch {
            Log.auth.error("\(provider.rawValue) sign-in failed: \(error.localizedDescription, privacy: .public)")
            withAnimation(.easeInOut(duration: 0.18)) {
                errorMessage = humanMessage(for: error)
            }
        }
    }

    private func humanMessage(for error: Error) -> String {
        let raw = error.localizedDescription
        // Trim to keep the GFTag from wrapping awkwardly.
        if raw.count > 64 {
            return String(raw.prefix(60)) + "…"
        }
        return raw
    }
}

// MARK: - Providers

private enum SignInProvider: String, Equatable, CaseIterable {
    case apple, google

    var label: String {
        switch self {
        case .apple:  "CONTINUE WITH APPLE"
        case .google: "CONTINUE WITH GOOGLE"
        }
    }

    var buttonStyle: GFButtonStyle {
        switch self {
        case .apple:  .solid
        case .google: .ghost
        }
    }

    var symbolName: String {
        switch self {
        case .apple:  "applelogo"
        case .google: "g.circle"
        }
    }

    var symbolColor: Color {
        switch self {
        case .apple:  Color.gf.bg
        case .google: Color.gf.fg1
        }
    }

    var spinnerTint: Color {
        switch self {
        case .apple:  Color.gf.bg
        case .google: Color.gf.fg1
        }
    }
}

#Preview("Idle") {
    SignInView()
        .environment(Session())
}

#Preview("Light mode") {
    SignInView()
        .environment(Session())
        .preferredColorScheme(.light)
}
