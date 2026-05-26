import SwiftUI

/// Top-level tab shell. The selected tab is lifted up here as a single source
/// of truth so child views (e.g. the dashboard empty-state CTA) can program-
/// matically navigate by mutating `selectedTab` via the binding.
struct MainTabsView: View {
    @State private var selectedTab: AppTab = .home

    var body: some View {
        TabView(selection: $selectedTab) {
            DashboardView(selectedTab: $selectedTab)
                .tabItem { Label("HOME", systemImage: "chart.bar.fill") }
                .tag(AppTab.home)

            ScanView()
                .tabItem { Label("SCAN", systemImage: "doc.viewfinder") }
                .tag(AppTab.scan)

            ContractsListView()
                .tabItem { Label("CONTRACTS", systemImage: "tray.full") }
                .tag(AppTab.contracts)

            SettingsView()
                .tabItem { Label("SETTINGS", systemImage: "gearshape") }
                .tag(AppTab.settings)
        }
        .tint(Color.gf.accent)
        .onReceive(NotificationCenter.default.publisher(for: AppTab.switchNotification)) { note in
            if let raw = note.userInfo?[AppTab.userInfoKey] as? String,
               let tab = AppTab(rawValue: raw) {
                selectedTab = tab
            }
        }
    }
}

/// The four top-level destinations of the app. Stable rawValues so
/// `@AppStorage`-backed deep links keep working across versions.
enum AppTab: String, Hashable, CaseIterable, Sendable {
    case home
    case scan
    case contracts
    case settings

    /// Posted by deep-link-style nudges (empty-state CTAs, dashboard quick
    /// actions outside the existing `Binding<AppTab>` plumbing). Observed by
    /// `MainTabsView` to flip the selected tab.
    static let switchNotification = Notification.Name("gf.tabs.switch")
    static let userInfoKey = "tab"

    /// Convenience post used by call-sites that just want to jump tabs.
    static func switchTo(_ tab: AppTab) {
        NotificationCenter.default.post(
            name: switchNotification,
            object: nil,
            userInfo: [userInfoKey: tab.rawValue]
        )
    }
}
