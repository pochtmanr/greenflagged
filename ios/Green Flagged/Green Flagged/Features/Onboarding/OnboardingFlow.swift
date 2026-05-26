import SwiftUI

/// Onboarding wizard. Mirrors the web flow at
/// `landing/app/(app)/onboarding/page.tsx` and `components/onboarding/wizard.tsx`:
/// account-type → industries → country → optional business name → commit.
///
/// On commit, `ProfileRepository.upsert(markOnboarded: true)` is called.
/// `Session.refreshProfile()` then flips `authState` to `.signedIn` and the
/// root view swaps to `MainTabsView`.
struct OnboardingFlow: View {
    @Environment(Session.self) private var session

    @State private var path: [OnboardingStep] = []

    @State private var accountType: AccountType = .solo
    @State private var industries: Set<String> = []
    @State private var countryCode: String = (Locale.current.region?.identifier ?? "US").uppercased()
    @State private var businessName: String = ""

    @State private var isSubmitting: Bool = false
    @State private var errorMessage: String? = nil

    var body: some View {
        NavigationStack(path: $path) {
            AccountTypeStep(
                accountType: $accountType,
                onContinue: { path.append(.industries) },
                onSignOut: { Task { await session.signOut() } }
            )
            .navigationDestination(for: OnboardingStep.self) { step in
                switch step {
                case .industries:
                    IndustriesStep(
                        industries: $industries,
                        errorMessage: errorMessage,
                        onContinue: {
                            errorMessage = nil
                            path.append(.country)
                        }
                    )
                case .country:
                    CountryStep(
                        countryCode: $countryCode,
                        accountType: accountType,
                        isSubmitting: isSubmitting,
                        errorMessage: errorMessage,
                        onContinue: { Task { await advanceFromCountry() } }
                    )
                case .businessName:
                    BusinessNameStep(
                        businessName: $businessName,
                        isSubmitting: isSubmitting,
                        errorMessage: errorMessage,
                        onFinish: { Task { await commit() } }
                    )
                }
            }
            .toolbarBackground(Color.gf.bg, for: .navigationBar)
        }
        .tint(Color.gf.fg1)
    }

    // MARK: - Step transitions

    private func advanceFromCountry() async {
        errorMessage = nil
        if accountType == .business {
            path.append(.businessName)
        } else {
            await commit()
        }
    }

    private func commit() async {
        guard !isSubmitting else { return }
        guard !industries.isEmpty else {
            errorMessage = "Pick at least one industry."
            // Pop back so the user sees the failing step.
            path = [.industries]
            return
        }
        errorMessage = nil
        isSubmitting = true
        defer { isSubmitting = false }

        do {
            _ = try await ProfileRepository.shared.upsert(
                accountType: accountType,
                country: countryCode,
                businessName: accountType == .business ? businessName : nil,
                industries: Array(industries),
                markOnboarded: true
            )
            await session.refreshProfile()
        } catch {
            withAnimation(.easeInOut(duration: 0.18)) {
                errorMessage = error.localizedDescription
            }
        }
    }
}

// MARK: - Routes

enum OnboardingStep: Hashable {
    case industries
    case country
    case businessName
}

// MARK: - Step 1 — Account type

private struct AccountTypeStep: View {
    @Binding var accountType: AccountType
    var onContinue: () -> Void
    var onSignOut: () -> Void

    private var totalSteps: String {
        accountType == .business ? "04" : "03"
    }

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    StepHeader(
                        index: "01",
                        total: totalSteps,
                        title: "Who are you signing for?",
                        subtitle: "We tailor warnings and templates to your situation."
                    )

                    VStack(spacing: Spacing.s3) {
                        ForEach(AccountType.allCases) { type in
                            RadioCard(
                                title: type.label,
                                description: description(for: type),
                                isSelected: accountType == type
                            ) {
                                accountType = type
                            }
                        }
                    }

