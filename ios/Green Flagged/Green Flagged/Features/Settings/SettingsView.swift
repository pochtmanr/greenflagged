import SwiftUI

struct SettingsView: View {
    @Environment(Session.self) private var session
    @Environment(EntitlementGate.self) private var gate
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

    // Billing.
    @State private var showPaywall: Bool = false

    // Support.
    @State private var showFeedbackSheet: Bool = false

    // Danger zone (two-tap delete).
    @State private var showingDeleteAlert: Bool = false
    @State private var showingDeleteConfirmSheet: Bool = false
    @State private var deleteError: String? = nil

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
        NavigationStack {
            ZStack {
                Color.gf.bg.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: Spacing.s5) {
                        header
                        accountSection
                        presetsSection
                        appearanceSection
                        billingSection
                        supportSection
                        aboutSection
                        sessionSection
                        dangerZoneSection
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
            .alert("Delete account?", isPresented: $showingDeleteAlert) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    showingDeleteConfirmSheet = true
                }
            } message: {
                Text("This permanently deletes your account, contracts, and uploaded files. This cannot be undone.")
            }
            .sheet(isPresented: $showingDeleteConfirmSheet) {
                DeleteAccountConfirmSheet(
                    expectedEmail: session.email ?? "",
                    initialError: deleteError,
                    onConfirm: { await deleteAccount() }
                )
            }
            .sheet(isPresented: $showFeedbackSheet) {
                FeedbackSheet(
                    name: session.profile?.businessName ?? (session.email ?? "Green Flagged user"),
                    email: session.email ?? ""
                )
            }
        }
    }

    // MARK: - Presets

    /// Saved business profiles + clients, used by the draft wizard and the
    /// branded contract editor. Each row is a `NavigationLink` so the push
    /// happens inside this tab's own NavigationStack.
    private var presetsSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: 0) {
                Text("// PRESETS")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                Spacer().frame(height: Spacing.s3)

                NavigationLink {
                    BusinessProfilesView()
                } label: {
                    presetRow(icon: "building.2",
                              title: "BUSINESS PROFILES",
                              subtitle: "Your company info for drafted contracts")
                }
                .buttonStyle(.plain)

                Rectangle()
                    .fill(Color.gf.rule)
                    .frame(height: 1)
                    .padding(.vertical, Spacing.s2)

                NavigationLink {
                    ClientsView()
                } label: {
                    presetRow(icon: "person.2",
                              title: "CLIENTS",
                              subtitle: "Saved counterparties for quick draft autofill")
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func presetRow(icon: String? = nil, title: String, subtitle: String) -> some View {
        HStack(spacing: Spacing.s3) {
            if let icon {
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .regular))
                    .foregroundStyle(Color.gf.fg2)
                    .frame(width: 22, alignment: .leading)
            }
            VStack(alignment: .leading, spacing: Spacing.s1) {
                Text(title)
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg1)
                Text(subtitle)
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg3)
            }
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundStyle(Color.gf.fg3)
        }
        .padding(.vertical, Spacing.s2)
        .contentShape(Rectangle())
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
                HStack(spacing: Spacing.s2) {
                    Image(systemName: "person.crop.circle")
                        .font(.system(size: 16, weight: .regular))
                        .foregroundStyle(Color.gf.fg2)
                    Text("ACCOUNT")
                        .font(.gf.label)
                        .tracking(1.0)
                        .foregroundStyle(Color.gf.fg2)
                }

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
                    GFErrorBanner(message: saveError)
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

            Picker("Account type", selection: $accountType) {
                ForEach(AccountType.allCases) { type in
                    Text(type.label).tag(type)
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
            .onChange(of: accountType) { _, _ in didJustSave = false }
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
            }
        }
    }

    // MARK: - Billing

    private var billingSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: 0) {
                HStack {
                    HStack(spacing: Spacing.s2) {
                        Image(systemName: "creditcard")
                            .font(.system(size: 16, weight: .regular))
                            .foregroundStyle(Color.gf.fg2)
                        Text("BILLING")
                            .font(.gf.label)
                            .tracking(1.0)
                            .foregroundStyle(Color.gf.fg2)
                    }
                    Spacer()
                    GFTag(
                        label: gate.isStandard ? "STANDARD" : "FREE",
                        severity: gate.isStandard ? .green : nil
                    )
                }

                Spacer().frame(height: Spacing.s3)

                Text(billingDescription)
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg2)
                    .fixedSize(horizontal: false, vertical: true)

                Spacer().frame(height: Spacing.s4)

                GFButton(
                    label: gate.isStandard ? "MANAGE SUBSCRIPTION" : "UPGRADE",
                    style: .ghost
                ) {
                    if gate.isStandard {
                        // Apple's subscription-management URL — opens the
                        // user's active subscriptions in App Store settings.
                        if let url = URL(string: "https://apps.apple.com/account/subscriptions") {
                            openURL(url)
                        }
                    } else {
                        showPaywall = true
                    }
                }
            }
        }
        .fullScreenCover(isPresented: $showPaywall) {
            BillingPaywallView()
        }
    }

    private var billingDescription: String {
        if gate.isStandard {
            if let end = gate.currentPeriodEnd {
                let formatter = DateFormatter()
                formatter.dateStyle = .medium
                let renews = gate.cancelAtPeriodEnd ? "ends" : "renews"
                return "Standard plan — \(renews) on \(formatter.string(from: end)). 10 contracts per month."
            }
            return "Standard plan — 10 contracts per month."
        }
        if gate.creditsRemaining > 0 {
            return "Free tier — \(gate.creditsRemaining) PAYG credit\(gate.creditsRemaining == 1 ? "" : "s") remaining. Tap UPGRADE for Standard."
        }
        return "You're on the free tier — 1 scan per month, drafts are unlimited."
    }

    // MARK: - Support

    private var supportSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: 0) {
                Text("// SUPPORT")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                Spacer().frame(height: Spacing.s3)

                Button {
                    if let url = URL(string: "mailto:hello@greenflagged.xyz?subject=Green%20Flagged%20iOS%20Support") {
                        openURL(url)
                    }
                } label: {
                    presetRow(
                        title: "CONTACT SUPPORT",
                        subtitle: "Opens Mail with our team prefilled"
                    )
                }
                .buttonStyle(.plain)

                Rectangle()
                    .fill(Color.gf.rule)
                    .frame(height: 1)
                    .padding(.vertical, Spacing.s2)

                Button {
                    showFeedbackSheet = true
                } label: {
                    presetRow(
                        title: "SEND FEEDBACK IN-APP",
                        subtitle: "Ship us a quick note without leaving the app"
                    )
                }
                .buttonStyle(.plain)
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
                        if let url = URL(string: "https://greenflagged.xyz/privacy") {
                            openURL(url)
                        }
                    }
                    GFButton(label: "TERMS", style: .link, showsArrow: false) {
                        if let url = URL(string: "https://greenflagged.xyz/terms") {
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

    // MARK: - Danger zone

    private var dangerZoneSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: 0) {
                Text("// DANGER ZONE")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.sevRed)

                Spacer().frame(height: Spacing.s3)

                Text("Permanently delete this account and every contract, version, and uploaded file attached to it.")
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg3)
                    .fixedSize(horizontal: false, vertical: true)

                Spacer().frame(height: Spacing.s4)

                Button {
                    deleteError = nil
                    showingDeleteAlert = true
                } label: {
                    HStack {
                        Text("DELETE ACCOUNT")
                            .font(.gf.label)
                            .tracking(1.0)
                            .foregroundStyle(Color.gf.sevRed)
                        Spacer()
                    }
                    .padding(.vertical, Spacing.s3)
                    .padding(.horizontal, Spacing.s3)
                    .overlay(
                        Rectangle()
                            .stroke(Color.gf.sevRed, lineWidth: 1)
                    )
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Actions

    /// Performs the destructive account deletion. Returns an error string on
    /// failure so the confirm sheet can surface it inline; on success, signs
    /// the user out (which drops the root view back to `SignInView`).
    private func deleteAccount() async -> String? {
        do {
            let token = try await session.currentAccessToken()
            try await APIClient.shared.deleteAccount(token: token)
            showingDeleteConfirmSheet = false
            await session.signOut()
            return nil
        } catch let error as APIError {
            return String(describing: error)
        } catch {
            return "DELETE FAILED · \(error.localizedDescription.uppercased())"
        }
    }

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

// MARK: - Delete confirm sheet

/// Second confirmation surface for the destructive delete action. The user
/// must type their email exactly before the confirm button enables — same
/// "are you sure" pattern Vercel / GitHub use for repo deletion.
private struct DeleteAccountConfirmSheet: View {
    let expectedEmail: String
    let initialError: String?
    /// Returns an error string on failure; `nil` on success. The caller is
    /// responsible for dismissing the sheet on success (it triggers sign-out
    /// which unmounts the whole settings stack).
    var onConfirm: () async -> String?

    @Environment(\.dismiss) private var dismiss
    @State private var typedEmail: String = ""
    @State private var isSubmitting: Bool = false
    @State private var errorMessage: String?

    private var matches: Bool {
        typedEmail.trimmingCharacters(in: .whitespacesAndNewlines)
            .lowercased() == expectedEmail.lowercased() && !expectedEmail.isEmpty
    }

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    VStack(alignment: .leading, spacing: Spacing.s2) {
                        Text("// CONFIRM ACCOUNT DELETION")
                            .font(.gf.label)
                            .tracking(1.0)
                            .foregroundStyle(Color.gf.sevRed)

                        Text("This cannot be undone.")
                            .font(.gf.h2)
                            .foregroundStyle(Color.gf.fg1)

                        Text("To confirm, type your email below — \(expectedEmail) — then tap the destructive button.")
                            .font(.gf.bodySm)
                            .foregroundStyle(Color.gf.fg2)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    GFInput(
                        placeholder: expectedEmail,
                        text: $typedEmail,
                        keyboard: .emailAddress,
                        textContentType: .emailAddress
                    )

                    if let errorMessage {
                        GFErrorBanner(message: errorMessage)
                    }

                    GFButton(
                        label: isSubmitting ? "DELETING…" : "I UNDERSTAND, DELETE",
                        style: .solid,
                        isDisabled: !matches || isSubmitting
                    ) {
                        Task { await submit() }
                    }

                    GFButton(label: "CANCEL", style: .ghost, showsArrow: false) {
                        dismiss()
                    }
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
            }
        }
        .onAppear { errorMessage = initialError }
    }

    private func submit() async {
        guard matches, !isSubmitting else { return }
        errorMessage = nil
        isSubmitting = true
        defer { isSubmitting = false }
        if let message = await onConfirm() {
            errorMessage = message
        }
    }
}

