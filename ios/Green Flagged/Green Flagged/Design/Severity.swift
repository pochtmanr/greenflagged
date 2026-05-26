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

    /// Pale-fill counterpart of `color`, used for severity hero stripes and
    /// chip backgrounds. Shared by VerdictView + ContractDetailView.
    @MainActor
    var tint: Color {
        switch self {
        case .green:  Color.gf.sevGreenTint
        case .yellow: Color.gf.sevYellowTint
        case .orange: Color.gf.sevOrangeTint
        case .red:    Color.gf.sevRedTint
        }
    }

    /// 4-letter mono token used inside `GFTag` chips and PDF headers.
    var shortLabel: String {
        switch self {
        case .green:  "OK"
        case .yellow: "WARN"
        case .orange: "HIGH"
        case .red:    "CRITICAL"
        }
    }
}
