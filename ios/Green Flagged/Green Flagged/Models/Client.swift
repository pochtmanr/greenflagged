import Foundation

/// `clients` row. Schema lives in
/// `landing/supabase/migrations/0004_clients_business.sql`. Same shape as
/// `BusinessProfile` minus `logo_path`, `tax_id`, `website`, `label`; plus
/// `notes`. `nonisolated` for the same reason as `BusinessProfile`.
nonisolated struct Client: Codable, Sendable, Identifiable, Hashable {
    let id: String
    let ownerId: String
    var firstName: String?
    var familyName: String?
    var businessName: String?
    var email: String?
    var phone: String?
    var countryCode: String?
    var city: String?
    var street: String?
    var postalCode: String?
    var notes: String?
    var isDefault: Bool
    let createdAt: String?
    let updatedAt: String?

    enum CodingKeys: String, CodingKey {
        case id
        case ownerId      = "owner_id"
        case firstName    = "first_name"
        case familyName   = "family_name"
        case businessName = "business_name"
        case email
        case phone
        case countryCode  = "country_code"
        case city
        case street
        case postalCode   = "postal_code"
        case notes
        case isDefault    = "is_default"
        case createdAt    = "created_at"
        case updatedAt    = "updated_at"
    }
}

/// Writable subset matching the web's POST/PATCH Zod schema in
/// `landing/app/api/clients/route.ts:12-27`. Custom `encode(to:)` uses
/// `encodeIfPresent` so nil fields are omitted rather than serialized as
/// explicit `null` — same reasoning as `BusinessProfileInput`.
nonisolated struct ClientInput: Encodable, Sendable {
    var firstName: String?
    var familyName: String?
    var businessName: String?
    var email: String?
    var phone: String?
    var countryCode: String?
    var city: String?
    var street: String?
    var postalCode: String?
    var notes: String?
    var isDefault: Bool?

    enum CodingKeys: String, CodingKey {
        case firstName    = "first_name"
        case familyName   = "family_name"
        case businessName = "business_name"
        case email
        case phone
        case countryCode  = "country_code"
        case city
        case street
        case postalCode   = "postal_code"
        case notes
        case isDefault    = "is_default"
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(firstName,    forKey: .firstName)
        try c.encodeIfPresent(familyName,   forKey: .familyName)
        try c.encodeIfPresent(businessName, forKey: .businessName)
        try c.encodeIfPresent(email,        forKey: .email)
        try c.encodeIfPresent(phone,        forKey: .phone)
        try c.encodeIfPresent(countryCode,  forKey: .countryCode)
        try c.encodeIfPresent(city,         forKey: .city)
        try c.encodeIfPresent(street,       forKey: .street)
        try c.encodeIfPresent(postalCode,   forKey: .postalCode)
        try c.encodeIfPresent(notes,        forKey: .notes)
        try c.encodeIfPresent(isDefault,    forKey: .isDefault)
    }
}
