import Foundation

/// `nonisolated` because the project defaults all types to MainActor; the
/// `Codable` synthesized init has to be callable from background actors.
nonisolated enum UsageKind: String, Codable, Sendable, CaseIterable {
    case scan
    case draft

    /// UPPERCASE label used in feeds and tags.
    var label: String {
        switch self {
        case .scan:  "SCAN"
        case .draft: "DRAFT"
        }
    }
}

/// `usage_events` row. The DB `id` column is `bigint`, surfaced here as `Int64`.
nonisolated struct UsageEvent: Codable, Sendable, Identifiable {
    let id: Int64
    let kind: UsageKind
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, kind
        case createdAt = "created_at"
    }
}
