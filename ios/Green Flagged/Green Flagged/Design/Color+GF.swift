import SwiftUI

extension Color {
    enum gf {}
}

extension Color.gf {
    static let green50  = Color(hex: 0xEFF4F1)
    static let green100 = Color(hex: 0xDDE8E1)
    static let green200 = Color(hex: 0xBCD0C2)
    static let green300 = Color(hex: 0x94B5A1)
    static let green400 = Color(hex: 0x6E9882)
    static let green500 = Color(hex: 0x4A7A5C)
    static let green600 = Color(hex: 0x3F6A4F)
    static let green700 = Color(hex: 0x335640)
    static let green800 = Color(hex: 0x264130)
    static let green900 = Color(hex: 0x1A2D21)
    static let green950 = Color(hex: 0x0F1C14)

    static let bg          = Color(hex: 0x121212)
    static let surface     = Color(hex: 0x1A1A1A)
    static let surfaceElev = Color(hex: 0x222222)

    static let fg1 = Color(hex: 0xF2F0EC)
    static let fg2 = Color(hex: 0xB8B5AE)
    static let fg3 = Color(hex: 0x7E7B74)
    static let fg4 = Color(hex: 0x52504B)

    static let accent       = green300
    static let accentStrong = green500

    static let rule       = Color(hex: 0x2A2A2A)
    static let ruleStrong = Color(hex: 0x3A3A3A)
    static let ruleSoft   = Color(hex: 0x1F1F1F)

    static let sevGreen  = Color(hex: 0x4A7A5C)
    static let sevYellow = Color(hex: 0xFFD600)
    static let sevOrange = Color(hex: 0xFF8A1F)
    static let sevRed    = Color(hex: 0xFF3D5C)
}

extension Color {
    init(hex: UInt32, opacity: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }
}
