import SwiftUI

/// Shared mono-uppercase red error banner. Replaces the inline `errorBanner`
/// helper previously duplicated across `ContractDetailView` and friends.
/// Use this for any multi-line or stand-alone error surface; single-line
/// statuses still belong in `GFTag(severity: .red)`.
struct GFErrorBanner: View {
    let message: String

    var body: some View {
        GFFrame(bracketColor: Color.gf.sevRed) {
            Text(message.uppercased())
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.sevRed)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

#Preview {
    ZStack {
        Color.gf.bg.ignoresSafeArea()
        GFErrorBanner(message: "Something went wrong · try again")
            .padding()
    }
}
