import SwiftUI

// =====================================================================
// DraftWizard — three-phase contract creation flow.
//   1. Industry pick     (`WizardStep.industry`)
//   2. Question pages    (`WizardStep.questions(pageIndex:)`) — paginated
//      groups of the matching `industrySchema(_:)` array.
//   3. Review + submit   (`WizardStep.review`)
// On success the user lands on ContractDetailView for the new contract.
// =====================================================================

enum WizardStep: Hashable, Sendable {
    case industry
    /// Inserted by Stream D: pick a saved business profile + client (or skip)
    /// before the answer pages. Pre-selects defaults if the user has them.
    case presets
    case questions(pageIndex: Int)
    case review
}

enum SubmitState: Sendable, Equatable {
    case idle
    case submitting
    case error(String)
    case done
}

struct DraftWizard: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(Session.self) private var session

    @State private var answers = DraftAnswers()
    @State private var step: WizardStep = .industry
    @State private var submitState: SubmitState = .idle
    @State private var path = NavigationPath()
    @State private var validationErrors: [String: String] = [:]
    @State private var showCancelConfirm = false

    // Stream D: selected business profile + client. business_profile_id is
    // sent in the draft POST body; the client selection pre-fills the
    // counterparty fields (`client` / `client_address`) when applicable.
    @State private var selectedBusinessProfileId: String? = nil
    @State private var selectedClientId: String? = nil

    /// Page break sizing — the wizard groups N consecutive questions per
    /// page. Tuned so each industry's longest schema (freelance, 14
    /// questions) yields 3–4 pages.
    private static let pageSize = 4

    var body: some View {
        NavigationStack(path: $path) {
            ZStack {
                Color.gf.bg.ignoresSafeArea()
                content
            }
            .navigationTitle(navTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar { toolbarContent }
            .navigationDestination(for: String.self) { id in
                ContractDetailView(contractId: id)
            }
            .alert("Discard this draft?", isPresented: $showCancelConfirm) {
                Button("Keep editing", role: .cancel) {}
                Button("Discard", role: .destructive) {
                    dismiss()
                }
            } message: {
                Text("Your answers will not be saved.")
            }
        }
    }

    // MARK: - Toolbar

    @ToolbarContentBuilder
    private var toolbarContent: some ToolbarContent {
        ToolbarItem(placement: .topBarLeading) {
            Button("Cancel") {
                if hasAnyAnswer {
                    showCancelConfirm = true
                } else {
                    dismiss()
                }
            }
            .foregroundStyle(Color.gf.fg2)
        }
        ToolbarItem(placement: .topBarTrailing) {
            Text(stepCounter)
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg3)
        }
    }

    private var navTitle: String {
        switch step {
        case .industry:           return "NEW DRAFT"
        case .presets:            return "PRESETS"
        case .questions:          return answers.industry?.label ?? "NEW DRAFT"
        case .review:             return "REVIEW"
        }
    }

    /// Step counter denominator is `totalPages + 3` (industry + presets +
    /// review + question pages). Pre-industry the question count is 0, so the
    /// industry-only display reads "1 / 3" as before.
    private var stepCounter: String {
        let total = totalPages + 3
        switch step {
        case .industry:
            return "1 / \(total)"
        case .presets:
            return "2 / \(total)"
        case .questions(let idx):
            return "\(idx + 3) / \(total)"
        case .review:
            return "\(total) / \(total)"
        }
    }

    // MARK: - Content switch

    @ViewBuilder
    private var content: some View {
        switch step {
        case .industry:
            IndustryPickerView { picked in
                answers.setIndustry(picked)
                validationErrors.removeAll()
                step = .presets
            }

        case .presets:
            PresetsPage(
                selectedBusinessProfileId: $selectedBusinessProfileId,
                selectedClientId: $selectedClientId,
                onBack: {
                    step = .industry
                },
                onContinue: { profile, client in
                    selectedBusinessProfileId = profile?.id
                    selectedClientId = client?.id
                    if let client {
                        prefillCounterparty(from: client)
                    }
                    step = .questions(pageIndex: 0)
                }
            )

        case .questions(let pageIndex):
            QuestionsPage(
                answers: answers,
                pageIndex: pageIndex,
                totalPages: totalPages,
                validationErrors: validationErrors,
                onBack: { goBack(from: pageIndex) },
                onContinue: { advance(from: pageIndex) }
            )

        case .review:
            ReviewPage(
                answers: answers,
                submitState: submitState,
                onBack: { step = .questions(pageIndex: totalPages - 1) },
                onSubmit: { Task { await submit() } }
            )
        }
    }

    // MARK: - Pagination math

    private var totalPages: Int {
        guard let industry = answers.industry else { return 0 }
        let count = industrySchema(industry).count
        return max(1, Int((Double(count) / Double(Self.pageSize)).rounded(.up)))
    }

    private func questionsForPage(_ index: Int) -> [Question] {
        guard let industry = answers.industry else { return [] }
        let all = industrySchema(industry)
        let start = index * Self.pageSize
        guard start < all.count else { return [] }
        let end = Swift.min(start + Self.pageSize, all.count)
        return Array(all[start..<end])
    }

    // MARK: - Navigation

    private func goBack(from pageIndex: Int) {
        validationErrors.removeAll()
        if pageIndex == 0 {
            step = .presets
        } else {
            step = .questions(pageIndex: pageIndex - 1)
        }
    }

    /// Writes the client's identity + address into the canonical wizard
    /// answers so the user doesn't retype. Only the three industries that use
    /// `client` / `client_address` IDs benefit; NDA's parties have their own
    /// schema and are intentionally left alone.
    private func prefillCounterparty(from client: Client) {
        let firstName = client.firstName?.trimmingCharacters(in: .whitespacesAndNewlines)
        let familyName = client.familyName?.trimmingCharacters(in: .whitespacesAndNewlines)
        let businessName = client.businessName?.trimmingCharacters(in: .whitespacesAndNewlines)
        let hasIdentity = !(firstName?.isEmpty ?? true)
            || !(familyName?.isEmpty ?? true)
            || !(businessName?.isEmpty ?? true)
        if hasIdentity {
            answers.values["client"] = .nameGroup(
                first: firstName,
                family: familyName,
                business: businessName
            )
        }

        let country = client.countryCode?.trimmingCharacters(in: .whitespacesAndNewlines)
        let city = client.city?.trimmingCharacters(in: .whitespacesAndNewlines)
        let street = client.street?.trimmingCharacters(in: .whitespacesAndNewlines)
        let postal = client.postalCode?.trimmingCharacters(in: .whitespacesAndNewlines)
        let hasAddress = [country, city, street, postal].contains { !($0?.isEmpty ?? true) }
        if hasAddress {
            answers.values["client_address"] = .address(
                country: country,
                city: city,
                street: street,
                postal: postal
            )
        }
    }

    private func advance(from pageIndex: Int) {
        let errors = validateRequired(on: questionsForPage(pageIndex))
        validationErrors = errors
        if !errors.isEmpty { return }

        if pageIndex + 1 >= totalPages {
            step = .review
        } else {
            step = .questions(pageIndex: pageIndex + 1)
        }
    }

    /// Returns a map of `questionId -> error message` for each required
    /// field on the page that's missing or empty. The wizard surfaces
    /// these inline under the offending field.
    private func validateRequired(on page: [Question]) -> [String: String] {
        var errors: [String: String] = [:]
        for q in page where q.isRequired {
            switch q {
            case .text, .improveTextarea:
                let s = (answers.values[q.id].flatMap { v -> String? in
                    if case .string(let s) = v { return s }
                    return nil
                } ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                if s.isEmpty { errors[q.id] = "REQUIRED" }

            case .select:
                let s = (answers.values[q.id].flatMap { v -> String? in
                    if case .string(let s) = v { return s }
                    return nil
                } ?? "")
                if s.isEmpty { errors[q.id] = "PICK ONE" }

            case .number:
                if case .number = answers.values[q.id] {} else {
                    errors[q.id] = "REQUIRED"
                }

            case .date(_, _, let allowOpen, _, _, _):
                let openKey = "\(q.id)_open"
                let isOpen: Bool = {
                    if case .bool(let b) = answers.values[openKey] { return b }
                    return false
                }()
                if !(allowOpen && isOpen) {
                    if case .date = answers.values[q.id] {} else {
                        errors[q.id] = "PICK A DATE"
                    }
                }

            case .checkboxGroup:
                if case .stringArray(let xs) = answers.values[q.id], !xs.isEmpty {
                    // ok
                } else {
                    errors[q.id] = "PICK AT LEAST ONE"
                }

            case .nameGroup:
                if case .nameGroup(let first, let family, _) = answers.values[q.id] {
                    let f = (first ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                    let fa = (family ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
                    if f.isEmpty || fa.isEmpty {
                        errors[q.id] = "FIRST + FAMILY NAME REQUIRED"
                    }
                } else {
                    errors[q.id] = "FIRST + FAMILY NAME REQUIRED"
                }

            case .address:
                if case .address(let c, let ci, let st, let p) = answers.values[q.id] {
                    let required = [c, ci, st, p].map { ($0 ?? "").trimmingCharacters(in: .whitespacesAndNewlines) }
                    if required.contains(where: { $0.isEmpty }) {
                        errors[q.id] = "FILL ALL ADDRESS FIELDS"
                    }
                } else {
                    errors[q.id] = "FILL ALL ADDRESS FIELDS"
                }

            case .toggle:
                break  // toggles always carry a value
            }
        }
        return errors
    }

    // MARK: - Cancel guard

    private var hasAnyAnswer: Bool {
        answers.industry != nil || !answers.values.isEmpty
    }

    // MARK: - Submit

    private func submit() async {
        guard let industry = answers.industry else { return }
        submitState = .submitting

        let token: String
        do {
            token = try await session.currentAccessToken()
        } catch {
            submitState = .error("SESSION EXPIRED")
            return
        }

        // Mirror jurisdiction from `governing_law` if the user picked it
        // there but didn't override the wizard's top-level field. The
        // server falls back to its own default when neither is set.
        let jurisdictionFromGoverningLaw: String? = {
            if case .string(let s) = answers.values["governing_law"], !s.isEmpty {
                return s
            }
            return nil
        }()

        // Build the JSON-safe answers map and pre-encode the whole request
        // body. We serialize on the main actor so the actor-isolated
        // APIClient never receives a non-Sendable `[String: Any]`.
        // Never log the values themselves — they may contain PII.
        let answersJSON = answers.values.mapValues { $0.toJSON() }

        var body: [String: Any] = [
            "industry": industry.rawValue,
            "answers":  answersJSON,
        ]
        if let t = answers.title?.trimmingCharacters(in: .whitespacesAndNewlines), !t.isEmpty {
            body["title"] = t
        }
        if let j = (answers.jurisdiction ?? jurisdictionFromGoverningLaw)?
            .trimmingCharacters(in: .whitespacesAndNewlines), !j.isEmpty {
            body["jurisdiction"] = j
        }
        if let bpid = selectedBusinessProfileId {
            body["business_profile_id"] = bpid
        }

        let bodyData: Data
        do {
            bodyData = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            submitState = .error("COULD NOT ENCODE REQUEST")
            return
        }

        do {
            let response = try await APIClient.shared.draftContract(
                bodyJSON: bodyData,
                token: token
            )
            submitState = .done
            // Notify the contracts list so the new draft shows up after
            // we pop the wizard.
            NotificationCenter.default.post(
                name: ContractRepository.contractsChanged,
                object: nil
            )
            path.append(response.contract_id)
        } catch APIError.quotaExceeded(let message) {
            submitState = .error("OUT OF DRAFTS · \(message.uppercased())")
        } catch let error as APIError {
            submitState = .error(String(describing: error))
        } catch {
            submitState = .error(error.localizedDescription.uppercased())
        }
    }
}

// MARK: - Step 1: industry picker

private struct IndustryPickerView: View {
    var onPick: (DraftIndustry) -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.s5) {
                header
                VStack(spacing: Spacing.s3) {
                    ForEach(DraftIndustry.allCases) { industry in
                        IndustryCard(industry: industry) {
                            onPick(industry)
                        }
                    }
                }
            }
            .padding(.horizontal, Spacing.s4)
            .padding(.vertical, Spacing.s5)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// 01 / PICK A TEMPLATE")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)
            Text("What kind of contract?")
                .font(.gf.h2)
                .foregroundStyle(Color.gf.fg1)
            Text("We'll walk you through the answers, then render a draft you can negotiate with.")
                .font(.gf.bodySm)
                .foregroundStyle(Color.gf.fg3)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

private struct IndustryCard: View {
    let industry: DraftIndustry
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            GFFrame {
                VStack(alignment: .leading, spacing: Spacing.s3) {
                    HStack(alignment: .center, spacing: Spacing.s3) {
                        Text("// \(industry.label.uppercased())")
                            .font(.gf.label)
                            .tracking(1.0)
                            .foregroundStyle(Color.gf.accent)
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.right")
                            .foregroundStyle(Color.gf.fg3)
                    }
                    Text(industry.headline)
                        .font(.gf.h4)
                        .foregroundStyle(Color.gf.fg1)
                    Text(industry.description)
                        .font(.gf.bodySm)
                        .foregroundStyle(Color.gf.fg3)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Step 2: questions page

private struct QuestionsPage: View {
    @Bindable var answers: DraftAnswers
    let pageIndex: Int
    let totalPages: Int
    let validationErrors: [String: String]
    var onBack: () -> Void
    var onContinue: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.s5) {
                header
                ForEach(pageQuestions, id: \.id) { question in
                    QuestionField(
                        question: question,
                        answers: answers,
                        validationError: validationErrors[question.id]
                    )
                }
                navRow
            }
            .padding(.horizontal, Spacing.s4)
            .padding(.vertical, Spacing.s5)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// PAGE \(pageIndex + 1) / \(totalPages)")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg3)
            Text("Tell us the details")
                .font(.gf.h3)
                .foregroundStyle(Color.gf.fg1)
        }
    }

    private var pageQuestions: [Question] {
        guard let industry = answers.industry else { return [] }
        let all = industrySchema(industry)
        let start = pageIndex * 4
        guard start < all.count else { return [] }
        let end = Swift.min(start + 4, all.count)
        return Array(all[start..<end])
    }

    private var navRow: some View {
        HStack(spacing: Spacing.s3) {
            GFButton(label: "BACK", style: .ghost, showsArrow: false, action: onBack)
            GFButton(label: "CONTINUE", style: .solid, action: onContinue)
        }
        .padding(.top, Spacing.s3)
    }
}

// MARK: - Step 3: review

private struct ReviewPage: View {
    @Bindable var answers: DraftAnswers
    let submitState: SubmitState
    var onBack: () -> Void
    var onSubmit: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.s5) {
                header
                titleCard
                answersCard
                if case .error(let message) = submitState {
                    errorBanner(message)
                }
                actions
            }
            .padding(.horizontal, Spacing.s4)
            .padding(.vertical, Spacing.s5)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// 03 / REVIEW")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)
            Text("Ready to draft")
                .font(.gf.h2)
                .foregroundStyle(Color.gf.fg1)
            Text("We'll render a PDF and add it to your contracts.")
                .font(.gf.bodySm)
                .foregroundStyle(Color.gf.fg3)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var titleCard: some View {
        let titleBinding = Binding<String>(
            get: { answers.title ?? "" },
            set: { answers.title = $0.isEmpty ? nil : $0 }
        )
        return GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("// CONTRACT TITLE (OPTIONAL)")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg3)
                GFInput(placeholder: "Leave blank to auto-generate", text: titleBinding)
                Text("Defaults from the parties when blank.")
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg4)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var answersCard: some View {
        let industry = answers.industry
        let rows = industry.map { ind in
            industrySchema(ind).compactMap { q -> (String, String)? in
                guard let answer = answers.values[q.id] else { return nil }
                return (q.label.uppercased(), answer.summaryText)
            }
        } ?? []

        return GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("// ANSWERS")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg3)

                if rows.isEmpty {
                    Text("// NO ANSWERS YET")
                        .font(.gf.label)
                        .foregroundStyle(Color.gf.fg4)
                } else {
                    ForEach(Array(rows.enumerated()), id: \.offset) { _, row in
                        GFSpecRow(key: row.0, value: row.1)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func errorBanner(_ message: String) -> some View {
        GFErrorBanner(message: message)
    }

    @ViewBuilder
    private var actions: some View {
        let isSubmitting = submitState == .submitting
        VStack(spacing: Spacing.s3) {
            GFButton(
                label: isSubmitting ? "DRAFTING…" : "DRAFT CONTRACT",
                style: .solid,
                isDisabled: isSubmitting,
                action: onSubmit
            )
            GFButton(
                label: "BACK",
                style: .ghost,
                showsArrow: false,
                isDisabled: isSubmitting,
                action: onBack
            )
        }
        .padding(.top, Spacing.s3)
    }
}

// MARK: - Step 1.5: presets picker

/// Inserted between the industry picker and the question pages. Loads the
/// user's saved business profiles + clients from `/api/business-profiles` and
/// `/api/clients`, pre-selects whichever row has `is_default = true`, and
/// hands the selections back to the wizard on CONTINUE. Both pickers offer a
/// "Skip" option so the wizard remains usable for users who haven't filled
/// out any presets yet.
private struct PresetsPage: View {
    @Binding var selectedBusinessProfileId: String?
    @Binding var selectedClientId: String?
    var onBack: () -> Void
    var onContinue: (_ profile: BusinessProfile?, _ client: Client?) -> Void

    @State private var profiles: [BusinessProfile] = []
    @State private var clients: [Client] = []
    @State private var isLoading: Bool = false
    @State private var loadError: String? = nil

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.s5) {
                header

                if isLoading && profiles.isEmpty && clients.isEmpty {
                    loadingRow
                } else if let loadError {
                    errorBanner(loadError)
                } else {
                    businessCard
                    clientCard
                }

                navRow
            }
            .padding(.horizontal, Spacing.s4)
            .padding(.vertical, Spacing.s5)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .task { await loadIfNeeded() }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// 02 / PRESETS")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)
            Text("Pick your sides")
                .font(.gf.h2)
                .foregroundStyle(Color.gf.fg1)
            Text("Reuse a saved business profile and client so we can autofill the boring fields. Skip if you don't have presets yet.")
                .font(.gf.bodySm)
                .foregroundStyle(Color.gf.fg3)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var loadingRow: some View {
        HStack {
            Spacer()
            VStack(spacing: Spacing.s3) {
                GFTag(label: "LOADING…")
                ProgressView()
                    .progressViewStyle(.circular)
                    .tint(Color.gf.fg2)
            }
            Spacer()
        }
        .padding(.vertical, Spacing.s5)
    }

    private func errorBanner(_ message: String) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            GFErrorBanner(message: message)
            GFButton(label: "RETRY", style: .ghost) {
                Task { await load() }
            }
        }
    }

    private var businessCard: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("// MY BUSINESS PROFILE")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg3)

                if profiles.isEmpty {
                    Text("No saved profiles. Settings → Business Profiles to add one.")
                        .font(.gf.bodySm)
                        .foregroundStyle(Color.gf.fg3)
                } else {
                    VStack(spacing: 0) {
                        pickerRow(
                            label: "Skip",
                            isSelected: selectedBusinessProfileId == nil
                        ) {
                            selectedBusinessProfileId = nil
                        }
                        ForEach(profiles) { profile in
                            VStack(spacing: 0) {
                                Rectangle().fill(Color.gf.rule).frame(height: 1)
                                pickerRow(
                                    label: profileLabel(profile),
                                    badge: profile.isDefault ? "DEFAULT" : nil,
                                    isSelected: selectedBusinessProfileId == profile.id
                                ) {
                                    selectedBusinessProfileId = profile.id
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private var clientCard: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("// CLIENT")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg3)

                if clients.isEmpty {
                    Text("No saved clients. Settings → Clients to add one.")
                        .font(.gf.bodySm)
                        .foregroundStyle(Color.gf.fg3)
                } else {
                    VStack(spacing: 0) {
                        pickerRow(
                            label: "Skip",
                            isSelected: selectedClientId == nil
                        ) {
                            selectedClientId = nil
                        }
                        ForEach(clients) { client in
                            VStack(spacing: 0) {
                                Rectangle().fill(Color.gf.rule).frame(height: 1)
                                pickerRow(
                                    label: clientLabel(client),
                                    badge: client.isDefault ? "DEFAULT" : nil,
                                    isSelected: selectedClientId == client.id
                                ) {
                                    selectedClientId = client.id
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    private func pickerRow(
        label: String,
        badge: String? = nil,
        isSelected: Bool,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: Spacing.s3) {
                Image(systemName: isSelected ? "largecircle.fill.circle" : "circle")
                    .foregroundStyle(isSelected ? Color.gf.accent : Color.gf.fg3)
                Text(label)
                    .font(.gf.body)
                    .foregroundStyle(Color.gf.fg1)
                    .lineLimit(1)
                Spacer(minLength: 0)
                if let badge {
                    GFTag(label: badge, severity: .green)
                }
            }
            .padding(.vertical, Spacing.s2)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var navRow: some View {
        HStack(spacing: Spacing.s3) {
            GFButton(label: "BACK", style: .ghost, showsArrow: false, action: onBack)
            GFButton(label: "CONTINUE", style: .solid) {
                let profile = profiles.first { $0.id == selectedBusinessProfileId }
                let client = clients.first { $0.id == selectedClientId }
                onContinue(profile, client)
            }
        }
        .padding(.top, Spacing.s3)
    }

    // MARK: - Loading

    private func loadIfNeeded() async {
        guard profiles.isEmpty, clients.isEmpty, !isLoading else { return }
        await load()
    }

    private func load() async {
        if isLoading { return }
        isLoading = true
        loadError = nil
        defer { isLoading = false }
        do {
            async let p = BusinessProfileRepository.shared.list()
            async let c = ClientRepository.shared.list()
            let (loadedProfiles, loadedClients) = try await (p, c)
            profiles = loadedProfiles
            clients = loadedClients
            // Pre-select the user's defaults the first time we land here.
            if selectedBusinessProfileId == nil,
               let def = profiles.first(where: { $0.isDefault }) {
                selectedBusinessProfileId = def.id
            }
            if selectedClientId == nil,
               let def = clients.first(where: { $0.isDefault }) {
                selectedClientId = def.id
            }
        } catch {
            loadError = String(describing: error)
        }
    }

    // MARK: - Labels

    private func profileLabel(_ p: BusinessProfile) -> String {
        if let label = p.label?.trimmingCharacters(in: .whitespacesAndNewlines), !label.isEmpty {
            return label
        }
        if let biz = p.businessName?.trimmingCharacters(in: .whitespacesAndNewlines), !biz.isEmpty {
            return biz
        }
        let parts = [p.firstName, p.familyName]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        return parts.isEmpty ? "Untitled profile" : parts.joined(separator: " ")
    }

    private func clientLabel(_ c: Client) -> String {
        if let biz = c.businessName?.trimmingCharacters(in: .whitespacesAndNewlines), !biz.isEmpty {
            return biz
        }
        let parts = [c.firstName, c.familyName]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        return parts.isEmpty ? "Untitled client" : parts.joined(separator: " ")
    }
}

#Preview {
    DraftWizard()
        .environment(Session())
}
