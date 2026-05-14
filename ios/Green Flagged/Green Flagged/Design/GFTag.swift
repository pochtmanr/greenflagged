import SwiftUI

struct GFTag: View {
    let label: String
    var severity: Severity? = nil

    var body: some View {
        Text("[\(label)]")
            .font(.gf.label)
            .tracking(1.0)
            .foregroundStyle(textColor)
            .padding(.horizontal, Spacing.s2)
            .padding(.vertical, Spacing.s1)
            .overlay(
                RoundedRectangle(cornerRadius: Radius.sharp)
                    .stroke(borderColor, lineWidth: 1)
            )
    }

    private var textColor: Color {
        severity?.color ?? Color.gf.fg2
    }

    private var borderColor: Color {
        severity?.color ?? Color.gf.rule
    }
}

#Preview {
    ZStack {
        Color.gf.bg.ignoresSafeArea()
        VStack(spacing: Spacing.s3) {
            GFTag(label: "NEW")
            GFTag(label: "DO NOT SIGN", severity: .red)
            GFTag(label: "MINOR ISSUES", severity: .yellow)
            GFTag(label: "GREEN FLAGGED", severity: .green)
        }
    }
}
