import Foundation

/// `nonisolated` because the project defaults all types to MainActor; the
/// `Codable` synthesized init has to be callable from background actors.
nonisolated enum ContractKind: String, Codable, Sendable, CaseIterable {
    case scanned
    case drafted
}

/// `contracts` row. Mirrors `landing/lib/supabase/types.ts` exactly — web is
/// canon for column names.
struct Contract: Codable, Sendable, Identifiable {
    let id: String
    let ownerId: String?
    let kind: ContractKind?
    let industry: String?
    let title: String?
    let storagePath: String?
    let severity: Severity?
    let createdAt: Date
    let retentionUntil: Date?
    /// Branded styling chosen for this contract. Nil until the user opens the
    /// editor and saves once — callers should fall back to `ContractStyle.default`.
    let style: ContractStyle?
    /// Business profile attached to this contract (drives logo + header info
    /// in the styled preview / PDF). String to keep flexibility for non-UUID
    /// fixtures; convert at the boundary.
    let businessProfileId: String?

    /// Convenience accessor — falls back to a placeholder rather than crashing
    /// when a draft hasn't been titled yet.
    var displayTitle: String {
        let trimmed = title?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return trimmed.isEmpty ? "Untitled contract" : trimmed
    }

    enum CodingKeys: String, CodingKey {
        case id
        case ownerId           = "owner_id"
        case kind
        case industry
        case title
        case storagePath       = "storage_path"
        case severity          = "verdict_severity"
        case createdAt         = "created_at"
        case retentionUntil    = "retention_until"
        case style
        case businessProfileId = "business_profile_id"
    }
}
