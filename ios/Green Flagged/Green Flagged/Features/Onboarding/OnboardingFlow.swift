import SwiftUI

// TODO Phase 2 — 3-step onboarding: account type → country → business name.
struct OnboardingFlow: View {
    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()
            Wordmark()
        }
    }
}
