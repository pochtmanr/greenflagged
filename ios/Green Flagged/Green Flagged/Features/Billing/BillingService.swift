import Foundation

// TODO Phase 6 — StoreKit 2 wrapper.
// Products (per claude/ios/billing-iap.md):
//   - gf.payg.credit.1        consumable, $3.99 (single contract credit)
//   - gf.standard.monthly     auto-renewable subscription, $28.99/mo
//
// Responsibilities:
//   - load() async throws — fetch Product.products(for: ProductCatalog.allIDs)
//   - purchase(_ product: Product) async throws -> PurchaseOutcome
//   - restore() async throws — re-grant entitlements from Transaction.currentEntitlements
//   - reconcile(transactionJWS:productID:) async throws — POST /api/billing/apple/webhook

enum ProductCatalog {
    static let payAsYouGoCredit = "gf.payg.credit.1"
    static let standardMonthly  = "gf.standard.monthly"
    static let allIDs: [String] = [payAsYouGoCredit, standardMonthly]
}
