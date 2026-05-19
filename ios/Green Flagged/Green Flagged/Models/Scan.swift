import Foundation

/// Mirrors a `scans` table row. The web is canonical for column names — see
/// `landing/lib/ai/review.ts` for the `taxonomy` / `redlines` JSON shape and
/// `landing/lib/supabase/types.ts` for the row contract.
///
/// `taxonomy` keys are dynamic per-contract (the model writes a fixed set of
/// canonical keys, but old rows may have fewer). `redlines` arrives already
/// sorted server-side, red first — never resort in the client.
struct ScanResult: Decodable, Sendable {
    let contractId: String
    let verdictMd: String
    let taxonomy: [String: TaxonomyEntry]
    let redlines: [Redline]
    let sourceText: String

    enum CodingKeys: String, CodingKey {
        case contractId = "contract_id"
        case verdictMd  = "verdict_md"
        case taxonomy
        case redlines
        case sourceText = "source_text"
    }
}

/// One entry in `scans.taxonomy`. All fields are optional on the wire — old
/// rows occasionally omit `summary` or `severity`, so the decoder must
/// tolerate that. Web-side coercer defaults `present` to `false`, so we mirror.
struct TaxonomyEntry: Decodable, Sendable {
    let present: Bool?
    let summary: String?
    let severity: Severity?
}

/// One entry in `scans.redlines`. Identifiable for SwiftUI `ForEach`; the
/// stable identity is local-only (UUID per decode) because the server stores
/// these as positional JSON without ids.
struct Redline: Decodable, Sendable, Identifiable {
    let id = UUID()
    let clauseExcerpt: String
    let issue: String
    let suggestion: String
    let severity: Severity

    enum CodingKeys: String, CodingKey {
        case clauseExcerpt = "clause_excerpt"
        case issue
        case suggestion
        case severity
    }
}
