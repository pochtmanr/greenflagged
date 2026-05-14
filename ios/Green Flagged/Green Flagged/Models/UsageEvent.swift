import Foundation

enum UsageKind: String, Codable, Sendable {
    case scan
    case draft
}

struct UsageEvent: Codable, Sendable, Identifiable {
    let id: String
    let kind: UsageKind
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, kind
        case createdAt = "created_at"
    }
}
