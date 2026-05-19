import SwiftUI

struct SettingsView: View {
    @Environment(Session.self) private var session
    @Environment(\.openURL) private var openURL

    // Editable form state — initialized from the loaded profile in `onAppear`.
    @State private var accountType: AccountType = .solo
    @State private var countryCode: String = "US"
    @State private var businessName: String = ""

    // Save UI state.
    @State private var isSaving: Bool = false
    @State private var saveError: String? = nil
    @State private var didJustSave: Bool = false

    // Sign-out confirmation.
    @State private var showingSignOutConfirm: Bool = false

    /// Persisted appearance preference. The picker below is the user-facing
    /// surface for the same `@AppStorage("gf-theme")` key that
    /// `Green_FlaggedApp` reads.
    @AppStorage("gf-theme") private var themeRaw: String = ThemePreference.system.rawValue

    private var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    }

    private var emailDisplay: String {
        session.email ?? "—"
    }

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    header
                    accountSection
                    appearanceSection
                    billingSection
                    aboutSection
                    sessionSection
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
            }
        }
        .onAppear(perform: hydrateFromSession)
        .alert("Sign out?", isPresented: $showingSignOutConfirm) {
            Button("Cancel", role: .cancel) { }
            Button("Sign out", role: .destructive) {
                Task { await session.signOut() }
            }
        } message: {
            Text("You'll need to sign back in to see your contracts.")
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.s3) {
            Text("// SETTINGS")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)

            Text("Your account")
                .font(.gf.h1)
                .foregroundStyle(Color.gf.fg1)

            (Text("Signed in as ").foregroundStyle(Color.gf.fg3)
             + Text(emailDisplay).foregroundStyle(Color.gf.fg1)
             + Text(".").foregroundStyle(Color.gf.fg3))
                .font(.gf.bodySm)
        }
    }

    // MARK: - Account

    private var accountSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: 0) {
                Text("ACCOUNT")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                Spacer().frame(height: Spacing.s3)

                accountTypeRow

                Spacer().frame(height: Spacing.s4)

                countryRow

                if accountType == .business {
                    Spacer().frame(height: Spacing.s4)
                    businessNameRow
                }

                if let saveError {
                    Spacer().frame(height: Spacing.s3)
                    HStack {
                        Spacer()
                        GFTag(label: saveError.uppercased(), severity: .red)
                        Spacer()
                    }
                }

                Spacer().frame(height: Spacing.s4)

                GFButton(
                    label: didJustSave ? "SAVED" : (isSaving ? "SAVING…" : "SAVE CHANGES"),
                    style: .solid,
                    isDisabled: isSaving
                ) {
                    Task { await saveProfile() }
                }
            }
        }
    }

    private var accountTypeRow: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// ACCOUNT TYPE")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg3)

            HStack(spacing: Spacing.s2) {
                ForEach(AccountType.allCases) { type in
                    GFButton(
                        label: type.label,
                        style: accountType == type ? .solid : .ghost,
                        showsArrow: false
                    ) {
                        accountType = type
                        didJustSave = false
                    }
                }
            }
        }
    }

    private var countryRow: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// COUNTRY")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg3)

            Picker("Country", selection: $countryCode) {
                ForEach(SupportedCountry.all, id: \.code) { country in
                    Text("\(country.flag)  \(country.name)  ·  \(country.code)")
                        .tag(country.code)
                }
            }
            .pickerStyle(.menu)
            .tint(Color.gf.fg1)
            .padding(.horizontal, Spacing.s3)
            .padding(.vertical, Spacing.s2)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.gf.surfaceElev)
            .overlay(
                RoundedRectangle(cornerRadius: Radius.sharp)
                    .stroke(Color.gf.rule, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: Radius.sharp))
            .onChange(of: countryCode) { _, _ in didJustSave = false }
        }
    }

    private var businessNameRow: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// BUSINESS NAME")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg3)

            GFInput(placeholder: "Business name", text: $businessName)
                .onChange(of: businessName) { _, _ in didJustSave = false }
        }
    }

    // MARK: - Appearance

    private var appearanceSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("APPEARANCE")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                Picker("Appearance", selection: $themeRaw) {
                    ForEach(ThemePreference.allCases, id: \.rawValue) { pref in
                        Text(pref.label).tag(pref.rawValue)
                    }
                }
                .pickerStyle(.segmented)
            }
        }
    }

    // MARK: - Billing

    private var billingSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    Text("BILLING")
                        .font(.gf.label)
                        .tracking(1.0)
                        .foregroundStyle(Color.gf.fg2)
                    Spacer()
                    GFTag(label: "FREE", severity: .green)
                    // TODO: derive from subscriptions table once billing schema ships (next session).
                }

                Spacer().frame(height: Spacing.s3)

                Text("You're on the free tier — 1 scan per month, drafts are unlimited.")
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg2)
                    .fixedSize(horizontal: false, vertical: true)

                Spacer().frame(height: Spacing.s4)

                GFButton(label: "MANAGE BILLING", style: .ghost) {
                    // Owned by a future billing prompt.
                }
            }
        }
    }

    // MARK: - About

    private var aboutSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: 0) {
                Text("ABOUT")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                Spacer().frame(height: Spacing.s3)

                GFSpecRow(key: "VERSION", value: appVersion)

                Spacer().frame(height: Spacing.s2)

                HStack(spacing: Spacing.s4) {
                    GFButton(label: "PRIVACY", style: .link, showsArrow: false) {
                        if let url = URL(string: "https://flag.red/privacy") {
                            openURL(url)
                        }
                    }
                    GFButton(label: "TERMS", style: .link, showsArrow: false) {
                        if let url = URL(string: "https://flag.red/terms") {
                            openURL(url)
                        }
                    }
                }
            }
        }
    }

    // MARK: - Session

    private var sessionSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: 0) {
                Text("SESSION")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                Spacer().frame(height: Spacing.s3)

                Text("Sign out of this device. You can sign back in any time.")
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg3)
                    .fixedSize(horizontal: false, vertical: true)

                Spacer().frame(height: Spacing.s4)

                GFButton(label: "SIGN OUT", style: .ghost) {
                    showingSignOutConfirm = true
                }
            }
        }
    }

    // MARK: - Actions

    /// Mirrors form state from the loaded profile (or sensible defaults).
    private func hydrateFromSession() {
        if let profile = session.profile {
            accountType  = profile.accountType ?? .solo
            countryCode  = (profile.countryCode ?? Locale.current.region?.identifier ?? "US").uppercased()
            businessName = profile.businessName ?? ""
        } else {
            accountType  = .solo
            countryCode  = (Locale.current.region?.identifier ?? "US").uppercased()
            businessName = ""
        }
        didJustSave = false
    }

    private func saveProfile() async {
        guard !isSaving else { return }
        saveError = nil
        isSaving = true
        defer { isSaving = false }

        do {
            // `markOnboarded: false` preserves the existing `onboarded_at`
            // value — this is an edit from Settings, not the onboarding wizard.
            _ = try await ProfileRepository.shared.upsert(
                accountType: accountType,
                country: countryCode,
                businessName: accountType == .business ? businessName : nil,
                markOnboarded: false
            )
            await session.refreshProfile()
            didJustSave = true
        } catch {
            saveError = error.localizedDescription
        }
    }
}

