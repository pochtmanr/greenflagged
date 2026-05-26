import SwiftUI

// =====================================================================
// StyleSidebarView — sheet presented from the contract editor that lets
// the user pick typography / accent / layout / logo placement / brand
// color / attached business profile. Mirrors the right-rail sidebar on
// landing/app/(app)/contracts/[id]/edit/page.tsx.
//
// Parent owns persistence — this view only mutates the two bindings.
// =====================================================================

struct StyleSidebarView: View {
    @Binding var style: ContractStyle
    @Binding var businessProfileId: UUID?

    @Environment(Session.self) private var session
    @Environment(\.dismiss) private var dismiss

    @State private var profiles: [BusinessProfile] = []
    @State private var profilesLoading = false
    @State private var profilesError: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s6) {
                    typographySection
                    accentSection
                    layoutSection
                    logoPlacementSection
                    businessProfileSection
                    resetButton
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
            }
            .background(Color.gf.bg.ignoresSafeArea())
            .navigationTitle("STYLE")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .font(.gf.label)
                        .tracking(1.0)
                        .foregroundStyle(Color.gf.fg1)
                }
            }
            .task { await loadProfiles() }
        }
    }

    // MARK: - Sections

    private var typographySection: some View {
        styleSection(label: "TYPOGRAPHY") {
            toggleRow(
                options: ContractStyle.Typography.allCases,
                isSelected: { $0 == style.typography },
                label: typographyLabel,
                select: { style.typography = $0 }
            )
        }
    }

    private var accentSection: some View {
        styleSection(label: "ACCENT") {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                toggleRow(
                    options: ContractStyle.Accent.allCases,
                    isSelected: { $0 == style.accent },
                    label: accentLabel,
                    select: { style.accent = $0 }
                )

                if style.accent == .brand {
                    brandColorPicker
                }
            }
        }
    }

    private var brandColorPicker: some View {
        HStack(spacing: Spacing.s3) {
            Text("BRAND COLOR")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)

            Spacer()

            ColorPicker(
                "",
                selection: Binding(
                    get: { Color(hex: style.brandColor ?? "#4A7A5C") ?? Color.gf.green500 },
                    set: { newColor in
                        if let hex = newColor.hexString {
                            style.brandColor = hex
                        }
                    }
                ),
                supportsOpacity: false
            )
            .labelsHidden()
            .frame(width: 44, height: 28)

            Text(style.brandColor?.uppercased() ?? "#4A7A5C")
                .font(.gf.monoSm)
                .foregroundStyle(Color.gf.fg3)
        }
    }

    private var layoutSection: some View {
        styleSection(label: "LAYOUT") {
            toggleRow(
                options: ContractStyle.Layout.allCases,
                isSelected: { $0 == style.layout },
                label: layoutLabel,
                select: { style.layout = $0 }
            )
        }
    }

    private var logoPlacementSection: some View {
        styleSection(label: "LOGO PLACEMENT") {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                toggleRow(
                    options: ContractStyle.LogoPlacement.allCases,
                    isSelected: { $0 == style.logoPlacement },
                    label: logoPlacementLabel,
                    select: { style.logoPlacement = $0 }
                )

                if style.logoPlacement == .headerWithInfo {
                    Text("Pulls company name + address from selected business profile.")
                        .font(.gf.bodySm)
                        .foregroundStyle(Color.gf.fg3)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private var businessProfileSection: some View {
        styleSection(label: "BUSINESS PROFILE") {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                if profilesLoading {
                    Text("LOADING PROFILES…")
                        .font(.gf.label)
                        .tracking(1.0)
                        .foregroundStyle(Color.gf.fg3)
                } else if let profilesError {
                    GFTag(label: profilesError.uppercased(), severity: .red)
                } else {
                    Picker("BUSINESS PROFILE", selection: businessProfileBinding) {
                        Text("— NONE —").tag(String?.none)
                        ForEach(profiles) { profile in
                            Text(profileDisplayName(profile))
                                .tag(Optional(profile.id))
                        }
                    }
                    .pickerStyle(.menu)
                    .tint(Color.gf.fg1)
                    .padding(.horizontal, Spacing.s3)
                    .padding(.vertical, Spacing.s3)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.gf.surfaceElev)
                    .overlay(
                        RoundedRectangle(cornerRadius: Radius.sharp)
                            .stroke(Color.gf.rule, lineWidth: 1)
                    )
                }

                NavigationLink {
                    BusinessProfilesView().environment(session)
                } label: {
                    Text("MANAGE PROFILES →")
                        .font(.gf.label)
                        .tracking(1.0)
                        .foregroundStyle(Color.gf.accent)
                }
            }
        }
    }

    private var resetButton: some View {
        GFButton(
            label: "RESET DEFAULTS",
            style: .ghost,
            showsArrow: false
        ) {
            style = .default
            businessProfileId = nil
        }
    }

    // MARK: - Layout helpers

    @ViewBuilder
    private func styleSection<Content: View>(
        label: String,
        @ViewBuilder content: @escaping () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s3) {
            Text("// \(label)")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)
            GFCard { content() }
        }
    }

    /// Renders a row of GFButton toggles where the selected option is `.solid`
    /// and the rest are `.ghost`. Uses a flow-friendly VStack of HStacks so
    /// 3- and 4-option rows fit comfortably on the narrowest iPhone width.
    @ViewBuilder
    private func toggleRow<Option: Hashable>(
        options: [Option],
        isSelected: @escaping (Option) -> Bool,
        label: @escaping (Option) -> String,
        select: @escaping (Option) -> Void
    ) -> some View {
        let columns = [GridItem(.adaptive(minimum: 100), spacing: Spacing.s2)]
        LazyVGrid(columns: columns, alignment: .leading, spacing: Spacing.s2) {
            ForEach(options, id: \.self) { option in
                GFButton(
                    label: label(option),
                    style: isSelected(option) ? .solid : .ghost,
                    showsArrow: false
                ) {
                    select(option)
                }
            }
        }
    }

    // MARK: - Profile loading

    private var businessProfileBinding: Binding<String?> {
        Binding(
            get: { businessProfileId?.uuidString.lowercased() },
            set: { newValue in
                guard let newValue, let uuid = UUID(uuidString: newValue) else {
                    businessProfileId = nil
                    return
                }
                businessProfileId = uuid
            }
        )
    }

    private func profileDisplayName(_ profile: BusinessProfile) -> String {
        let label = profile.label?.trimmingCharacters(in: .whitespacesAndNewlines)
        if let label, !label.isEmpty { return label }
        let business = profile.businessName?.trimmingCharacters(in: .whitespacesAndNewlines)
        if let business, !business.isEmpty { return business }
        let firstName = profile.firstName ?? ""
        let familyName = profile.familyName ?? ""
        let combined = "\(firstName) \(familyName)".trimmingCharacters(in: .whitespacesAndNewlines)
        return combined.isEmpty ? "Profile \(String(profile.id.prefix(6)))" : combined
    }

    private func loadProfiles() async {
        if profilesLoading { return }
        profilesLoading = true
        defer { profilesLoading = false }
        do {
            profiles = try await BusinessProfileRepository.shared.list()
            profilesError = nil
        } catch {
            profilesError = "COULDN'T LOAD PROFILES"
        }
    }

    // MARK: - Label helpers

    private func typographyLabel(_ value: ContractStyle.Typography) -> String {
        switch value {
        case .editorial: return "EDITORIAL"
        case .modern:    return "MODERN"
        case .classic:   return "CLASSIC"
        }
    }

    private func accentLabel(_ value: ContractStyle.Accent) -> String {
        switch value {
        case .ink:   return "INK"
        case .brand: return "BRAND"
        }
    }

    private func layoutLabel(_ value: ContractStyle.Layout) -> String {
        switch value {
        case .single:    return "SINGLE"
        case .twoColumn: return "TWO-COL"
        case .cover:     return "COVER"
        }
    }

    private func logoPlacementLabel(_ value: ContractStyle.LogoPlacement) -> String {
        switch value {
        case .header:         return "HEADER"
        case .headerWithInfo: return "HEADER + INFO"
        case .cover:          return "COVER"
        case .none:           return "NONE"
        }
    }
}
