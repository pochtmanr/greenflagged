import Foundation

/// Account-type taxonomy. Mirrors the web's `AccountType` union from
/// `landing/lib/supabase/types.ts` — exact strings are wire-format and must
/// not drift from the DB enum.
///
/// `nonisolated` because the project sets `SWIFT_DEFAULT_ACTOR_ISOLATION =
/// MainActor`, which would otherwise force `Codable`/`Sendable` conformance
/// onto the main actor and break decoding inside background actors.
enum AccountType: String, Codable, Sendable, CaseIterable, Identifiable {
    case solo
    case freelancer
    case business

    var id: String { rawValue }

    /// UPPERCASE mono label used everywhere in the GF chrome.
    var label: String {
        switch self {
        case .solo:       "SOLO"
        case .freelancer: "FREELANCER"
        case .business:   "BUSINESS"
        }
    }
}

/// `profiles` row. Column names are canonical from
/// `landing/lib/supabase/types.ts` — do not rename without coordinating with
/// the web schema. `nonisolated` for the same reason as `AccountType` above.
nonisolated struct Profile: Codable, Sendable, Identifiable {
    let userId: String
    let accountType: AccountType?
    let countryCode: String?
    let businessName: String?
    let industries: [String]?
    let onboardedAt: Date?
    let createdAt: Date?
    let updatedAt: Date?

    /// `Identifiable` conformance — uses the primary key `user_id`.
    var id: String { userId }

    enum CodingKeys: String, CodingKey {
        case userId       = "user_id"
        case accountType  = "account_type"
        case countryCode  = "country_code"
        case businessName = "business_name"
        case industries
        case onboardedAt  = "onboarded_at"
        case createdAt    = "created_at"
        case updatedAt    = "updated_at"
    }
}
