import Foundation
import Observation
import Supabase

/// Source of truth for the iOS UI on subscription status + remaining PAYG
/// credits. Reads Supabase first (`subscriptions`, `credits`); falls back to
/// RevenueCat's local `customerInfo.entitlements` only when the Supabase read
/// fails (offline, RLS hiccup). Supabase is canonical because the web also
/// writes to the same tables — a Standard subscriber on web sees Standard on
/// iOS without re-purchasing.
@MainActor
@Observable
final class EntitlementGate {
    static let shared = EntitlementGate()

    enum RefreshReason: Sendable {
        case appLaunch
        case sessionChange
        case revenueCatUpdate
        case purchaseCompleted
        case manual
    }

    // MARK: - Public state

    private(set) var isStandard: Bool = false
    private(set) var creditsRemaining: Int = 0
    private(set) var currentPeriodEnd: Date?
    private(set) var cancelAtPeriodEnd: Bool = false
    private(set) var isLoading: Bool = false
    private(set) var didFallBackToRevenueCat: Bool = false
    private(set) var lastRefreshAt: Date?

    /// True when the user is entitled to a contract scan right now —
    /// Standard plan covers it (quota lives server-side) OR they have at least
    /// one PAYG credit left.
    var canScan: Bool { isStandard || creditsRemaining > 0 }

    // MARK: - Decoder shapes (match the DB columns)

    private struct SubscriptionRow: Decodable {
        let plan: String
        let status: String
        let current_period_end: String?
        let cancel_at_period_end: Bool?
    }

    private struct CreditRow: Decodable {
        let contracts_remaining: Int
    }

    // MARK: - Refresh

    func refresh(reason: RefreshReason = .manual) async {
        isLoading = true
        defer {
            isLoading = false
            lastRefreshAt = Date()
        }

        do {
            try await loadFromSupabase()
            didFallBackToRevenueCat = false
        } catch {
            // Network or RLS failure — fall back to RC's local view so the
            // user isn't locked out of features they actually paid for.
            applyRevenueCatFallback()
            didFallBackToRevenueCat = true
            #if DEBUG
            NSLog("[EntitlementGate] Supabase refresh failed (%@), using RC fallback. Reason: %@", error.localizedDescription, String(describing: reason))
            #endif
        }
    }

    func reset() {
        isStandard = false
        creditsRemaining = 0
        currentPeriodEnd = nil
        cancelAtPeriodEnd = false
        didFallBackToRevenueCat = false
    }

    // MARK: - Private

    private func loadFromSupabase() async throws {
        let client = SupabaseService.shared
        let nowIso = ISO8601DateFormatter().string(from: Date())

        async let subscriptionTask: [SubscriptionRow] = try await client
            .from("subscriptions")
            .select("plan,status,current_period_end,cancel_at_period_end")
            .limit(1)
            .execute()
            .value

        async let creditsTask: [CreditRow] = try await client
            .from("credits")
            .select("contracts_remaining")
            .gt("expires_at", value: nowIso)
            .gt("contracts_remaining", value: 0)
            .execute()
            .value

        let (subs, credits) = try await (subscriptionTask, creditsTask)

        if let row = subs.first {
            let standardActive = row.plan == "standard" &&
                (row.status == "active" || row.status == "trialing")
            let periodEnd = row.current_period_end.flatMap { ISO8601DateFormatter().date(from: $0) }
            let stillInPeriod = periodEnd.map { $0 > Date() } ?? false
            isStandard = standardActive && stillInPeriod
            currentPeriodEnd = periodEnd
            cancelAtPeriodEnd = row.cancel_at_period_end ?? false
        } else {
            isStandard = false
            currentPeriodEnd = nil
            cancelAtPeriodEnd = false
        }

        creditsRemaining = credits.reduce(0) { $0 + $1.contracts_remaining }
    }

    private func applyRevenueCatFallback() {
        isStandard = RevenueCatService.shared.hasActiveStandardEntitlement
        creditsRemaining = 0
        currentPeriodEnd = nil
        cancelAtPeriodEnd = false
    }
}
