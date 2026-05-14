import SwiftUI

enum Severity: String, Codable, Sendable, CaseIterable {
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

    var color: Color {
        switch self {
        case .green:  Color.gf.sevGreen
        case .yellow: Color.gf.sevYellow
        case .orange: Color.gf.sevOrange
        case .red:    Color.gf.sevRed
        }
    }
}
