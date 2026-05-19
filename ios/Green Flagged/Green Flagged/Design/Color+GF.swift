import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

// =====================================================================
// GreenFlagged iOS palette — mirrors landing/app/globals.css.
// Light theme is canonical. Dark theme tracks the web's data-theme="dark".
// =====================================================================

extension Color {
    enum gf {}
}

// MARK: - Primitives (identical in both modes)

extension Color.gf {
    // Sage palette — primary brand ramp.
    static let green50  = Color(hex: 0xEFF4F1)
    static let green100 = Color(hex: 0xDDE8E1)
    static let green200 = Color(hex: 0xBCD0C2)
    static let green300 = Color(hex: 0x94B5A1)
    static let green400 = Color(hex: 0x6E9882)
    static let green500 = Color(hex: 0x4A7A5C)   // primary
    static let green600 = Color(hex: 0x3F6A4F)
    static let green700 = Color(hex: 0x335640)
    static let green800 = Color(hex: 0x264130)
    static let green900 = Color(hex: 0x1A2D21)
    static let green950 = Color(hex: 0x0F1C14)

    // Paper neutrals — warm canvas.
    static let paper0   = Color(hex: 0xFFFFFF)
    static let paper50  = Color(hex: 0xFBFAF6)
    static let paper100 = Color(hex: 0xF5F3EC)
    static let paper200 = Color(hex: 0xECE9DF)
    static let paper300 = Color(hex: 0xD9D5C7)
    static let paper400 = Color(hex: 0xB8B3A1)

    // Ink — deep warm neutrals.
    static let ink100 = Color(hex: 0x6B6B5E)
    static let ink200 = Color(hex: 0x4E4F45)
    static let ink300 = Color(hex: 0x2C2F28)
    static let ink400 = Color(hex: 0x141713)
    static let ink500 = Color(hex: 0x0B0E0B)
}

// MARK: - Severity (signal only — same hex in both modes)

extension Color.gf {
    static let sevGreen      = Color(hex: 0x4A7A5C)
    static let sevYellow     = Color(hex: 0xC99A0E)
    static let sevOrange     = Color(hex: 0xC8651E)
    static let sevRed        = Color(hex: 0xB7263A)
    static let sevGreenTint  = Color(hex: 0xE8F0EA)
    static let sevYellowTint = Color(hex: 0xFBF1D9)
    static let sevOrangeTint = Color(hex: 0xFBE6D5)
    static let sevRedTint    = Color(hex: 0xF6D8DC)
}

// MARK: - Semantic roles (dynamic — resolve per appearance)

extension Color.gf {
    // Background canvas.
    static let bg = Color.dynamic(
        light: Color(hex: 0xFBFAF6),                              // paper-50
        dark:  Color(hex: 0x0E110F)
    )

    // Card / sheet surface.
    static let surface = Color.dynamic(
        light: Color(hex: 0xFFFFFF),                              // paper-0
        dark:  Color(hex: 0x141816)
    )

    // Elevated surface (inputs, hovered rows).
    static let surfaceElev = Color.dynamic(
        light: Color(hex: 0xF5F3EC),                              // paper-100
        dark:  Color(hex: 0x181D1A)
    )

    // Sunken surface (groove / well).
    static let surfaceSunken = Color.dynamic(
        light: Color(hex: 0xF5F3EC),                              // paper-100
        dark:  Color(hex: 0x0B0E0C)
    )

    // Foregrounds.
    static let fg1 = Color.dynamic(
        light: Color(hex: 0x0B0E0B),                              // ink-500
        dark:  Color(hex: 0xF0EEE6)
    )
    static let fg2 = Color.dynamic(
        light: Color(hex: 0x2C2F28),                              // ink-300
        dark:  Color(hex: 0xD8D5C9)
    )
    static let fg3 = Color.dynamic(
        light: Color(hex: 0x4E4F45),                              // ink-200
        dark:  Color(hex: 0x9AA095)
    )
    static let fg4 = Color.dynamic(
        light: Color(hex: 0x6B6B5E),                              // ink-100
        dark:  Color(hex: 0x6E7468)
    )

    // Inverse foreground (text on solid accent backgrounds).
    static let fgInv = Color.dynamic(
        light: Color(hex: 0xFBFAF6),                              // paper-50
        dark:  Color(hex: 0x0B0E0B)
    )

    // Accent — sage green. Lighter in dark mode for legibility.
    static let accent = Color.dynamic(
        light: Color(hex: 0x4A7A5C),                              // green-500
        dark:  Color(hex: 0x94B5A1)                               // green-300
    )
    static let accentStrong = Color.dynamic(
        light: Color(hex: 0x335640),                              // green-700
        dark:  Color(hex: 0xBCD0C2)                               // green-200
    )
    static let accentTint = Color.dynamic(
        light: Color(hex: 0xEFF4F1),                              // green-50
        dark:  Color(hex: 0x94B5A1, opacity: 0.12)                // rgba(148,181,161,0.12)
    )

    // Rules / dividers.
    // Web dark `--rule` is rgba(240,238,230,0.12); light is solid paper-300.
    static let rule = Color.dynamic(
        light: Color(hex: 0xD9D5C7),                              // paper-300
        dark:  Color(hex: 0xF0EEE6, opacity: 0.12)
    )
    static let ruleStrong = Color.dynamic(
        light: Color(hex: 0x0B0E0B),                              // ink-500
        dark:  Color(hex: 0xF0EEE6)
    )
    static let ruleSoft = Color.dynamic(
        light: Color(hex: 0xECE9DF),                              // paper-200
        dark:  Color(hex: 0xF0EEE6, opacity: 0.07)
    )
}

// MARK: - Helpers

extension Color {
    /// Bit-packed sRGB hex initializer with optional alpha. e.g. `Color(hex: 0x4A7A5C)`.
    init(hex: UInt32, opacity: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >> 8) & 0xFF) / 255.0
        let b = Double(hex & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }

    /// Build a SwiftUI `Color` that resolves dynamically per UI appearance.
    /// On non-UIKit platforms (e.g. macOS previews), defaults to the light value.
    static func dynamic(light: Color, dark: Color) -> Color {
        #if canImport(UIKit)
        return Color(UIColor { traits in
            traits.userInterfaceStyle == .dark
                ? UIColor(dark)
                : UIColor(light)
        })
        #else
        return light
        #endif
    }
}