                    GFButton(label: "CONTINUE", style: .solid, action: onContinue)

                    GFButton(label: "SIGN OUT", style: .link, showsArrow: false, action: onSignOut)
                        .frame(maxWidth: .infinity)
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
            }
        }
    }

    private func description(for type: AccountType) -> String {
        switch type {
        case .solo:       "You sign contracts in your own name. No business entity."
        case .freelancer: "You invoice clients as a sole trader or 1-person LLC."
        case .business:   "You sign on behalf of a registered business or agency."
        }
    }
}

// MARK: - Step 2 — Industries

private struct IndustriesStep: View {
    @Binding var industries: Set<String>
    let errorMessage: String?
    var onContinue: () -> Void

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    StepHeader(
                        index: "02",
                        total: "04",
                        title: "What industries do you work in?",
                        subtitle: "Pick as many as apply — we use this to tune templates and redlines."
                    )

                    GFCard {
                        FlowLayout(spacing: Spacing.s2) {
                            ForEach(ProfileIndustry.all) { industry in
                                IndustryChip(
                                    label: industry.label,
                                    isSelected: industries.contains(industry.slug)
                                ) {
                                    toggle(industry.slug)
                                }
                            }
                        }
                    }

                    if let errorMessage {
                        HStack {
                            Spacer()
                            GFTag(label: errorMessage.uppercased(), severity: .red)
                            Spacer()
                        }
                    }

                    GFButton(
                        label: "CONTINUE",
                        style: .solid,
                        isDisabled: industries.isEmpty,
                        action: onContinue
                    )
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    private func toggle(_ slug: String) {
        if industries.contains(slug) {
            industries.remove(slug)
        } else {
            industries.insert(slug)
        }
    }
}

private struct IndustryChip: View {
    let label: String
    let isSelected: Bool
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            Text(label.uppercased())
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(isSelected ? Color.gf.bg : Color.gf.fg2)
                .padding(.horizontal, Spacing.s3)
                .padding(.vertical, Spacing.s2)
                .background(isSelected ? Color.gf.fg1 : Color.clear)
                .overlay(
                    Rectangle()
                        .stroke(isSelected ? Color.gf.fg1 : Color.gf.rule, lineWidth: 1)
                )
        }
        .buttonStyle(.plain)
    }
}

/// Bare-bones flow layout that wraps children onto new lines as needed.
/// Used by `IndustriesStep` so the 14 industry chips wrap across the
/// available width without locking us into a grid column count.
private struct FlowLayout: Layout {
    let spacing: CGFloat

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let maxWidth = proposal.width ?? .infinity
        var rowWidth: CGFloat = 0
        var rowHeight: CGFloat = 0
        var totalHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if rowWidth + size.width > maxWidth, rowWidth > 0 {
                totalHeight += rowHeight + spacing
                rowWidth = 0
                rowHeight = 0
            }
            rowWidth += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        totalHeight += rowHeight
        return CGSize(width: maxWidth.isFinite ? maxWidth : rowWidth, height: totalHeight)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x: CGFloat = bounds.minX
        var y: CGFloat = bounds.minY
        var rowHeight: CGFloat = 0
        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > bounds.maxX, x > bounds.minX {
                x = bounds.minX
                y += rowHeight + spacing
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: x, y: y), proposal: .unspecified)
            x += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}

// MARK: - Step 3 — Country

private struct CountryStep: View {
    @Binding var countryCode: String
    let accountType: AccountType
    let isSubmitting: Bool
    let errorMessage: String?
    var onContinue: () -> Void

    private var totalSteps: String {
        accountType == .business ? "04" : "03"
    }

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    StepHeader(
                        index: "03",
                        total: totalSteps,
                        title: "Where do you operate?",
                        subtitle: "Sets default jurisdiction for templates and warnings."
                    )

