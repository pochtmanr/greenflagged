import Foundation

enum PlanType: String, Codable, Sendable {
    case free
    case standard
}

struct Plan: Codable, Sendable {
    let type: PlanType
    let scansThisMonth: Int
    let creditsRemaining: Int

    enum CodingKeys: String, CodingKey {
        case type             = "plan_type"
        case scansThisMonth   = "scans_this_month"
        case creditsRemaining = "credits_remaining"
    }
}