// MARK: - Curated country list

/// Curated picker list — covers ~80% of users without the noise of all 249
/// ISO regions. Extend over time as analytics surface new markets.
private struct SupportedCountry: Hashable {
    let code: String
    let name: String
    let flag: String

    static let all: [SupportedCountry] = [
        .init(code: "US", name: "United States",  flag: "🇺🇸"),
        .init(code: "CA", name: "Canada",         flag: "🇨🇦"),
        .init(code: "GB", name: "United Kingdom", flag: "🇬🇧"),
        .init(code: "DE", name: "Germany",        flag: "🇩🇪"),
        .init(code: "FR", name: "France",         flag: "🇫🇷"),
        .init(code: "NL", name: "Netherlands",    flag: "🇳🇱"),
        .init(code: "ES", name: "Spain",          flag: "🇪🇸"),
        .init(code: "IT", name: "Italy",          flag: "🇮🇹"),
        .init(code: "PL", name: "Poland",         flag: "🇵🇱"),
        .init(code: "AU", name: "Australia",      flag: "🇦🇺"),
        .init(code: "RU", name: "Russia",         flag: "🇷🇺"),
        .init(code: "UA", name: "Ukraine",        flag: "🇺🇦"),
    ]
}

#Preview {
    SettingsView().environment(Session())
}
