import SwiftUI

struct Wordmark: View {
    var body: some View {
        HStack(spacing: Spacing.s2) {
            Text("GREEN")
                .font(.gf.label)
                .tracking(1.2)
                .foregroundStyle(Color.gf.fg1)
            Text("FLAGGED")
                .font(.gf.label)
                .tracking(1.2)
                .foregroundStyle(Color.gf.fg1)
        }
    }
}

struct BrandMark: View {
    var logoSize: CGFloat = 64

    var body: some View {
        VStack(spacing: Spacing.s4) {
            Image("BrandLogo")
                .resizable()
                .renderingMode(.template)
                .foregroundStyle(Color.gf.accent)
                .scaledToFit()
                .frame(width: logoSize, height: logoSize)
            Wordmark()
        }
    }
}

#Preview {
    ZStack {
        Color.gf.bg.ignoresSafeArea()
        BrandMark()
    }
}
