import SwiftUI

struct RootView: View {
    @Environment(Session.self) private var session

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            if session.isLoading {
                Wordmark()
            } else if session.userId == nil {
                // Phase 2: SignInView()
                Wordmark()
            } else {
                // Phase 3: MainTabsView()
                Wordmark()
            }
        }
        .task { await session.bootstrap() }
    }
}

#Preview {
    RootView()
        .environment(Session())
}