                    GFCard {
                        VStack(alignment: .leading, spacing: Spacing.s3) {
                            Text("// COUNTRY")
                                .font(.gf.label)
                                .tracking(1.0)
                                .foregroundStyle(Color.gf.fg3)

                            Picker("Country", selection: $countryCode) {
                                ForEach(OnboardingCountry.all, id: \.code) { country in
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
                        }
                    }

                    if let errorMessage {
                        HStack {
                            Spacer()
                            GFTag(label: errorMessage.uppercased(), severity: .red)
                            Spacer()
                        }
                    }

                    GFButton(
                        label: isSubmitting ? "SAVING…" : continueLabel,
                        style: .solid,
                        isDisabled: isSubmitting,
                        action: onContinue
                    )
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    private var continueLabel: String {
        accountType == .business ? "CONTINUE" : "FINISH"
    }
}

// MARK: - Step 4 — Business name

private struct BusinessNameStep: View {
    @Binding var businessName: String
    let isSubmitting: Bool
    let errorMessage: String?
    var onFinish: () -> Void

    private var trimmedName: String {
        businessName.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    StepHeader(
                        index: "04",
                        total: "04",
                        title: "What's your business called?",
                        subtitle: "Appears on the contracts you draft."
                    )

                    GFCard {
                        VStack(alignment: .leading, spacing: Spacing.s3) {
                            Text("// BUSINESS NAME")
                                .font(.gf.label)
                                .tracking(1.0)
                                .foregroundStyle(Color.gf.fg3)

                            GFInput(placeholder: "Acme Studios LLC", text: $businessName)
                        }
                    }

                    if let errorMessage {
                        HStack {
                            Spacer()
                            GFTag(label: errorMessage.uppercased(), severity: .red)
                            Spacer()
                        }
                    }

                    GFButton(
                        label: isSubmitting ? "SAVING…" : "FINISH",
                        style: .solid,
                        isDisabled: isSubmitting || trimmedName.isEmpty,
                        action: onFinish
                    )
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

// MARK: - Building blocks

private struct StepHeader: View {
    let index: String
    let total: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// STEP \(index) / \(total)")
                .font(.gf.label)
                .tracking(1.5)
                .foregroundStyle(Color.gf.accent)

            Text(title)
                .font(.gf.h2)
                .foregroundStyle(Color.gf.fg1)

            Text(subtitle)
                .font(.gf.bodySm)
                .foregroundStyle(Color.gf.fg2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}

private struct RadioCard: View {
    let title: String
    let description: String
    let isSelected: Bool
    var onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            GFFrame(bracketColor: isSelected ? Color.gf.accent : Color.gf.fg3) {
                HStack(alignment: .top, spacing: Spacing.s3) {
                    RadioIndicator(isSelected: isSelected)
                        .padding(.top, 2)

                    VStack(alignment: .leading, spacing: Spacing.s2) {
                        Text(title)
                            .font(.gf.label)
                            .tracking(1.2)
                            .foregroundStyle(isSelected ? Color.gf.accent : Color.gf.fg1)
                        Text(description)
                            .font(.gf.bodySm)
                            .foregroundStyle(Color.gf.fg2)
                            .fixedSize(horizontal: false, vertical: true)
                            .multilineTextAlignment(.leading)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .buttonStyle(.plain)
    }
}

private struct RadioIndicator: View {
    let isSelected: Bool

    var body: some View {
        ZStack {
            Rectangle()
                .stroke(isSelected ? Color.gf.accent : Color.gf.rule, lineWidth: 1)
                .frame(width: 18, height: 18)
            if isSelected {
                Rectangle()
                    .fill(Color.gf.accent)
                    .frame(width: 8, height: 8)
            }
        }
    }
}

// MARK: - Curated country list (mirrors SettingsView)

private struct OnboardingCountry: Hashable {
    let code: String
    let name: String
    let flag: String

    static let all: [OnboardingCountry] = [
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
    OnboardingFlow()
        .environment(Session())
}
