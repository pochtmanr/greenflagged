import Foundation
import Observation
import RevenueCat

/// Product identifiers as declared in App Store Connect. Kept here (not in the
/// RC dashboard) so RPC payloads can stamp the product even if RC offerings
/// fail to load.
enum ProductCatalog {
    static let payAsYouGoCredit = "gf.payg.credit.1"
    static let standardMonthly  = "gf.standard.monthly"
    static let allIDs: [String] = [payAsYouGoCredit, standardMonthly]
}

/// RevenueCat entitlement names — must match the dashboard configuration.
enum RCEntitlements {
    static let standard = "standard"
}

enum PurchaseOutcome: Equatable {
    case success
    case cancelled
    case pending
    case failed(message: String)
}

@MainActor
@Observable
final class RevenueCatService {
    static let shared = RevenueCatService()

    // MARK: - State

    private(set) var customerInfo: CustomerInfo?
    private(set) var currentOffering: Offering?
    private(set) var isLoadingOfferings = false
    private(set) var lastError: String?

    /// Set when `claim_apple_subscription` returns `{action:'rejected'}` —
    /// EntitlementGate uses this to refuse the RC fallback so the UI does not
    /// show STANDARD for a user who doesn't own the receipt.
    private(set) var rejectedOriginalTransactionId: String?

    private var delegateProxy: PurchasesDelegateProxy?

    // MARK: - Configuration

    /// Wire the delegate after `Purchases.configure(withAPIKey:)` runs at app
    /// launch. Separating these lets the App entry point own configure() while
    /// this service owns delegate / refresh fan-out.
    func configure() {
        let proxy = PurchasesDelegateProxy { [weak self] info in
            Task { @MainActor [weak self] in
                guard let self else { return }
                self.customerInfo = info
                await EntitlementGate.shared.refresh(reason: .revenueCatUpdate)
            }
        }
        delegateProxy = proxy
        Purchases.shared.delegate = proxy
    }

    func logIn(userId: String) async {
        clearRejection()
        guard Purchases.shared.appUserID != userId else { return }
        do {
            let (info, _) = try await Purchases.shared.logIn(userId)
            customerInfo = info
        } catch {
            lastError = error.localizedDescription
        }
    }

    func logOut() async {
        clearRejection()
        do {
            customerInfo = try await Purchases.shared.logOut()
        } catch {
            // Anonymous user already — RC raises if logOut is called twice.
            lastError = error.localizedDescription
        }
    }

    // MARK: - Offerings

    func fetchOfferings() async {
        isLoadingOfferings = true
        lastError = nil
        defer { isLoadingOfferings = false }
        do {
            let offerings = try await Purchases.shared.offerings()
            currentOffering = offerings.current
            customerInfo = try await Purchases.shared.customerInfo()
        } catch {
            lastError = error.localizedDescription
        }
    }

    /// Look up a package by its underlying StoreKit product id.
    func package(for productID: String) -> Package? {
        currentOffering?.availablePackages.first { $0.storeProduct.productIdentifier == productID }
    }

    // MARK: - Purchase / restore

    func purchase(_ package: Package, syncing sync: SubscriptionSyncService) async -> PurchaseOutcome {
        do {
            let result = try await Purchases.shared.purchase(package: package)
            customerInfo = result.customerInfo
            if result.userCancelled { return .cancelled }

            let productId = package.storeProduct.productIdentifier
            switch productId {
            case ProductCatalog.standardMonthly:
                guard let entitlement = result.customerInfo.entitlements.active[RCEntitlements.standard],
                      let originalTx = entitlement.originalPurchaseDate.map({ result.customerInfo.originalAppUserId + ":" + ISO8601DateFormatter().string(from: $0) })
                else { return .failed(message: "Entitlement not active") }
                // Prefer the real Apple originalTransactionId when available;
                // fall back to the synthetic productId+date pair only if RC
                // can't surface it (rare on iOS 16+).
                let txId = result.transaction?.transactionIdentifier
                    ?? entitlement.productIdentifier + "_" + (entitlement.originalPurchaseDate.map { ISO8601DateFormatter().string(from: $0) } ?? "unknown")
                _ = originalTx
                let expires = entitlement.expirationDate ?? Date().addingTimeInterval(30 * 24 * 3600)
                let claim = await sync.claimSubscription(
                    originalTransactionId: txId,
                    productID: productId,
                    expiresAt: expires
                )
                if case let .rejected(owner) = claim {
                    rejectedOriginalTransactionId = txId
                    return .failed(message: "Subscription already linked to another Green Flagged account (\(owner.prefix(8)))…")
                }
            case ProductCatalog.payAsYouGoCredit:
                guard let txId = result.transaction?.transactionIdentifier else {
                    return .failed(message: "Missing transaction id")
                }
                let claim = await sync.claimPAYG(
                    transactionId: txId,
                    productID: productId,
                    quantity: 1
                )
                if case let .rejected(message) = claim {
                    return .failed(message: message)
                }
            default:
                break
            }
            return .success
        } catch let error as RevenueCat.ErrorCode {
            switch error {
            case .purchaseCancelledError: return .cancelled
            case .paymentPendingError:    return .pending
            default:                       return .failed(message: error.localizedDescription)
            }
        } catch {
            return .failed(message: error.localizedDescription)
        }
    }

    func restore(syncing sync: SubscriptionSyncService) async -> PurchaseOutcome {
        do {
            let info = try await Purchases.shared.restorePurchases()
            customerInfo = info

            if let entitlement = info.entitlements.active[RCEntitlements.standard] {
                let txId = entitlement.productIdentifier + "_" + (entitlement.originalPurchaseDate.map { ISO8601DateFormatter().string(from: $0) } ?? "unknown")
                let expires = entitlement.expirationDate ?? Date().addingTimeInterval(30 * 24 * 3600)
                let claim = await sync.claimSubscription(
                    originalTransactionId: txId,
                    productID: entitlement.productIdentifier,
                    expiresAt: expires
                )
                if case let .rejected(owner) = claim {
                    rejectedOriginalTransactionId = txId
                    return .failed(message: "Subscription belongs to account \(owner.prefix(8))…")
                }
            }
            // PAYG receipts are consumed at purchase time; nothing to restore.
            return .success
        } catch {
            return .failed(message: error.localizedDescription)
        }
    }

    // MARK: - Helpers

    var hasActiveStandardEntitlement: Bool {
        guard let entitlement = customerInfo?.entitlements.active[RCEntitlements.standard] else { return false }
        // Ignore an entitlement Supabase has already rejected for this user.
        if let rejected = rejectedOriginalTransactionId,
           entitlement.productIdentifier.contains(rejected) {
            return false
        }
        return entitlement.isActive
    }

    private func clearRejection() {
        rejectedOriginalTransactionId = nil
    }
}

// MARK: - Delegate proxy

private final class PurchasesDelegateProxy: NSObject, PurchasesDelegate, @unchecked Sendable {
    private let handler: (CustomerInfo) -> Void

    init(handler: @escaping (CustomerInfo) -> Void) {
        self.handler = handler
    }

    func purchases(_ purchases: Purchases, receivedUpdated customerInfo: CustomerInfo) {
        handler(customerInfo)
    }
}
