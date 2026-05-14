import SwiftUI

// TODO Phase 3 — final 4-tab shell. Dashboard · Scan · Contracts · Settings.
struct MainTabsView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("HOME", systemImage: "chart.bar.fill") }
            ScanView()
                .tabItem { Label("SCAN", systemImage: "doc.viewfinder") }
            ContractsListView()
                .tabItem { Label("CONTRACTS", systemImage: "tray.full") }
            SettingsView()
                .tabItem { Label("SETTINGS", systemImage: "gearshape") }
        }
        .tint(Color.gf.accent)
    }
}
