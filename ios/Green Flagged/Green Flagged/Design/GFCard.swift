import SwiftUI

struct GFCard<Content: View>: View {
    var padding: CGFloat = Spacing.s4
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(padding)
            .background(Color.gf.surface)
            .overlay(
                RoundedRectangle(cornerRadius: Radius.sharp)
                    .stroke(Color.gf.rule, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: Radius.sharp))
    }
}

#Preview {
    ZStack {
        Color.gf.bg.ignoresSafeArea()
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s2) {
                Text("// CARD HEADING")
                    .font(.gf.label)
                    .foregroundStyle(Color.gf.fg3)
                Text("Card body text in Inter regular.")
                    .font(.gf.body)
                    .foregroundStyle(Color.gf.fg1)
            }
        }
        .padding()
    }
}
