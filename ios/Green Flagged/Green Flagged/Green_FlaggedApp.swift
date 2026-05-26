import RevenueCat
import SwiftUI

@main
struct Green_FlaggedApp: App {
    @State private var session = Session()
    @State private var entitlements = EntitlementGate.shared

    /// Persisted appearance preference. Prompt C will add the user-facing
    /// picker in `SettingsView` bound to this same key.
    @AppStorage("gf-theme") private var themeRaw: String = ThemePreference.system.rawValue

    init() {
        // RC's static configure is thread-safe and fires early so purchase
        // observers are wired before any in-flight transaction is replayed.
        Purchases.logLevel = .warn
        Purchases.configure(withAPIKey: AppConfig.revenueCatAPIKey)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
                .environment(entitlements)
                .preferredColorScheme(ThemePreference(rawValue: themeRaw)?.colorScheme)
                .task {
                    // Delegate fan-out has to happen on the main actor;
                    // SwiftUI `.task` already runs us there.
                    RevenueCatService.shared.configure()
                    await RevenueCatService.shared.fetchOfferings()
                }
        }
    }
}
