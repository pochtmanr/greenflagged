import SwiftUI

// TODO Phase 5 — severity stripe, taxonomy spec rows, redlines, markdown.
struct VerdictView: View {
    let contractId: String

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()
            Text("// VERDICT \(contractId)")
                .font(.gf.label)
                .foregroundStyle(Color.gf.fg3)
        }
    }
}
