import Foundation

/// Snapshot of the data the dashboard needs to render. Built fresh on each
/// load — there is no `.preview` here; the dashboard always shows real data
/// or an explicit empty / error state.
struct DashboardData: Sendable {
    let profile: Profile?
    let contracts: [Contract]
    let scansThisMonth: Int
    let draftsThisMonth: Int
    let recentUsage: [UsageEvent]

    /// Display name for the greeting line. Falls back through:
    /// `business_name` → user email local-part → "there".
    func greetingName(email: String?) -> String {
        if let name = profile?.businessName?.trimmingCharacters(in: .whitespacesAndNewlines),
           !name.isEmpty {
            return name
        }
        if let local = email?.split(separator: "@").first, !local.isEmpty {
            return Self.titleCase(String(local))
        }
        return "there"
    }

    /// Convenience — total billable events this month. Used in the usage
    /// meter when we don't yet have a `subscriptions` row to derive a quota.
    var totalUsedThisMonth: Int { scansThisMonth + draftsThisMonth }

    private static func titleCase(_ input: String) -> String {
        let normalized = input
            .replacingOccurrences(of: ".", with: " ")
            .replacingOccurrences(of: "_", with: " ")
            .replacingOccurrences(of: "-", with: " ")
        return normalized
            .split(separator: " ")
            .map { piece -> String in
                guard let first = piece.first else { return "" }
                return first.uppercased() + piece.dropFirst()
            }
            .joined(separator: " ")
    }
}
