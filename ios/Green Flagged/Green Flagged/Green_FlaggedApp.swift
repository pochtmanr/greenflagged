import SwiftUI

@main
struct Green_FlaggedApp: App {
    @State private var session = Session()

    /// Persisted appearance preference. Prompt C will add the user-facing
    /// picker in `SettingsView` bound to this same key.
    @AppStorage("gf-theme") private var themeRaw: String = ThemePreference.system.rawValue

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(session)
                .preferredColorScheme(ThemePreference(rawValue: themeRaw)?.colorScheme)
        }
    }
}
