import SwiftUI
import UIKit

/// Verdict / detail screen pushed from the home and contracts list rows.
///
/// Top to bottom:
/// 1. Severity stripe + title header
/// 2. (scanned) Taxonomy section — `// CONTRACT MAP`
/// 3. (scanned) Redlines section — `// REDLINES`
/// 4. (scanned) Verdict markdown — `// FULL REVIEW`
/// 5. (scanned) Source-text toggle
/// 6. (drafted) Draft body markdown
/// 7. Footer actions — `EXPORT PDF` + `DELETE`
struct ContractDetailView: View {
    let contractId: String

    @Environment(Session.self) private var session
    @Environment(\.dismiss) private var dismiss

    @State private var vm = ContractDetailViewModel()
    @State private var token: String?
    @State private var showSource = false
    @State private var showDeleteConfirm = false
    @State private var pdfShareURL: URL?
    @State private var isExporting = false
    @State private var isDeleting = false
    @State private var actionError: String?

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            content
        }
        .navigationTitle(String(contractId.prefix(8)))
        .navigationBarTitleDisplayMode(.inline)
        .task { await loadIfNeeded() }
        .alert("Delete this contract?", isPresented: $showDeleteConfirm) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) {
                Task { await delete() }
            }
        } message: {
            Text("This permanently removes the contract and its verdict. This cannot be undone.")
        }
        .sheet(item: $pdfShareURL) { url in
            ShareSheet(items: [url])
        }
    }

    // MARK: - Content switch

    @ViewBuilder
    private var content: some View {
        switch vm.state {
        case .loading:
            loadingState
        case .error(let message):
            errorState(message)
        case .loaded(let detail):
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    headerSection(detail: detail)

                    switch detail.contract.kind ?? .scanned {
                    case .scanned:
                        scannedSections(detail: detail)
                    case .drafted:
                        draftedSections(detail: detail)
                    }

                    if let actionError {
                        errorBanner(actionError)
                    }

                    footerActions(detail: detail)
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    // MARK: - States

    private var loadingState: some View {
        VStack(spacing: Spacing.s3) {
            GFTag(label: "LOADING…")
            ProgressView()
                .progressViewStyle(.circular)
                .tint(Color.gf.fg2)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func errorState(_ message: String) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s4) {
            Text("// COULDN'T LOAD CONTRACT")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)
            GFTag(label: message.uppercased(), severity: .red)
            GFButton(label: "RETRY", style: .ghost) {
                Task { await loadIfNeeded(force: true) }
            }
            .frame(maxWidth: 240)
        }
        .padding(Spacing.s5)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func errorBanner(_ message: String) -> some View {
        GFFrame(bracketColor: Color.gf.sevRed) {
            Text(message.uppercased())
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.sevRed)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Header

    @ViewBuilder
    private func headerSection(detail: ContractDetail) -> some View {
        let severity = detail.contract.severity ?? .green
        VStack(alignment: .leading, spacing: Spacing.s3) {
            severityStripe(severity: severity)

            Text(detail.contract.displayTitle)
                .font(.gf.h2)
                .foregroundStyle(Color.gf.fg1)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: Spacing.s2) {
                GFTag(label: kindBadge(detail.contract.kind))
                Text(relativeDate(detail.contract.createdAt))
                    .font(.gf.monoSm)
                    .foregroundStyle(Color.gf.fg3)
            }
        }
    }

    private func severityStripe(severity: Severity) -> some View {
        HStack(alignment: .center, spacing: Spacing.s3) {
            GFTag(label: severity.shortLabel, severity: severity)
            Text(severity.label)
                .font(.gf.h4)
                .foregroundStyle(severity.color)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, Spacing.s3)
        .padding(.vertical, Spacing.s3)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(severity.tint)
        .overlay(
            RoundedRectangle(cornerRadius: Radius.sharp)
                .stroke(severity.color.opacity(0.4), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: Radius.sharp))
    }

    // MARK: - Scanned sections

    @ViewBuilder
    private func scannedSections(detail: ContractDetail) -> some View {
        if let scan = detail.scan {
            taxonomySection(taxonomy: scan.taxonomy)
            redlinesSection(redlines: scan.redlines)
            verdictSection(verdictMd: scan.verdictMd)
            sourceToggle(sourceText: scan.sourceText)
        } else {
            GFCard {
                VStack(alignment: .leading, spacing: Spacing.s2) {
                    Text("// NO VERDICT YET")
                        .font(.gf.label)
                        .foregroundStyle(Color.gf.fg3)
                    Text("The scan hasn't completed for this contract.")
                        .font(.gf.bodySm)
                        .foregroundStyle(Color.gf.fg2)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private func taxonomySection(taxonomy: [String: TaxonomyEntry]) -> some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("// CONTRACT MAP")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                if taxonomy.isEmpty {
                    Text("// NO TAXONOMY DATA")
                        .font(.gf.label)
                        .foregroundStyle(Color.gf.fg3)
                } else {
                    ForEach(Self.canonicalTaxonomyKeys, id: \.self) { key in
                        if let entry = taxonomy[key] {
                            GFSpecRow(
                                key: Self.taxonomyLabel(key),
                                value: taxonomyValue(entry),
                                valueColor: entry.severity?.color ?? Color.gf.fg1
                            )
                        }
                    }
                    // Render any keys outside the canonical list at the end
                    // so unexpected server-side fields stay visible.
                    let extras = taxonomy.keys
                        .filter { !Self.canonicalTaxonomyKeys.contains($0) }
                        .sorted()
                    ForEach(extras, id: \.self) { key in
                        if let entry = taxonomy[key] {
                            GFSpecRow(
                                key: key.uppercased().replacingOccurrences(of: "_", with: " "),
                                value: taxonomyValue(entry),
                                valueColor: entry.severity?.color ?? Color.gf.fg1
                            )
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func taxonomyValue(_ entry: TaxonomyEntry) -> String {
        if entry.present == false { return "ABSENT" }
        let summary = entry.summary?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return summary.isEmpty ? "—" : summary
    }

    private func redlinesSection(redlines: [Redline]) -> some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s4) {
                Text("// REDLINES")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                if redlines.isEmpty {
                    Text("// NO ISSUES FLAGGED")
                        .font(.gf.label)
                        .foregroundStyle(Color.gf.fg3)
                } else {
                    ForEach(Array(redlines.enumerated()), id: \.element.id) { idx, redline in
                        RedlineBlock(index: idx, redline: redline)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func verdictSection(verdictMd: String) -> some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("// FULL REVIEW")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                let paragraphs = verdictMd
                    .components(separatedBy: "\n\n")
                    .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                    .filter { !$0.isEmpty }

                ForEach(Array(paragraphs.enumerated()), id: \.offset) { _, chunk in
                    Text(LocalizedStringKey(chunk))
                        .font(.gf.body)
                        .foregroundStyle(Color.gf.fg1)
                        .fixedSize(horizontal: false, vertical: true)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func sourceToggle(sourceText: String) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s3) {
            GFButton(
                label: showSource ? "HIDE SOURCE" : "VIEW SOURCE",
                style: .link,
                showsArrow: false
            ) {
                withAnimation(.easeInOut(duration: 0.15)) {
                    showSource.toggle()
                }
            }

            if showSource {
                GFFrame {
                    ScrollView {
                        Text(sourceText)
                            .font(.gf.mono)
                            .foregroundStyle(Color.gf.fg2)
                            .textSelection(.enabled)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .frame(maxHeight: 480)
                }
            }
        }
    }

    // MARK: - Drafted sections

    @ViewBuilder
    private func draftedSections(detail: ContractDetail) -> some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("// DRAFT BODY")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                if let body = detail.draftBody?.trimmingCharacters(in: .whitespacesAndNewlines),
                   !body.isEmpty {
                    let paragraphs = body
                        .components(separatedBy: "\n\n")
                        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                        .filter { !$0.isEmpty }

                    ForEach(Array(paragraphs.enumerated()), id: \.offset) { _, chunk in
                        Text(LocalizedStringKey(chunk))
                            .font(.gf.body)
                            .foregroundStyle(Color.gf.fg1)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                } else {
                    Text("// NO DRAFT BODY YET")
                        .font(.gf.label)
                        .foregroundStyle(Color.gf.fg3)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Footer

    @ViewBuilder
    private func footerActions(detail: ContractDetail) -> some View {
        VStack(spacing: Spacing.s3) {
            GFButton(
                label: isExporting ? "EXPORTING…" : "EXPORT PDF",
                style: .solid,
                showsArrow: false,
                isDisabled: isExporting
            ) {
                Task { await exportPDF(detail: detail) }
            }

            GFButton(
                label: isDeleting ? "DELETING…" : "DELETE",
                style: .ghost,
                showsArrow: false,
                isDisabled: isDeleting
            ) {
                showDeleteConfirm = true
            }
        }
    }

    // MARK: - Actions

    private func loadIfNeeded(force: Bool = false) async {
        if case .loaded = vm.state, !force { return }
        let pulled: String?
        do {
            pulled = try await session.currentAccessToken()
        } catch {
            vm.state = .error("SESSION EXPIRED")
            return
        }
        token = pulled
        await vm.load(id: contractId)
    }

    private func exportPDF(detail: ContractDetail) async {
        guard !isExporting else { return }
        guard let token else { return }

        actionError = nil
        isExporting = true
        defer { isExporting = false }

        do {
            let data: Data
            switch detail.contract.kind ?? .scanned {
            case .scanned:
                data = try await APIClient.shared.contractReportPDF(id: contractId, token: token)
            case .drafted:
                data = try await APIClient.shared.contractPDF(id: contractId, token: token)
            }
            let url = try writeTempPDF(data: data)
            pdfShareURL = url
        } catch let error as APIError {
            actionError = String(describing: error)
        } catch {
            actionError = "EXPORT FAILED"
        }
    }

    private func writeTempPDF(data: Data) throws -> URL {
        let dir = FileManager.default.temporaryDirectory
        let url = dir.appendingPathComponent("\(contractId).pdf")
        try? FileManager.default.removeItem(at: url)
        try data.write(to: url, options: .atomic)
        return url
    }

    private func delete() async {
        guard !isDeleting else { return }
        guard let token else { return }

        actionError = nil
        isDeleting = true
        defer { isDeleting = false }

        do {
            try await APIClient.shared.deleteContract(id: contractId, token: token)
            NotificationCenter.default.post(
                name: ContractRepository.contractsChanged,
                object: nil
            )
            dismiss()
        } catch let error as APIError {
            actionError = String(describing: error)
        } catch {
            actionError = "DELETE FAILED"
        }
    }

    // MARK: - Helpers

    private func relativeDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.dateTimeStyle = .named
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }

    private func kindBadge(_ kind: ContractKind?) -> String {
        switch kind {
        case .scanned: "SCANNED"
        case .drafted: "DRAFTED"
        case .none:    "CONTRACT"
        }
    }

    // Mirror of `landing/components/contracts/severity.ts`.
    private static let canonicalTaxonomyKeys: [String] = [
        "ip_ownership",
        "payment_terms",
        "termination",
        "nda_scope",
        "liability_cap",
        "jurisdiction",
        "auto_renewal",
        "kill_fees",
        "exclusivity",
    ]

    private static func taxonomyLabel(_ key: String) -> String {
        switch key {
        case "ip_ownership":  "IP OWNERSHIP"
        case "payment_terms": "PAYMENT TERMS"
        case "termination":   "TERMINATION"
        case "nda_scope":     "NDA SCOPE"
        case "liability_cap": "LIABILITY CAP"
        case "jurisdiction":  "JURISDICTION"
        case "auto_renewal":  "AUTO-RENEWAL"
        case "kill_fees":     "KILL FEES"
        case "exclusivity":   "EXCLUSIVITY"
        default:              key.uppercased().replacingOccurrences(of: "_", with: " ")
        }
    }
}

// MARK: - Severity helpers (view-local)

private extension Severity {
    var shortLabel: String {
        switch self {
        case .green:  "OK"
        case .yellow: "WARN"
        case .orange: "HIGH"
        case .red:    "CRITICAL"
        }
    }

    @MainActor
    var tint: Color {
        switch self {
        case .green:  Color.gf.sevGreenTint
        case .yellow: Color.gf.sevYellowTint
        case .orange: Color.gf.sevOrangeTint
        case .red:    Color.gf.sevRedTint
        }
    }
}

// MARK: - Redline block

private struct RedlineBlock: View {
    let index: Int
    let redline: Redline

    var body: some View {
        GFFrame(bracketColor: redline.severity.color) {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                GFTag(
                    label: "\(redline.severity.shortLabel) · REDLINE \(index + 1)",
                    severity: redline.severity
                )

                section(label: "// EXCERPT", body: "\u{201C}\(redline.clauseExcerpt)\u{201D}", mono: true, color: Color.gf.fg2)
                section(label: "// ISSUE", body: redline.issue, mono: false, color: Color.gf.fg1)
                section(label: "// SUGGEST", body: redline.suggestion, mono: false, color: Color.gf.fg1)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func section(label: String, body: String, mono: Bool, color: Color) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s1) {
            Text(label)
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg3)
            Text(body)
                .font(mono ? .gf.mono : .gf.body)
                .foregroundStyle(color)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

// MARK: - Detail aggregate

struct ContractDetail: Sendable {
    let contract: Contract
    let scan: ScanResult?
    let draftBody: String?
}

// MARK: - View model

@MainActor
@Observable
final class ContractDetailViewModel {
    enum State: Sendable {
        case loading
        case loaded(ContractDetail)
        case error(String)
    }

    var state: State = .loading

    func load(id: String) async {
        state = .loading
        do {
            guard let contract = try await ContractRepository.shared.get(id: id) else {
                state = .error("CONTRACT NOT FOUND")
                return
            }

            switch contract.kind ?? .scanned {
            case .scanned:
                let scan = try await ContractRepository.shared.scanResult(contractId: id)
                state = .loaded(ContractDetail(contract: contract, scan: scan, draftBody: nil))
            case .drafted:
                let body = try await ContractRepository.shared.latestVersionBody(contractId: id)
                state = .loaded(ContractDetail(contract: contract, scan: nil, draftBody: body))
            }
        } catch {
            state = .error(error.localizedDescription.uppercased())
        }
    }
}

// MARK: - Share sheet wrapper

private struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// `URL` is `Identifiable` via its own string for `.sheet(item:)`.
extension URL: @retroactive Identifiable {
    public var id: String { absoluteString }
}

#Preview {
    NavigationStack {
        ContractDetailView(contractId: "preview-contract-id")
            .environment(Session())
    }
}
