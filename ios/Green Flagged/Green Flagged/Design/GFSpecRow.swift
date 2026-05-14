import SwiftUI

struct GFSpecRow: View {
    let key: String
    let value: String
    var valueColor: Color = Color.gf.fg1

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: Spacing.s2) {
            Text(key)
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg3)
            Leader()
                .frame(height: 1)
                .foregroundStyle(Color.gf.rule)
            Text(value)
                .font(.gf.mono)
                .foregroundStyle(valueColor)
        }
    }
}

private struct Leader: View {
    var body: some View {
        GeometryReader { geo in
            Path { p in
                let dot: CGFloat = 2
                let gap: CGFloat = 4
                var x: CGFloat = 0
                let y = geo.size.height / 2
                while x < geo.size.width {
                    p.addEllipse(in: CGRect(x: x, y: y - dot / 2, width: dot, height: dot))
                    x += dot + gap
                }
            }
            .fill(Color.gf.rule)
        }
    }
}

#Preview {
    ZStack {
        Color.gf.bg.ignoresSafeArea()
        VStack(spacing: Spacing.s3) {
            GFSpecRow(key: "STATUS", value: "READY · 248 KB")
            GFSpecRow(key: "TERM", value: "12 MONTHS")
            GFSpecRow(key: "VERDICT", value: "DO NOT SIGN", valueColor: Color.gf.sevRed)
        }
        .padding()
    }
}
