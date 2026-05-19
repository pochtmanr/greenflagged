import SwiftUI

/// `nonisolated` so the synthesized `Codable` conformance is callable from
/// the background actors that run our PostgREST repositories. The
/// view-facing `color` getter is then re-isolated to `MainActor` because it
/// reads `Color.gf.sev*` static colors that the project defaults to that
/// actor.
nonisolated enum Severity: String, Codable, Sendable, CaseIterable {
    case green
    case yellow
    case orange
    case red

    var label: String {
        switch self {
        case .green:  "GREEN FLAGGED"
        case .yellow: "MINOR ISSUES"
        case .orange: "RED FLAGS"
        case .red:    "DO NOT SIGN"
        }
    }

    @MainActor
    var color: Color {
        switch self {
        case .green:  Color.gf.sevGreen
        case .yellow: Color.gf.sevYellow
        case .orange: Color.gf.sevOrange
        case .red:    Color.gf.sevRed
        }
    }
}
