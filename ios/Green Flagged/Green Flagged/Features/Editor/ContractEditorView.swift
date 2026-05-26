import SwiftUI
import Supabase
import Storage

// =====================================================================
// ContractEditorView — pushed from ContractDetailView when the user taps
// EDIT on a drafted contract. Markdown-only editor + branded styling
// sidebar + lightweight live preview. Mirrors landing/app/(app)/contracts/[id]/edit.
//
// Save flow:
//   • SAVE → POST /api/contracts/{id}/versions { body_md, title?, style, business_profile_id }
//   • Auto-save every 30s while the buffer is dirty.
//   • State machine: idle → saving → saved (with a last-saved timestamp).
// =====================================================================

struct ContractEditorView: View {
    let contractId: String
    let initialContract: Contract?
    let initialStyle: ContractStyle?
    let initialBusinessProfileId: UUID?

    @Environment(Session.self) private var session
    @Environment(\.dismiss) private var dismiss

    // Editable buffers.
    @State private var title: String = ""
    @State private var bodyMd: String = ""
    @State private var style: ContractStyle = .default
    @State private var businessProfileId: UUID? = nil

    // Save state machine.
    @State private var saveState: SaveState = .idle
    @State private var versionNumber: Int = 1
    @State private var lastSavedAt: Date? = nil
    @State private var lastSavedSnapshot: Snapshot? = nil

    // Modes & sheets.
    @State private var showStyleSheet = false
    @State private var showPreview = false
    @State private var errorMessage: String? = nil

    // Preview-side cache (logo + business fields).
    @State private var businessFields: BusinessFields? = nil
    @State private var logoData: Data? = nil

    // Initial load gate so the auto-save timer doesn't fire on the seed value.
    @State private var didHydrate = false
    @State private var autoSaveTimer: Timer? = nil

    enum SaveState: Equatable {
        case idle
        case saving
        case saved
        case failed(String)
    }

