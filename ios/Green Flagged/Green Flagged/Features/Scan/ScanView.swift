import SwiftUI

// TODO Phase 4 — upload | paste | scan paper; multipart POST /api/scan.
struct ScanView: View {
    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()
            Text("// SCAN")
                .font(.gf.label)
                .foregroundStyle(Color.gf.fg3)
        }
    }
}
