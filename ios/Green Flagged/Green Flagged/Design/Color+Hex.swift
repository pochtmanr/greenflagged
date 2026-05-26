import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

/// `Color(hex:)` initializer + `hexString` accessor used by the contract
/// style editor to round-trip the brand color through SwiftUI's `ColorPicker`.
/// The bit-packed `Color(hex: UInt32)` variant lives in `Color+GF.swift`.
extension Color {
    /// Parse a 3- or 6-digit hex string. Tolerates leading `#`, whitespace,
    /// and mixed case. Returns nil on anything else so callers can fall back
    /// to a default accent.
    init?(hex: String) {
        let trimmed = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        var raw = trimmed.hasPrefix("#") ? String(trimmed.dropFirst()) : trimmed

        if raw.count == 3 {
            raw = raw.map { "\($0)\($0)" }.joined()
        }
        guard raw.count == 6, let value = UInt32(raw, radix: 16) else { return nil }
        let r = Double((value >> 16) & 0xFF) / 255.0
        let g = Double((value >> 8) & 0xFF) / 255.0
        let b = Double(value & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: 1.0)
    }

    /// Render the resolved sRGB color as `#RRGGBB`. Used to persist the
    /// `ColorPicker` selection back into `ContractStyle.brandColor`.
    /// Returns nil on non-UIKit platforms (previews on macOS).
    var hexString: String? {
        #if canImport(UIKit)
        var r: CGFloat = 0, g: CGFloat = 0, b: CGFloat = 0, a: CGFloat = 0
        guard UIColor(self).getRed(&r, green: &g, blue: &b, alpha: &a) else {
            return nil
        }
        let ri = Int(round(max(0, min(1, r)) * 255))
        let gi = Int(round(max(0, min(1, g)) * 255))
        let bi = Int(round(max(0, min(1, b)) * 255))
        return String(format: "#%02X%02X%02X", ri, gi, bi)
        #else
        return nil
        #endif
    }
}
