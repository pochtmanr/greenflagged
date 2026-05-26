import Foundation

/// `business_profiles` row. Schema lives in
/// `landing/supabase/migrations/0004_clients_business.sql`. Field names must
/// match the DB columns exactly — they're wire-format for the GET/PATCH JSON.
///
/// `nonisolated` because `SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor` would
/// otherwise force `Codable`/`Sendable` onto the main actor and break decoding
/// inside background actors (APIClient).
nonisolated struct BusinessProfile: Codable, Sendable, Identifiable, Hashable {
    let id: String
    let ownerId: String
    var firstName: String?
    var familyName: String?
    var businessName: String?
    var label: String?
    var taxId: String?
    var email: String?
    var phone: String?
    var website: String?
    var countryCode: String?
    var city: String?
    var street: String?
    var postalCode: String?
    var logoPath: String?
    var isDefault: Bool
    let createdAt: String?
    let updatedAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case ownerId      = "owner_id"
        case firstName    = "first_name"
        case familyName   = "family_name"
        case businessName = "business_name"
        case label
        case taxId        = "tax_id"
        case email
        case phone
        case website
        case countryCode  = "country_code"
        case city
        case street
        case postalCode   = "postal_code"
        case logoPath     = "logo_path"
        case isDefault    = "is_default"
        case createdAt    = "created_at"
        case updatedAt    = "updated_at"
    }
}

/// Writable subset matching the web's POST/PATCH Zod schema in
/// `landing/app/api/business-profiles/route.ts:11-28`. All fields optional so
/// the same struct serves both create and patch — the server validates which
/// are required.
///
/// `encode(to:)` is hand-rolled to use `encodeIfPresent`, which omits nil
/// fields entirely. The default `Encodable` synthesis emits explicit `null`
/// for nil optionals, but the server PATCH schema enforces `min(1)` on
/// non-nullable string fields (`first_name`, `family_name`, …) — sending
/// `null` there would fail validation. Skipping the key matches the web
/// form's partial-update semantics.
nonisolated struct BusinessProfileInput: Encodable, Sendable {
    var firstName: String?
    var familyName: String?
    var businessName: String?
    var taxId: String?
    var email: String?
    var phone: String?
    var website: String?
    var countryCode: String?
    var city: String?
    var street: String?
    var postalCode: String?
    var label: String?
    var isDefault: Bool?

    enum CodingKeys: String, CodingKey {
        case firstName    = "first_name"
        case familyName   = "family_name"
        case businessName = "business_name"
        case taxId        = "tax_id"
        case email
        case phone
        case website
        case countryCode  = "country_code"
        case city
        case street
        case postalCode   = "postal_code"
        case label
        case isDefault    = "is_default"
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(firstName,    forKey: .firstName)
        try c.encodeIfPresent(familyName,   forKey: .familyName)
        try c.encodeIfPresent(businessName, forKey: .businessName)
        try c.encodeIfPresent(taxId,        forKey: .taxId)
        try c.encodeIfPresent(email,        forKey: .email)
        try c.encodeIfPresent(phone,        forKey: .phone)
        try c.encodeIfPresent(website,      forKey: .website)
        try c.encodeIfPresent(countryCode,  forKey: .countryCode)
        try c.encodeIfPresent(city,         forKey: .city)
        try c.encodeIfPresent(street,       forKey: .street)
        try c.encodeIfPresent(postalCode,   forKey: .postalCode)
        try c.encodeIfPresent(label,        forKey: .label)
        try c.encodeIfPresent(isDefault,    forKey: .isDefault)
    }
}
