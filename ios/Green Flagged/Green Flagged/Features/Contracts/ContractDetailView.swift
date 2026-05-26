import SwiftUI
import UIKit

/// Contract detail screen pushed from the home and contracts list rows.
///
/// For `kind == .scanned`, the rich verdict body is delegated to
/// `VerdictView`. For `kind == .drafted`, this view renders the draft body
/// and the editing actions (Tweak / History / Translate / Export).
///
/// This view owns:
/// - the `ContractDetail` load,
/// - the access token (one fresh pull per appearance),
/// - the in-flight flags for each long-running action,
/// - and every modal sheet (share, tweak, history, translate).
struct ContractDetailView: View {
    let contractId: String

    @Environment(Session.self) private var session
    @Environment(\.dismiss) private var dismiss
    @AppStorage("preferred_export_locale") private var preferredLocale: String = "en"

    @State private var vm = ContractDetailViewModel()
    @State private var token: String?
    @State private var showDeleteConfirm = false
    @State private var shareItem: ShareItem?
    @State private var isExportingPDF = false
    @State private var isDeleting = false
    @State private var actionError: String?
    @State private var showTweakSheet = false
    @State private var showHistorySheet = false
    @State private var showTranslateSheet = false
    @State private var isFixing = false
    @State private var isCloning = false
    @State private var navigateToContract: String?
    @State private var draftBodyOverride: String?
    @State private var navigateToEditor = false

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            content