    private struct Snapshot: Equatable {
        let title: String
        let bodyMd: String
        let style: ContractStyle
        let businessProfileId: UUID?
    }

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            VStack(alignment: .leading, spacing: Spacing.s4) {
                statusRow
                titleField
                toolbarRow

                if showPreview {
                    StyledMarkdownPreview(
                        body_md: bodyMd,
                        title: title.isEmpty ? "Untitled contract" : title,
                        style: style,
                        logoData: logoData,
                        business: businessFields
                    )
                    .overlay(
                        Rectangle()
                            .stroke(Color.gf.rule, lineWidth: 1)
                    )
                } else {
                    editor
                }

                if let errorMessage {
                    GFErrorBanner(message: errorMessage)
                }

                footerActions
            }
            .padding(.horizontal, Spacing.s4)
            .padding(.vertical, Spacing.s4)
        }
        .navigationTitle("EDIT")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showStyleSheet) {
            StyleSidebarView(style: $style, businessProfileId: $businessProfileId)
                .environment(session)
        }
        .task { hydrate() }
        .onChange(of: businessProfileId) { _, _ in
            Task { await refreshBusinessFields() }
        }
        .onAppear { startAutoSaveTimer() }
        .onDisappear { stopAutoSaveTimer() }
    }

    // MARK: - Header

    private var statusRow: some View {
        HStack(spacing: Spacing.s2) {
            Text("// EDITING · v\(versionNumber)")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)
            Spacer()
            saveStatusBadge
        }
    }

    @ViewBuilder
    private var saveStatusBadge: some View {
        switch saveState {
        case .idle:
            if isDirty {
                Text("UNSAVED")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg3)
            } else {
                EmptyView()
            }
        case .saving:
            HStack(spacing: Spacing.s2) {
                ProgressView()
                    .progressViewStyle(.circular)
                    .controlSize(.mini)
                    .tint(Color.gf.fg2)
                Text("SAVING…")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)
            }
        case .saved:
            Text("SAVED · \(relativeSaved())")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.accent)
        case .failed(let message):
            Text("SAVE FAILED · \(message.uppercased())")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.sevRed)
        }
    }

    private var titleField: some View {
        GFInput(placeholder: "Contract title", text: $title)
    }

    // MARK: - Toolbar

    private var toolbarRow: some View {
        HStack(spacing: Spacing.s2) {
            GFButton(label: "STYLE", style: .ghost, showsArrow: false) {
                showStyleSheet = true
            }
            GFButton(label: "BUSINESS PROFILE", style: .ghost, showsArrow: false) {
                showStyleSheet = true
            }
            Spacer()
        }
    }

    // MARK: - Editor

    private var editor: some View {
        GFFrame {
            TextEditor(text: $bodyMd)
                .font(.gf.mono)
                .foregroundStyle(Color.gf.fg1)
                .scrollContentBackground(.hidden)
                .background(Color.gf.surface)
                .frame(minHeight: 320)
        }
    }

    // MARK: - Footer

    private var footerActions: some View {
        VStack(spacing: Spacing.s3) {
            GFButton(
                label: saveState == .saving ? "SAVING…" : "SAVE",
                style: .solid,
                showsArrow: false,
                isDisabled: saveState == .saving || !isDirty
            ) {
                Task { await save() }
            }

            GFButton(
                label: showPreview ? "EDIT" : "PREVIEW",
                style: .ghost,
                showsArrow: false
            ) {
                showPreview.toggle()
            }

            GFButton(label: "CANCEL", style: .link, showsArrow: false) {
                dismiss()
            }
        }
    }

    // MARK: - Hydration

    private func hydrate() {
        guard !didHydrate else { return }
        didHydrate = true

        title = initialContract?.title ?? ""
        style = initialStyle ?? initialContract?.style ?? .default
        if let initialBusinessProfileId {
            businessProfileId = initialBusinessProfileId
        } else if let raw = initialContract?.businessProfileId {
            businessProfileId = UUID(uuidString: raw)
        }

        Task { await loadInitialBody() }
        Task { await refreshBusinessFields() }
    }

    private func loadInitialBody() async {
        do {
            let body = try await ContractRepository.shared.latestVersionBody(contractId: contractId) ?? ""
            let versions = try await ContractRepository.shared.versions(contractId: contractId)
            await MainActor.run {
                bodyMd = body
                versionNumber = versions.first?.version ?? 1
                lastSavedSnapshot = currentSnapshot()
            }
        } catch {
            await MainActor.run {
                errorMessage = "COULDN'T LOAD CONTRACT BODY"
            }
        }
    }

    // MARK: - Business profile / logo

    private func refreshBusinessFields() async {
        guard let businessProfileId else {
            await MainActor.run {
                businessFields = nil
                logoData = nil
            }
            return
        }
        do {
            let profiles = try await BusinessProfileRepository.shared.list()
            let match = profiles.first { $0.id == businessProfileId.uuidString.lowercased() }
            guard let match else {
                await MainActor.run {
                    businessFields = nil
                    logoData = nil
                }
                return
            }
            let fields = BusinessFields(
                name: match.businessName ?? match.label,
                address: addressLine(match),
                subtitle: match.label
            )
            await MainActor.run { businessFields = fields }

            if let path = match.logoPath, !path.isEmpty {
                let url = try await SupabaseService.shared.storage
                    .from("contracts")
                    .createSignedURL(path: path, expiresIn: 1800)
                let (data, _) = try await URLSession.shared.data(from: url)
                await MainActor.run { logoData = data }
            } else {
                await MainActor.run { logoData = nil }
            }
        } catch {
            // Preview-only enhancement — silent failure is fine.
            await MainActor.run { logoData = nil }
        }
    }

    private func addressLine(_ profile: BusinessProfile) -> String? {
        let parts = [profile.street, profile.city, profile.postalCode, profile.countryCode]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        return parts.isEmpty ? nil : parts.joined(separator: ", ")
    }

    // MARK: - Save

    private func save() async {
        guard saveState != .saving else { return }
        errorMessage = nil
        await MainActor.run { saveState = .saving }

        do {
            let token = try await session.currentAccessToken()
            let snapshot = currentSnapshot()
            let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
            let version = try await APIClient.shared.createVersion(
                contractId: contractId,
                bodyMd: bodyMd,
                title: trimmedTitle.isEmpty ? nil : trimmedTitle,
                style: style,
                businessProfileId: businessProfileId,
                token: token
            )
            await MainActor.run {
                versionNumber = version
                lastSavedAt = Date()
                lastSavedSnapshot = snapshot
                saveState = .saved
            }
        } catch let error as APIError {
            await MainActor.run {
                saveState = .failed(String(describing: error))
                errorMessage = String(describing: error)
            }
        } catch {
            await MainActor.run {
                saveState = .failed("SAVE FAILED")
                errorMessage = "SAVE FAILED"
            }
        }
    }

    // MARK: - Auto-save

    /// Fires every 30s; saves only if the buffer differs from the last
    /// confirmed snapshot. Wall-clock based — pauses when the view disappears.
    private func startAutoSaveTimer() {
        stopAutoSaveTimer()
        autoSaveTimer = Timer.scheduledTimer(withTimeInterval: 30, repeats: true) { _ in
            Task { @MainActor in
                guard didHydrate, isDirty, saveState != .saving else { return }
                await save()
            }
        }
    }

    private func stopAutoSaveTimer() {
        autoSaveTimer?.invalidate()
        autoSaveTimer = nil
    }

    // MARK: - Dirty tracking

    private var isDirty: Bool {
        guard let lastSavedSnapshot else { return !bodyMd.isEmpty || !title.isEmpty }
        return currentSnapshot() != lastSavedSnapshot
    }

    private func currentSnapshot() -> Snapshot {
        Snapshot(
            title: title,
            bodyMd: bodyMd,
            style: style,
            businessProfileId: businessProfileId
        )
    }

    private func relativeSaved() -> String {
        guard let lastSavedAt else { return "JUST NOW" }
        let formatter = RelativeDateTimeFormatter()
        formatter.dateTimeStyle = .numeric
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: lastSavedAt, relativeTo: Date()).uppercased()
    }
}
