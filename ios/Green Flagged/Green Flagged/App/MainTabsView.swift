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
    }
}

/// The four top-level destinations of the app. Stable rawValues so
/// `@AppStorage`-backed deep links keep working across versions.
enum AppTab: String, Hashable, CaseIterable, Sendable {
    case home
    case scan
    case contracts
    case settings
}
