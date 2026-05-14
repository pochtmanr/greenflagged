import Foundation

// TODO Phase 5 — finalize taxonomy domains from claude/ios/screens.md.
// Mirrors the web-side taxonomy keys used in the verdict spec.
enum TaxonomyKey: String, Codable, Sendable, CaseIterable {
    case payment
    case ip
    case term
    case nonCompete   = "non_compete"
    case liability
    case termination
    case dispute
    case confidentiality
    case other

    var label: String {
        switch self {
        case .payment:         "PAYMENT"
        case .ip:              "INTELLECTUAL PROPERTY"
        case .term:            "TERM"
        case .nonCompete:      "NON-COMPETE"
        case .liability:       "LIABILITY"
        case .termination:     "TERMINATION"
        case .dispute:         "DISPUTE RESOLUTION"
        case .confidentiality: "CONFIDENTIALITY"
        case .other:           "OTHER"
        }
    }
}
