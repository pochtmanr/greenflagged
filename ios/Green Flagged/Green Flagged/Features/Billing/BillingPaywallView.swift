import SwiftUI
import RevenueCat

/// Full-screen paywall presented when a user hits the free-tier quota or taps
/// "UPGRADE" from Settings. Renders Standard + PAYG side-by-side using the GF
/// design system (sharp 2px corners, UPPERCASE mono labels, green as the only
/// decorative color).
struct BillingPaywallView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var rc = RevenueCatService.shared
    @State private var gate = EntitlementGate.shared
    @State private var sync = SubscriptionSyncService.shared

    @State private var purchasing: String?
    @State private var restoring = false
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            VStack(spacing: 0) {
                toolbar
                Divider().background(Color.gf.rule)

                ScrollView {
                    VStack(alignment: .leading, spacing: Spacing.s5) {
                        header
                        if rc.isLoadingOfferings && rc.currentOffering == nil {
                            loadingCard
                        } else if rc.currentOffering == nil {
                            offeringErrorCard
                        } else {
                            standardCard
                            paygCard
                        }
                        if let errorMessage {
                            errorBanner(errorMessage)
                        }
                        footer
                    }
                    .padding(Spacing.s5)
                }
            }
        }
        .task {
            if rc.currentOffering == nil {
                await rc.fetchOfferings()
            }
        }
    }

    // MARK: - Pieces

    private var toolbar: some View {
        HStack {
            Button {
                dismiss()
            } label: {
                Text("CLOSE")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)
            }
            .buttonStyle(.plain)

            Spacer()

            Button {
                Task { await restorePurchases() }
            } label: {
                HStack(spacing: Spacing.s2) {
                    if restoring {
                        ProgressView().controlSize(.mini)
                    }
                    Text(restoring ? "RESTORING…" : "RESTORE PURCHASES")
                        .font(.gf.label)
                        .tracking(1.0)
                        .foregroundStyle(Color.gf.fg2)
                }
            }
            .buttonStyle(.plain)
            .disabled(restoring)
        }
        .padding(.horizontal, Spacing.s5)
        .padding(.vertical, Spacing.s4)
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// BILLING")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg3)
            Text("UNLOCK STANDARD")
                .font(.gf.h2)
                .foregroundStyle(Color.gf.fg1)
            Text("Pay once, scan more. Standard renews monthly via the App Store. Pay-as-you-go is a single contract credit valid 90 days.")
                .font(.gf.body)
                .foregroundStyle(Color.gf.fg2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var loadingCard: some View {
        GFCard {
            HStack(spacing: Spacing.s3) {
                ProgressView()
                Text("LOADING OFFERINGS…")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)
            }
            .frame(maxWidth: .infinity, alignment: .center)
        }
    }

    private var offeringErrorCard: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("// PRICES UNAVAILABLE")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg3)
                Text(rc.lastError ?? "Couldn't reach the App Store. Check your connection and try again.")
                    .font(.gf.body)
                    .foregroundStyle(Color.gf.fg2)
                GFButton(label: "RETRY", style: .ghost) {
                    Task { await rc.fetchOfferings() }
                }
            }
        }
    }

    private var standardCard: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                HStack(alignment: .firstTextBaseline) {
                    Text("STANDARD")
                        .font(.gf.h3)
                        .foregroundStyle(Color.gf.fg1)
                    Spacer()
                    GFTag(label: "MOST POPULAR", severity: .green)
                }

                Text(priceText(for: ProductCatalog.standardMonthly) ?? "$28.99 / MONTH")
                    .font(.gf.h2)
                    .foregroundStyle(Color.gf.fg1)

                VStack(alignment: .leading, spacing: Spacing.s2) {
                    bullet("10 CONTRACTS PER MONTH")
                    bullet("PRIORITY AI REVIEW")
                    bullet("MULTI-LANGUAGE SUPPORT")
                    bullet("CANCEL ANYTIME")
                }

                Spacer().frame(height: Spacing.s2)

                GFButton(
                    label: purchasing == ProductCatalog.standardMonthly ? "PROCESSING…" : "START STANDARD",
                    style: .solid,
                    isDisabled: purchasing != nil
                ) {
                    Task { await buy(productID: ProductCatalog.standardMonthly) }
                }
            }
        }
    }

    private var paygCard: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                HStack(alignment: .firstTextBaseline) {
                    Text("PAY-AS-YOU-GO")
                        .font(.gf.h3)
                        .foregroundStyle(Color.gf.fg1)
                    Spacer()
                    GFTag(label: "NO COMMITMENT")
                }

                Text(priceText(for: ProductCatalog.payAsYouGoCredit) ?? "$3.99 / CREDIT")
                    .font(.gf.h2)
                    .foregroundStyle(Color.gf.fg1)

                VStack(alignment: .leading, spacing: Spacing.s2) {
                    bullet("1 CONTRACT SCAN")
                    bullet("VALID 90 DAYS")
                    bullet("BUY MORE AS YOU GO")
                }

                Spacer().frame(height: Spacing.s2)

                GFButton(
                    label: purchasing == ProductCatalog.payAsYouGoCredit ? "PROCESSING…" : "BUY 1 CREDIT",
                    style: .ghost,
                    isDisabled: purchasing != nil
                ) {
                    Task { await buy(productID: ProductCatalog.payAsYouGoCredit) }
                }
            }
        }
    }

    private func errorBanner(_ message: String) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            GFErrorBanner(message: "PURCHASE FAILED")
            Text(message)
                .font(.gf.bodySm)
                .foregroundStyle(Color.gf.fg2)
                .fixedSize(horizontal: false, vertical: true)
                .padding(.horizontal, Spacing.s3)
        }
    }

    private var footer: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("STOREKIT — APPLE ID BILLING — RESTORE ANYTIME")
                .font(.gf.monoSm)
                .foregroundStyle(Color.gf.fg3)
            Text("Subscriptions auto-renew until cancelled in App Store settings. You can manage at any time from Settings → BILLING.")
                .font(.gf.bodySm)
                .foregroundStyle(Color.gf.fg3)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private func bullet(_ text: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: Spacing.s2) {
            Text("→")
                .font(.gf.mono)
                .foregroundStyle(Color.gf.accent)
            Text(text)
                .font(.gf.bodySm)
                .foregroundStyle(Color.gf.fg2)
        }
    }

    // MARK: - Actions

    private func buy(productID: String) async {
        guard let package = rc.package(for: productID) else {
            errorMessage = "Product unavailable. Try again later."
            return
        }
        errorMessage = nil
        purchasing = productID
        defer { purchasing = nil }

        let outcome = await rc.purchase(package, syncing: sync)
        switch outcome {
        case .success:
            await gate.refresh(reason: .purchaseCompleted)
            dismiss()
        case .cancelled:
            break
        case .pending:
            errorMessage = "Purchase pending approval. Try again once approved."
        case .failed(let message):
            errorMessage = message
        }
    }

    private func restorePurchases() async {
        errorMessage = nil
        restoring = true
        defer { restoring = false }
        let outcome = await rc.restore(syncing: sync)
        switch outcome {
        case .success:
            await gate.refresh(reason: .purchaseCompleted)
            if gate.isStandard || gate.creditsRemaining > 0 {
                dismiss()
            } else {
                errorMessage = "No active purchases to restore."
            }
        case .cancelled:
            break
        case .pending:
            errorMessage = "Restore pending — try again shortly."
        case .failed(let message):
            errorMessage = message
        }
    }

    private func priceText(for productID: String) -> String? {
        guard let package = rc.package(for: productID) else { return nil }
        let price = package.storeProduct.localizedPriceString
        switch productID {
        case ProductCatalog.standardMonthly:
            return "\(price.uppercased()) / MONTH"
        case ProductCatalog.payAsYouGoCredit:
            return "\(price.uppercased()) / CREDIT"
        default:
            return price.uppercased()
        }
    }
}

#Preview {
    BillingPaywallView()
}