            if isFixing {
                progressOverlay(label: "// REVISING CONTRACT…")
            } else if isCloning {
                progressOverlay(label: "// CLONING…")
            }
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
        .sheet(item: $shareItem) { item in
            ShareSheet(items: [item.url])
        }
        .sheet(isPresented: $showTweakSheet) {
            TweakSheet(contractId: contractId, token: token ?? "") {
                draftBodyOverride = nil
                await vm.load(id: contractId)
            }
        }
        .sheet(isPresented: $showHistorySheet) {
            VersionHistorySheet(
                contractId: contractId,
                token: token ?? "",
                onRestored: {
                    draftBodyOverride = nil
                    Task { await vm.load(id: contractId) }
                }
            )
        }
        .sheet(isPresented: $showTranslateSheet) {
            TranslateSheet(
                contractId: contractId,
                currentLocale: preferredLocale,
                token: token ?? "",
                onTranslated: { locale, bodyMd in
                    preferredLocale = locale
                    draftBodyOverride = bodyMd
                }
            )
        }
        .navigationDestination(item: $navigateToContract) { id in
            ContractDetailView(contractId: id)
        }
        .navigationDestination(isPresented: $navigateToEditor) {
            editorDestination
        }
    }

    @ViewBuilder
    private var editorDestination: some View {
        if case .loaded(let detail) = vm.state, detail.contract.kind == .drafted {
            ContractEditorView(
                contractId: contractId,
                initialContract: detail.contract,
                initialStyle: detail.contract.style,
                initialBusinessProfileId: detail.contract.businessProfileId.flatMap(UUID.init(uuidString:))
            )
        } else {
            EmptyView()
        }
    }

    private func progressOverlay(label: String) -> some View {
        ZStack {
            Color.black.opacity(0.5).ignoresSafeArea()
            GFFrame {
                VStack(spacing: Spacing.s3) {
                    Text(label)
                        .font(.gf.label)
                        .tracking(1.0)
                        .foregroundStyle(Color.gf.fg2)
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(Color.gf.fg2)
                }
            }
            .frame(maxWidth: 320)
            .padding(.horizontal, Spacing.s4)
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
                    switch detail.contract.kind ?? .scanned {
                    case .scanned:
                        VerdictView(
                            detail: detail,
                            isExportingPDF: isExportingPDF,
                            isFixing: isFixing,
                            onExportPDF: { Task { await exportPDF(detail: detail) } },
                            onApplyFix: token == nil ? nil : { Task { await applyFix() } }
                        )
                    case .drafted:
                        draftedHeader(detail: detail)
                        draftedBody(detail: detail)
                    }

                    if let actionError {
                        GFErrorBanner(message: actionError)
                    }

                    if detail.contract.kind == .drafted {
                        draftedActions(detail: detail)
                    }

                    cloneAction()
                    deleteAction()
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

    // MARK: - Drafted sections

    private func draftedHeader(detail: ContractDetail) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s3) {
            Text(detail.contract.displayTitle)
                .font(.gf.h2)
                .foregroundStyle(Color.gf.fg1)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: Spacing.s2) {
                GFTag(label: "DRAFTED")
                Text(relativeDate(detail.contract.createdAt))
                    .font(.gf.monoSm)
                    .foregroundStyle(Color.gf.fg3)
                if preferredLocale != "en" {
                    GFTag(label: preferredLocale.uppercased())
                }
            }
        }
    }

    @ViewBuilder
    private func draftedBody(detail: ContractDetail) -> some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("// DRAFT BODY")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                let body = (draftBodyOverride ?? detail.draftBody ?? "")
                    .trimmingCharacters(in: .whitespacesAndNewlines)

                if body.isEmpty {
                    Text("// NO DRAFT BODY YET")
                        .font(.gf.label)
                        .foregroundStyle(Color.gf.fg3)
                } else {
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
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Actions

    @ViewBuilder
    private func draftedActions(detail: ContractDetail) -> some View {
        VStack(spacing: Spacing.s3) {
            GFButton(
                label: isExportingPDF ? "EXPORTING…" : "EXPORT PDF",
                style: .solid,
                showsArrow: false,
                isDisabled: isExportingPDF
            ) {
                Task { await exportPDF(detail: detail) }
            }

            GFButton(
                label: "EDIT",
                style: .ghost,
                showsArrow: false,
                isDisabled: token == nil
            ) {
                navigateToEditor = true
            }

            GFButton(
                label: "TWEAK",
                style: .ghost,
                showsArrow: false,
                isDisabled: token == nil
            ) {
                showTweakSheet = true
            }

            GFButton(
                label: "TRANSLATE",
                style: .ghost,
                showsArrow: false,
                isDisabled: token == nil
            ) {
                showTranslateSheet = true
            }

            GFButton(
                label: "HISTORY",
                style: .ghost,
                showsArrow: false,
                isDisabled: token == nil
            ) {
                showHistorySheet = true
            }
        }
    }

    private func cloneAction() -> some View {
        GFButton(
            label: isCloning ? "CLONING…" : "CLONE",
            style: .ghost,
            showsArrow: false,
            isDisabled: token == nil || isCloning
        ) {
            Task { await clone() }
        }
    }

    private func deleteAction() -> some View {
        GFButton(
            label: isDeleting ? "DELETING…" : "DELETE",
            style: .ghost,
            showsArrow: false,
            isDisabled: isDeleting
        ) {
            showDeleteConfirm = true
        }
    }

    // MARK: - Async actions

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
        draftBodyOverride = nil
        await vm.load(id: contractId)
    }

    private func exportPDF(detail: ContractDetail) async {
        guard !isExportingPDF, let token else { return }
        actionError = nil
        isExportingPDF = true
        defer { isExportingPDF = false }

        let locale = detail.contract.kind == .drafted ? localeForExport() : nil
        do {
            let data = detail.contract.kind == .scanned
                ? try await renderScannedPDF(detail: detail)
                : try await APIClient.shared.contractPDF(
                    id: contractId,
                    locale: locale,
                    token: token
                )
            shareItem = try writeShareFile(data: data, ext: "pdf", locale: locale)
        } catch let error as APIError {
            actionError = String(describing: error)
        } catch {
            actionError = "EXPORT FAILED · \(error.localizedDescription.uppercased())"
        }
    }

    /// Local on-device PDF render used for scanned verdicts. Avoids hitting
    /// the server with a synchronous render under the AI-actor budget.
    private func renderScannedPDF(detail: ContractDetail) async throws -> Data {
        let url = try PDFExportService.render(detail: detail)
        defer { try? FileManager.default.removeItem(at: url) }
        return try Data(contentsOf: url)
    }

    private func applyFix() async {
        guard !isFixing else { return }
        guard let token else { return }

        actionError = nil
        isFixing = true
        defer { isFixing = false }

        do {
            let newId = try await APIClient.shared.applyFix(contractId: contractId, token: token)
            NotificationCenter.default.post(
                name: ContractRepository.contractsChanged,
                object: nil
            )
            navigateToContract = newId
        } catch let error as APIError {
            actionError = String(describing: error)
        } catch {
            actionError = "GENERATE FIX FAILED"
        }
    }

    private func clone() async {
        guard !isCloning else { return }
        guard let token else { return }

        actionError = nil
        isCloning = true
        defer { isCloning = false }

        do {
            let newId = try await APIClient.shared.cloneContract(contractId: contractId, token: token)
            NotificationCenter.default.post(
                name: ContractRepository.contractsChanged,
                object: nil
            )
            navigateToContract = newId
        } catch let error as APIError {
            actionError = String(describing: error)
        } catch {
            actionError = "CLONE FAILED · \(error.localizedDescription.uppercased())"
        }
    }

    private func delete() async {
        guard !isDeleting else { return }

        actionError = nil
        isDeleting = true
        defer { isDeleting = false }

        let storagePath: String? = {
            if case .loaded(let detail) = vm.state { return detail.contract.storagePath }
            return nil
        }()

        do {
            try await ContractRepository.shared.delete(id: contractId, storagePath: storagePath)
            NotificationCenter.default.post(
                name: ContractRepository.contractsChanged,
                object: nil
            )
            dismiss()
        } catch {
            actionError = "DELETE FAILED · \(error.localizedDescription.uppercased())"
        }
    }

    // MARK: - Helpers

    private func relativeDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.dateTimeStyle = .named
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }

    /// "en" is the default; passing it to the export endpoints does the same
    /// thing as omitting it, but stripping it keeps URLs clean.
    private func localeForExport() -> String? {
        preferredLocale == "en" ? nil : preferredLocale
    }

    private func writeShareFile(
        data: Data,
        ext: String,
        locale: String?,
        suffix: String = ""
    ) throws -> ShareItem {
        let localePart = locale.map { "-\($0)" } ?? ""
        let filename = "\(contractId.prefix(8))\(suffix)\(localePart).\(ext)"
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
        try? FileManager.default.removeItem(at: url)
        try data.write(to: url, options: .atomic)
        return ShareItem(url: url)
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

/// Identifiable wrapper for `.sheet(item:)` — `URL` is `Identifiable` already
/// via its `absoluteString`, but every reuse posts the same id, so SwiftUI
/// caches the activity controller and the share preview goes stale on
/// successive exports. A fresh UUID per item forces a fresh sheet.
struct ShareItem: Identifiable, Sendable {
    let id = UUID()
    let url: URL
}

private struct ShareSheet: UIViewControllerRepresentable {
    let items: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: items, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

#Preview {
    NavigationStack {
        ContractDetailView(contractId: "preview-contract-id")
            .environment(Session())
    }
}
