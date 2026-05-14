import Foundation

struct Scan: Codable, Sendable {
    let contractId: String
    let verdictMd: String?
    let taxonomy: [String: TaxEntry]?
    let redlines: [Redline]?

    enum CodingKeys: String, CodingKey {
        case contractId = "contract_id"
        case verdictMd  = "verdict_md"
        case taxonomy, redlines
    }
}

struct TaxEntry: Codable, Sendable {
    let summary: String?
    let severity: Severity?
}

struct Redline: Codable, Sendable, Identifiable {
    let id: String
    let title: String
    let original: String
    let proposed: String
    let severity: Severity
}
