import SwiftUI

/// Sheet pulled up from a drafted `ContractDetailView` to apply a
/// natural-language tweak. State flow: idle → previewing → preview shown
/// (accept / discard) → saving → dismiss.
struct TweakSheet: View {
    let contractId: String
    let token: String
    var onAccepted: () async -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var instruction = ""
    @State private var state: TweakState = .idle
    @State private var errorMessage: String?

    private static let maxInstructionLength = 8000

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    header
                    instructionEditor
                    if let errorMessage {
                        errorBanner(errorMessage)
                    }
                    actionRow
                    if case .preview(let response) = state {
                        previewPane(body: response.body_md)
                    }
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .background(Color.gf.bg.ignoresSafeArea())
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                        .tint(Color.gf.fg2)
                }
            }
        }
    }

    // MARK: - Sections

    private var header: some View {
        Text("// TWEAK CONTRACT")
            .font(.gf.label)
            .tracking(1.0)
            .foregroundStyle(Color.gf.fg2)
    }

    private var instructionEditor: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// INSTRUCTION")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg4)
            GFFrame {
                ZStack(alignment: .topLeading) {
                    if instruction.isEmpty {
                        Text("e.g. Change governing law to Delaware; add a 30-day kill fee clause.")
                            .font(.gf.body)
                            .foregroundStyle(Color.gf.fg4)
                            .padding(.horizontal, Spacing.s1)
                            .padding(.vertical, Spacing.s2)
                            .allowsHitTesting(false)
                    }
                    TextEditor(text: Binding(
                        get: { instruction },
                        set: { instruction = String($0.prefix(Self.maxInstructionLength)) }
                    ))
                    .font(.gf.body)
                    .foregroundStyle(Color.gf.fg1)
                    .scrollContentBackground(.hidden)
                    .frame(minHeight: 6 * 22.0)
                    .disabled(isMutating)
                }
            }
            HStack {
                Spacer()
                Text("\(instruction.count) / \(Self.maxInstructionLength)")
                    .font(.gf.label)
                    .foregroundStyle(Color.gf.fg4)
            }
        }
    }

    @ViewBuilder
    private var actionRow: some View {
        switch state {
        case .idle, .previewing:
            GFButton(
                label: state.isPreviewing ? "PREVIEWING…" : "PREVIEW",
                style: .solid,
                showsArrow: false,
                isDisabled: state.isPreviewing || instruction.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
            ) {
                Task { await runPreview() }
            }

        case .preview:
            VStack(spacing: Spacing.s3) {
                GFButton(
                    label: state.isSaving ? "SAVING…" : "ACCEPT",
                    style: .solid,
                    showsArrow: false,
                    isDisabled: state.isSaving
                ) {
                    Task { await runAccept() }
                }
                GFButton(
                    label: "DISCARD",
                    style: .ghost,
                    showsArrow: false,
                    isDisabled: state.isSaving
                ) {
                    state = .idle
                }
            }

        case .saving:
            GFButton(
                label: "SAVING…",
                style: .solid,
                showsArrow: false,
                isDisabled: true
            ) {}
        }
    }

    private func previewPane(body: String) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// PREVIEW")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)
            GFFrame {
                ScrollView {
                    Text(body)
                        .font(.gf.body)
                        .foregroundStyle(Color.gf.fg1)
                        .textSelection(.enabled)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
                .frame(maxHeight: 420)
            }
        }
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

    // MARK: - Actions

    private var isMutating: Bool {
        switch state {
        case .previewing, .saving: return true
        case .idle, .preview:      return false
        }
    }

    private func runPreview() async {
        errorMessage = nil
        state = .previewing
        do {
            let response = try await APIClient.shared.tweak(
                contractId: contractId,
                instruction: instruction,
                token: token
            )
            state = .preview(response)
        } catch {
            errorMessage = String(describing: error)
            state = .idle
        }
    }

    private func runAccept() async {
        guard case .preview(let response) = state else { return }
        errorMessage = nil
        state = .saving
        do {
            _ = try await APIClient.shared.createVersion(
                contractId: contractId,
                bodyMd: response.body_md,
                title: nil,
                token: token
            )
            await onAccepted()
            dismiss()
        } catch {
            errorMessage = String(describing: error)
            state = .preview(response)
        }
    }
}

// MARK: - State

private enum TweakState {
    case idle
    case previewing
    case preview(TweakResponse)
    case saving

    var isPreviewing: Bool {
        if case .previewing = self { return true }
        return false
    }

    var isSaving: Bool {
        if case .saving = self { return true }
        return false
    }
}
