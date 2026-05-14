import Foundation

struct Profile: Codable, Sendable, Identifiable {
    let id: String
    let email: String
    let firstName: String?
    let accountType: String?
    let country: String?
    let businessName: String?
    let onboardedAt: Date?
    let planType: String?

    enum CodingKeys: String, CodingKey {
        case id = "user_id"
        case email
        case firstName    = "first_name"
        case accountType  = "account_type"
        case country
        case businessName = "business_name"
        case onboardedAt  = "onboarded_at"
        case planType     = "plan_type"
    }
}
