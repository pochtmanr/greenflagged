import SwiftUI

struct GFFrame<Content: View>: View {
    var padding: CGFloat = Spacing.s4
    var bracketSize: CGFloat = 12
    var bracketColor: Color = Color.gf.fg2
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .padding(padding)
            .background(Color.gf.surface)
            .overlay(CornerBrackets(size: bracketSize, color: bracketColor, lineWidth: 1))
    }
}

private struct CornerBrackets: View {
    let size: CGFloat
    let color: Color
    let lineWidth: CGFloat

    var body: some View {
        GeometryReader { geo in
            let w = geo.size.width
            let h = geo.size.height
            Path { p in
                // top-left
                p.move(to: CGPoint(x: 0, y: size))
                p.addLine(to: CGPoint(x: 0, y: 0))
                p.addLine(to: CGPoint(x: size, y: 0))
                // top-right
                p.move(to: CGPoint(x: w - size, y: 0))
                p.addLine(to: CGPoint(x: w, y: 0))
                p.addLine(to: CGPoint(x: w, y: size))
                // bottom-right
                p.move(to: CGPoint(x: w, y: h - size))
                p.addLine(to: CGPoint(x: w, y: h))
                p.addLine(to: CGPoint(x: w - size, y: h))
                // bottom-left
                p.move(to: CGPoint(x: size, y: h))
                p.addLine(to: CGPoint(x: 0, y: h))
                p.addLine(to: CGPoint(x: 0, y: h - size))
            }
            .stroke(color, lineWidth: lineWidth)
        }
    }
}

#Preview {
    ZStack {
        Color.gf.bg.ignoresSafeArea()
        GFFrame {
            VStack(alignment: .leading, spacing: Spacing.s2) {
                Text("// FRAME LABEL")
                    .font(.gf.label)
                    .foregroundStyle(Color.gf.fg3)
                Text("Corner-bracketed frame content.")
                    .font(.gf.body)
                    .foregroundStyle(Color.gf.fg1)
            }
        }
        .padding()
    }
}
