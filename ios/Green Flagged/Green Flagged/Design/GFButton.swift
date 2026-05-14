import SwiftUI

enum GFButtonStyle: Sendable {
    case solid
    case ghost
    case link
}

struct GFButton: View {
    let label: String
    var style: GFButtonStyle = .solid
    var showsArrow: Bool = true
    var isDisabled: Bool = false
    let action: () -> Void

    @State private var isPressed = false

    var body: some View {
        Button(action: action) {
            HStack(spacing: Spacing.s2) {
                Text(label)
                    .font(.gf.label)
                    .tracking(1.0)
                if showsArrow {
                    Text("→")
                        .font(.gf.mono)
                        .offset(x: isPressed ? 4 : 0)
                        .animation(.easeInOut(duration: 0.12), value: isPressed)
                }
            }
            .padding(.horizontal, Spacing.s4)
            .padding(.vertical, Spacing.s3)
            .frame(maxWidth: .infinity, alignment: .center)
            .background(background)
            .foregroundStyle(foreground)
            .overlay(border)
            .clipShape(RoundedRectangle(cornerRadius: Radius.sharp))
            .opacity(isDisabled ? 0.5 : 1.0)
        }
        .buttonStyle(.plain)
        .disabled(isDisabled)
        .simultaneousGesture(DragGesture(minimumDistance: 0)
            .onChanged { _ in isPressed = true }
            .onEnded { _ in isPressed = false }
        )
    }

    @ViewBuilder private var background: some View {
        switch style {
        case .solid: Color.gf.fg1
        case .ghost: Color.clear
        case .link:  Color.clear
        }
    }

    private var foreground: Color {
        switch style {
        case .solid: Color.gf.bg
        case .ghost: Color.gf.fg1
        case .link:  Color.gf.fg1
        }
    }

    @ViewBuilder private var border: some View {
        switch style {
        case .solid:
            EmptyView()
        case .ghost:
            RoundedRectangle(cornerRadius: Radius.sharp)
                .stroke(Color.gf.rule, lineWidth: 1)
        case .link:
            EmptyView()
        }
    }
}

#Preview {
    ZStack {
        Color.gf.bg.ignoresSafeArea()
        VStack(spacing: Spacing.s4) {
            GFButton(label: "SCAN A CONTRACT", style: .solid) {}
            GFButton(label: "DRAFT", style: .ghost) {}
            GFButton(label: "LEARN MORE", style: .link, showsArrow: false) {}
            GFButton(label: "DISABLED", style: .solid, isDisabled: true) {}
        }
        .padding()
    }
}
