import SwiftUI

/// User-facing appearance preference, persisted via `@AppStorage("gf-theme")`.
///
/// The picker UI itself lives in `SettingsView` (owned by Prompt C). This file
/// owns only the storage primitive and the mapping to SwiftUI's `ColorScheme`.
enum ThemePreference: String, CaseIterable, Identifiable, Sendable {
    case system
    case light
    case dark

    var id: String { rawValue }

    /// `nil` means "follow the system" — SwiftUI's `.preferredColorScheme(nil)`
    /// hands control back to the OS appearance.
    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light:  return .light
        case .dark:   return .dark
        }
    }

    /// UPPERCASE mono label, matches the rest of the app's chrome.
    var label: String {
        switch self {
        case .system: return "SYSTEM"
        case .light:  return "LIGHT"
        case .dark:   return "DARK"
        }
    }
}
