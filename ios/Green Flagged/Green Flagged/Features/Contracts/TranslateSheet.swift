import SwiftUI

/// Sheet listing the locales the backend supports for `POST
/// /api/contracts/{id}/translate`. The exact list is mirrored from
/// `landing/lib/contracts/i18n.ts` — keep them in sync.
///
/// Tapping a row triggers a translate call. On success the parent's
/// `onTranslated` receives the new `body_md` so the detail view can swap in
/// the translated copy without a full reload, and the sheet dismisses.
struct TranslateSheet: View {
    let contractId: String
    let currentLocale: String
    let token: String
    var onTranslated: (_ locale: String, _ bodyMd: String) -> Void

    @Environment(\.dismiss) private var dismiss
    @AppStorage("preferred_export_locale") private var preferredLocale: String = "en"

    @State private var inFlight: String? = nil
    @State private var actionError: String?

    var body: some View {
        NavigationStack {
            ZStack {
                Color.gf.bg.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: Spacing.s4) {
                        Text("Pick a locale. The backend caches translations per contract.")
                            .font(.gf.bodySm)
                            .foregroundStyle(Color.gf.fg2)

                        VStack(spacing: 0) {
                            ForEach(Self.locales, id: \.code) { locale in
                                Button {
                                    Task { await translate(to: locale.code) }
                                } label: {
                                    LocaleRow(
                                        locale: locale,
                                        isCurrent: locale.code == currentLocale,
                                        isInFlight: inFlight == locale.code
                                    )
                                }
                                .buttonStyle(.plain)
                                .disabled(inFlight != nil)

                                if locale.code != Self.locales.last?.code {
                                    Rectangle()
                                        .fill(Color.gf.rule)
                                        .frame(height: 1)
                                }
                            }
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
                    }
                    .padding(.horizontal, Spacing.s4)
                    .padding(.vertical, Spacing.s5)
                }
            }
            .navigationTitle("// TRANSLATE")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(Color.gf.fg1)
                        .disabled(inFlight != nil)
                }
            }
        }
    }

    private func translate(to code: String) async {
        guard inFlight == nil else { return }
        actionError = nil
        inFlight = code
        defer { inFlight = nil }

        do {
            let response = try await APIClient.shared.translate(
                contractId: contractId,
                locale: code,
                token: token
            )
            preferredLocale = code
            onTranslated(code, response.body_md)
            dismiss()
        } catch let error as APIError {
            actionError = String(describing: error)
        } catch {
            actionError = "TRANSLATE FAILED · \(error.localizedDescription.uppercased())"
        }
    }

    /// Mirrors `SUPPORTED_LOCALES` in `landing/lib/contracts/i18n.ts`. Native
    /// names use each language's own script so the picker reads correctly to
    /// the user even when they don't speak the app's UI language.
    static let locales: [Locale] = [
        Locale(code: "en", nativeName: "English"),
        Locale(code: "de", nativeName: "Deutsch"),
        Locale(code: "es", nativeName: "Español"),
        Locale(code: "fr", nativeName: "Français"),
        Locale(code: "he", nativeName: "עברית"),
    ]

    struct Locale: Sendable, Hashable {
        let code: String
        let nativeName: String
    }
}

private struct LocaleRow: View {
    let locale: TranslateSheet.Locale
    let isCurrent: Bool
    let isInFlight: Bool

    var body: some View {
        HStack(alignment: .center, spacing: Spacing.s3) {
            Text(locale.code.uppercased())
                .font(.gf.mono)
                .foregroundStyle(Color.gf.fg1)
                .frame(width: 32, alignment: .leading)

            Text(locale.nativeName)
                .font(.gf.body)
                .foregroundStyle(Color.gf.fg1)

            Spacer()

            if isInFlight {
                ProgressView()
                    .progressViewStyle(.circular)
                    .tint(Color.gf.fg2)
            } else if isCurrent {
                GFTag(label: "CURRENT")
            } else {
                Image(systemName: "chevron.right")
                    .foregroundStyle(Color.gf.fg3)
            }
        }
        .padding(.vertical, Spacing.s3)
        .contentShape(Rectangle())
    }
}
