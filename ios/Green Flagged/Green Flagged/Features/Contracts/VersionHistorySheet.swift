import SwiftUI

/// Sheet listing every `contract_versions` row for the contract, newest
/// first. Tapping a row opens a preview with a `RESTORE THIS VERSION`
/// button that appends a new latest version carrying the old body.
struct VersionHistorySheet: View {
    let contractId: String
    let token: String
    var onRestored: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var versions: [ContractVersion] = []
    @State private var loadState: LoadState = .loading
    @State private var actionError: String?

    private enum LoadState { case loading, loaded, error(String) }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.gf.bg.ignoresSafeArea()
                content
            }
            .navigationTitle("// VERSION HISTORY")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(Color.gf.fg1)
                }
            }
            .task { await load() }
        }
    }

    @ViewBuilder
    private var content: some View {
        switch loadState {
        case .loading:
            ProgressView()
                .progressViewStyle(.circular)
                .tint(Color.gf.fg2)
        case .error(let message):
            errorBanner(message)
        case .loaded:
            if versions.isEmpty {
                emptyState
            } else {
                versionList
            }
        }
    }

    private var versionList: some View {
        ScrollView {
            VStack(spacing: 0) {
                ForEach(Array(versions.enumerated()), id: \.element.id) { idx, version in
                    NavigationLink {
                        VersionPreviewView(
                            contractId: contractId,
                            token: token,
                            version: version,
                            onRestored: {
                                onRestored()
                                dismiss()
                            }
                        )
                    } label: {
                        VersionRow(version: version)
                    }
                    .buttonStyle(.plain)

                    if idx < versions.count - 1 {
                        Rectangle()
                            .fill(Color.gf.rule)
                            .frame(height: 1)
                    }
                }
            }
            .padding(.horizontal, Spacing.s4)
            .padding(.vertical, Spacing.s5)
        }
    }

    private var emptyState: some View {
        GFFrame {
            VStack(alignment: .leading, spacing: Spacing.s2) {
                Text("// NO VERSIONS YET")
                    .font(.gf.label)
                    .foregroundStyle(Color.gf.fg2)
                Text("Saved drafts appear here as you tweak or translate this contract.")
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg3)
            }
        }
        .padding(Spacing.s4)
    }

    private func errorBanner(_ message: String) -> some View {
        GFFrame(bracketColor: Color.gf.sevRed) {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text(message.uppercased())
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.sevRed)
                GFButton(label: "RETRY", style: .ghost) {
                    Task { await load() }
                }
                .frame(maxWidth: 200)
            }
        }
        .padding(Spacing.s4)
    }

    private func load() async {
        loadState = .loading
        do {
            let rows = try await ContractRepository.shared.versions(contractId: contractId)
            versions = rows
            loadState = .loaded
        } catch {
            loadState = .error("LOAD FAILED · \(error.localizedDescription.uppercased())")
        }
    }
}

// MARK: - Row

private struct VersionRow: View {
    let version: ContractVersion

    var body: some View {
        HStack(alignment: .top, spacing: Spacing.s3) {
            VStack(alignment: .leading, spacing: Spacing.s1) {
                HStack(spacing: Spacing.s2) {
                    Text("v\(version.version)")
                        .font(.gf.mono)
                        .foregroundStyle(Color.gf.fg1)
                    Text(relativeDate(version.createdAt))
                        .font(.gf.monoSm)
                        .foregroundStyle(Color.gf.fg3)
                }
                Text(preview)
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg2)
                    .lineLimit(2)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundStyle(Color.gf.fg3)
        }
        .padding(.vertical, Spacing.s3)
        .contentShape(Rectangle())
    }

    private var preview: String {
        let body = version.bodyMd?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if body.isEmpty { return "— no body —" }
        let clean = body
            .replacingOccurrences(of: "\n", with: " ")
            .replacingOccurrences(of: "#", with: "")
        return String(clean.prefix(80))
    }

    private func relativeDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.dateTimeStyle = .named
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Preview + restore

private struct VersionPreviewView: View {
    let contractId: String
    let token: String
    let version: ContractVersion
    var onRestored: () -> Void

    @State private var isRestoring = false
    @State private var actionError: String?

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s4) {
                    Text("// V\(version.version)")
                        .font(.gf.label)
                        .tracking(1.0)
                        .foregroundStyle(Color.gf.fg2)

                    GFCard {
                        Text(version.bodyMd ?? "— no body —")
                            .font(.gf.body)
                            .foregroundStyle(Color.gf.fg1)
                            .fixedSize(horizontal: false, vertical: true)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }

                    if let actionError {
                        GFFrame(bracketColor: Color.gf.sevRed) {
                            Text(actionError.uppercased())
                                .font(.gf.label)
                                .tracking(1.0)
                                .foregroundStyle(Color.gf.sevRed)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }

                    GFButton(
                        label: isRestoring ? "RESTORING…" : "RESTORE THIS VERSION",
                        style: .solid,
                        showsArrow: false,
                        isDisabled: isRestoring || (version.bodyMd ?? "").isEmpty
                    ) {
                        Task { await restore() }
                    }
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
            }
        }
        .navigationTitle("v\(version.version)")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func restore() async {
        guard !isRestoring else { return }
        guard let bodyMd = version.bodyMd, !bodyMd.isEmpty else {
            actionError = "EMPTY VERSION CANNOT BE RESTORED"
            return
        }

        actionError = nil
        isRestoring = true
        defer { isRestoring = false }

        do {
            _ = try await APIClient.shared.createVersion(
                contractId: contractId,
                bodyMd: bodyMd,
                title: nil,
                token: token
            )
            NotificationCenter.default.post(
                name: ContractRepository.contractsChanged,
                object: nil
            )
            onRestored()
        } catch let error as APIError {
            actionError = String(describing: error)
        } catch {
            actionError = "RESTORE FAILED · \(error.localizedDescription.uppercased())"
        }
    }
}
