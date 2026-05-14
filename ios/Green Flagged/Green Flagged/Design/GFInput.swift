import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

struct GFInput: View {
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false
    var keyboard: UIKeyboardType = .default
    var textContentType: UITextContentType? = nil

    @FocusState private var focused: Bool

    var body: some View {
        Group {
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
            }
        }
        .font(.gf.body)
        .foregroundStyle(Color.gf.fg1)
        .textInputAutocapitalization(.never)
        .autocorrectionDisabled(true)
        .keyboardType(keyboard)
        .textContentType(textContentType)
        .focused($focused)
        .padding(.horizontal, Spacing.s3)
        .padding(.vertical, Spacing.s3)
        .background(Color.gf.surfaceElev)
        .overlay(
            RoundedRectangle(cornerRadius: Radius.sharp)
                .stroke(focused ? Color.gf.accent : Color.gf.rule, lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: Radius.sharp))
    }
}

#Preview {
    @Previewable @State var email = ""
    @Previewable @State var password = ""
    return ZStack {
        Color.gf.bg.ignoresSafeArea()
        VStack(spacing: Spacing.s3) {
            GFInput(placeholder: "Email", text: $email, keyboard: .emailAddress, textContentType: .emailAddress)
            GFInput(placeholder: "Password", text: $password, isSecure: true, textContentType: .password)
        }
        .padding()
    }
}
