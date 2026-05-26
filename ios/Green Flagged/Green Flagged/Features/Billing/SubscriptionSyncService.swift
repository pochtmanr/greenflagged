import Foundation
import Supabase

/// Result of a Supabase RPC reconciliation call.
enum ClaimResult: Sendable, Equatable {
    /// RPC accepted; subscription/credit row is now bound to the current user.
    case success
    /// Subscription already bound to a different Supabase user. `owner` is the
    /// rejected uuid string (logged for debugging — the UI shows a generic
    /// "switch account" message, not the raw id).
    case rejected(owner: String)
    /// RPC returned a non-rejection failure (network, transient DB error, etc.).
    case error(String)
}

/// Server-side reconciliation for Apple IAP purchases. Calls the
/// `claim_apple_subscription` and `claim_apple_payg` SQL RPCs.
///
/// Idempotency lives in the SQL (UNIQUE index on `apple_transaction_id` /
/// `apple_original_transaction_id`). This client throttles redundant calls
/// within a 30 second window to keep the network quiet when delegate updates
/// and explicit purchase flows overlap.
@MainActor
final class SubscriptionSyncService {
    static let shared = SubscriptionSyncService()

    private var lastKey: String = ""
    private var lastSentAt: Date = .distantPast
    private let throttleInterval: TimeInterval = 30

    // MARK: - Subscription

    @discardableResult
    func claimSubscription(
        originalTransactionId: String,
        productID: String,
        expiresAt: Date
    ) async -> ClaimResult {
        let key = "sub:\(originalTransactionId):\(Int(expiresAt.timeIntervalSince1970))"
        if shouldThrottle(key: key) { return .success }

        struct Params: Encodable {
            let p_original_transaction_id: String
            let p_product_id: String
            let p_expires_at: String
        }

        let params = Params(
            p_original_transaction_id: originalTransactionId,
            p_product_id: productID,
            p_expires_at: ISO8601DateFormatter().string(from: expiresAt)
        )

        return await invoke(function: "claim_apple_subscription", params: params, key: key)
    }

    // MARK: - PAYG

    @discardableResult
    func claimPAYG(
        transactionId: String,
        productID: String,
        quantity: Int = 1
    ) async -> ClaimResult {
        let key = "payg:\(transactionId)"
        if shouldThrottle(key: key) { return .success }

        struct Params: Encodable {
            let p_transaction_id: String
            let p_product_id: String
            let p_quantity: Int
        }

        let params = Params(
            p_transaction_id: transactionId,
            p_product_id: productID,
            p_quantity: max(1, quantity)
        )

        return await invoke(function: "claim_apple_payg", params: params, key: key)
    }

    // MARK: - Internal

    private struct RPCResponse: Decodable {
        let action: String
        let reason: String?
        let owner: String?
    }

    private func invoke(function: String, params: some Encodable, key: String) async -> ClaimResult {
        do {
            let response: RPCResponse = try await SupabaseService.shared
                .rpc(function, params: params)
                .execute()
                .value

            switch response.action {
            case "success":
                lastKey = key
                lastSentAt = Date()
                return .success
            case "rejected":
                return .rejected(owner: response.owner ?? "unknown")
            default:
                return .error("unexpected_action:\(response.action)")
            }
        } catch {
            return .error(error.localizedDescription)
        }
    }

    private func shouldThrottle(key: String) -> Bool {
        guard key == lastKey else { return false }
        return Date().timeIntervalSince(lastSentAt) < throttleInterval
    }
}
