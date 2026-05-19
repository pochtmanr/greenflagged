import SwiftUI

struct RootView: View {
    @Environment(Session.self) private var session

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            switch session.authState {
            case .loading:
                BrandMark()
                    .transition(.opacity)
            case .signedOut:
                SignInView()
                    .transition(.opacity)
            case .needsOnboarding:
                OnboardingFlow()
                    .transition(.opacity)
            case .signedIn:
                MainTabsView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: session.authState)
        .task { await session.bootstrap() }
    }
}

#Preview {
    RootView()
        .environment(Session())
}
