import Foundation

struct Contract: Codable, Sendable, Identifiable {
    let id: String
    let title: String
    let kind: String?
    let industry: String?
    let severity: Severity?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, title, kind, industry
        case severity  = "verdict_severity"
        case createdAt = "created_at"
    }
}
