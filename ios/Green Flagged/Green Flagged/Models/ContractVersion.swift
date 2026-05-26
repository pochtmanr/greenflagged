import Foundation

/// One row from `public.contract_versions`. Mirrors the columns iOS surfaces
/// in the version-history sheet — the table holds more (style, parties, …)
/// that we don't need on this screen.
struct ContractVersion: Decodable, Sendable, Identifiable {
    let id: String
    let version: Int
    let createdAt: Date
    let bodyMd: String?

    enum CodingKeys: String, CodingKey {
        case id
        case version
        case createdAt = "created_at"
        case bodyMd    = "body_md"
    }
}
