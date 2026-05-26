import Foundation

/// Canonical taxonomy domains the AI review writes into `scans.taxonomy`.
/// Mirrors `landing/components/contracts/severity.ts` (web is canon).
/// Old `scans` rows may carry keys outside this list; renderers should still
/// display them — see the extras handling in `VerdictView`.
nonisolated enum TaxonomyKey: String, Codable, Sendable, CaseIterable {
    case ipOwnership   = "ip_ownership"
    case paymentTerms  = "payment_terms"
    case termination   = "termination"
    case ndaScope      = "nda_scope"
    case liabilityCap  = "liability_cap"
    case jurisdiction  = "jurisdiction"
    case autoRenewal   = "auto_renewal"
    case killFees      = "kill_fees"
    case exclusivity   = "exclusivity"

    var label: String {
        switch self {
        case .ipOwnership:  "IP OWNERSHIP"
        case .paymentTerms: "PAYMENT TERMS"
        case .termination:  "TERMINATION"
        case .ndaScope:     "NDA SCOPE"
        case .liabilityCap: "LIABILITY CAP"
        case .jurisdiction: "JURISDICTION"
        case .autoRenewal:  "AUTO-RENEWAL"
        case .killFees:     "KILL FEES"
        case .exclusivity:  "EXCLUSIVITY"
        }
    }

    /// Loose-grouping the verdict screen uses to bucket chips into rows.
    /// Domains share a row when they share a `domain`.
    var domain: TaxonomyDomain {
        switch self {
        case .ipOwnership, .ndaScope, .exclusivity:    .ipAndConfidentiality
        case .paymentTerms, .killFees:                 .commercials
        case .termination, .autoRenewal:               .lifecycle
        case .liabilityCap, .jurisdiction:             .legalProtections
        }
    }
}

nonisolated enum TaxonomyDomain: String, CaseIterable, Sendable {
    case ipAndConfidentiality
    case commercials
    case lifecycle
    case legalProtections

    var label: String {
        switch self {
        case .ipAndConfidentiality: "IP · CONFIDENTIALITY"
        case .commercials:          "COMMERCIALS"
        case .lifecycle:             "LIFECYCLE"
        case .legalProtections:      "LEGAL PROTECTIONS"
        }
    }
}