// MARK: - Feedback sheet

private struct FeedbackSheet: View {
    let name: String
    let email: String

    @Environment(\.dismiss) private var dismiss
    @State private var message: String = ""
    @State private var isSubmitting: Bool = false
    @State private var errorMessage: String?
    @State private var didSend: Bool = false

    private var trimmedMessage: String {
        message.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    VStack(alignment: .leading, spacing: Spacing.s2) {
                        Text("// SEND FEEDBACK")
                            .font(.gf.label)
                            .tracking(1.0)
                            .foregroundStyle(Color.gf.fg3)

                        Text("Tell us what's working — or what isn't.")
                            .font(.gf.h2)
                            .foregroundStyle(Color.gf.fg1)

                        Text("Goes straight to our team. We read every message.")
                            .font(.gf.bodySm)
                            .foregroundStyle(Color.gf.fg2)
                    }

                    if didSend {
                        GFFrame(bracketColor: Color.gf.accent) {
                            Text("// THANKS — WE'LL BE IN TOUCH")
                                .font(.gf.label)
                                .tracking(1.0)
                                .foregroundStyle(Color.gf.accent)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    } else {
                        VStack(alignment: .leading, spacing: Spacing.s2) {
                            Text("// MESSAGE")
                                .font(.gf.label)
                                .tracking(1.0)
                                .foregroundStyle(Color.gf.fg3)

                            TextEditor(text: $message)
                                .font(.gf.body)
                                .foregroundStyle(Color.gf.fg1)
                                .scrollContentBackground(.hidden)
                                .background(Color.gf.surfaceElev)
                                .frame(minHeight: 160)
                                .overlay(
                                    RoundedRectangle(cornerRadius: Radius.sharp)
                                        .stroke(Color.gf.rule, lineWidth: 1)
                                )
                                .clipShape(RoundedRectangle(cornerRadius: Radius.sharp))
                        }

                        if let errorMessage {
                            GFErrorBanner(message: errorMessage)
                        }

                        GFButton(
                            label: isSubmitting ? "SENDING…" : "SEND",
                            style: .solid,
                            isDisabled: isSubmitting || trimmedMessage.count < 10
                        ) {
                            Task { await submit() }
                        }
                    }

                    GFButton(label: didSend ? "DONE" : "CANCEL", style: .ghost, showsArrow: false) {
                        dismiss()
                    }
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
            }
        }
    }

    private func submit() async {
        guard !isSubmitting else { return }
        errorMessage = nil
        isSubmitting = true
        defer { isSubmitting = false }

        do {
            try await APIClient.shared.sendContactMessage(
                name: name,
                email: email,
                message: trimmedMessage
            )
            withAnimation(.easeInOut(duration: 0.18)) {
                didSend = true
            }
        } catch let error as APIError {
            errorMessage = String(describing: error)
        } catch {
            errorMessage = "SEND FAILED · \(error.localizedDescription.uppercased())"
        }
    }
}

#Preview {
    SettingsView().environment(Session())
}
