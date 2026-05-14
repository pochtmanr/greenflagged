import SwiftUI

struct Wordmark: View {
    var body: some View {
        HStack(spacing: Spacing.s2) {
            Text("GREEN")
                .font(.gf.label)
                .tracking(1.2)
                .foregroundStyle(Color.gf.fg1)
            Circle()
                .fill(Color.gf.accentStrong)
                .frame(width: 6, height: 6)
            Text("FLAGGED")
                .font(.gf.label)
                .tracking(1.2)
                .foregroundStyle(Color.gf.fg1)
        }
    }
}

#Preview {
    ZStack {
        Color.gf.bg.ignoresSafeArea()
        Wordmark()
    }
}
