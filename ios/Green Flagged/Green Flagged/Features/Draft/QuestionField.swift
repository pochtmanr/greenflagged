import SwiftUI

// =====================================================================
// QuestionField — renders one Question variant from QuestionSchema.swift
// against a binding into a DraftAnswers value. Each field handles its
// own answer write-through; the wizard just hands it the live store.
// =====================================================================

struct QuestionField: View {
    let question: Question
    @Bindable var answers: DraftAnswers
    /// When non-nil the wizard has flagged this required field as empty
    /// on a CONTINUE press; we surface a red GFTag under the input.
    var validationError: String?

    @Environment(Session.self) private var session
    @State private var isImproving = false
    @State private var improveTag: (label: String, severity: Severity)?

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            header
            control
            if let help = question.help, !help.isEmpty {
                Text(help)
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg3)
                    .fixedSize(horizontal: false, vertical: true)
            }
            if let validationError {
                GFTag(label: validationError.uppercased(), severity: .red)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: - Header

    @ViewBuilder
    private var header: some View {
        HStack(spacing: Spacing.s2) {
            Text("// \(question.label.uppercased())")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg3)
            if question.isRequired {
                Text("·")
                    .font(.gf.label)
                    .foregroundStyle(Color.gf.fg4)
                Text("REQUIRED")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.accent)
            }
            Spacer(minLength: 0)
        }
    }

    // MARK: - Control switch

    @ViewBuilder
    private var control: some View {
        switch question {
        case .text(_, _, let placeholder, let multiline, _, _):
            textControl(placeholder: placeholder, multiline: multiline)

        case .select(_, _, let options, _, _, let optionDescriptions):
            selectControl(options: options, optionDescriptions: optionDescriptions)

        case .number(_, _, let min, let max, _, let suffix, _, _, _):
            numberControl(min: min, max: max, suffix: suffix)

        case .date(_, _, let allowOpenEnded, let openLabel, _, _):
            dateControl(allowOpenEnded: allowOpenEnded, openLabel: openLabel)

        case .toggle(_, let label, _, _):
            toggleControl(label: label)

        case .checkboxGroup(_, _, let options, _, _, _):
            checkboxGroupControl(options: options)

        case .nameGroup(_, _, let showBusiness, _, _):
            nameGroupControl(showBusiness: showBusiness)

        case .address:
            addressControl()

        case .improveTextarea(_, _, let fieldKind, let placeholder, let minRows, _, _):
            improveTextareaControl(fieldKind: fieldKind, placeholder: placeholder, minRows: minRows)
        }
    }

    // MARK: - Text

    @ViewBuilder
    private func textControl(placeholder: String?, multiline: Bool) -> some View {
        let binding = Binding<String>(
            get: {
                if case .string(let s) = answers.values[question.id] { return s }
                return ""
            },
            set: { newValue in
                answers.values[question.id] = .string(newValue)
            }
        )

        if multiline {
            GFFrame {
                TextEditor(text: binding)
                    .font(.gf.body)
                    .foregroundStyle(Color.gf.fg1)
                    .scrollContentBackground(.hidden)
                    .frame(minHeight: 120)
                    .accessibilityLabel(question.label)
            }
        } else {
            GFInput(placeholder: placeholder ?? "", text: binding)
                .accessibilityLabel(question.label)
        }
    }

    // MARK: - Select (dropdown)

    @ViewBuilder
    private func selectControl(
        options: [SelectOption],
        optionDescriptions: [String: String]
    ) -> some View {
        let binding = Binding<String>(
            get: {
                if case .string(let s) = answers.values[question.id] { return s }
                return ""
            },
            set: { newValue in
                answers.values[question.id] = .string(newValue)
            }
        )

        // Matches the country picker chrome in SettingsView.swift.
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Picker(question.label, selection: binding) {
                Text("— Select —").tag("")
                ForEach(options, id: \.value) { opt in
                    Text(opt.label).tag(opt.value)
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

            if let desc = optionDescriptions[binding.wrappedValue], !desc.isEmpty {
                Text(desc)
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg3)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }

    // MARK: - Number

    @ViewBuilder
    private func numberControl(min: Double?, max: Double?, suffix: String?) -> some View {
        let textBinding = Binding<String>(
            get: {
                if case .number(let n) = answers.values[question.id] {
                    return Self.numberFormatter.string(from: NSNumber(value: n))
                        ?? String(format: "%g", n)
                }
                return ""
            },
            set: { newValue in
                let cleaned = newValue
                    .replacingOccurrences(of: ",", with: ".")
                    .trimmingCharacters(in: .whitespacesAndNewlines)
                if cleaned.isEmpty {
                    answers.values.removeValue(forKey: question.id)
                    return
                }
                if let parsed = Double(cleaned) {
                    var clamped = parsed
                    if let min, clamped < min { clamped = min }
                    if let max, clamped > max { clamped = max }
                    answers.values[question.id] = .number(clamped)
                }
            }
        )

        HStack(spacing: Spacing.s3) {
            TextField("0", text: textBinding)
                .font(.gf.body)
                .foregroundStyle(Color.gf.fg1)
                .keyboardType(.decimalPad)
                .padding(.horizontal, Spacing.s3)
                .padding(.vertical, Spacing.s3)
                .background(Color.gf.surfaceElev)
                .overlay(
                    RoundedRectangle(cornerRadius: Radius.sharp)
                        .stroke(Color.gf.rule, lineWidth: 1)
                )
                .clipShape(RoundedRectangle(cornerRadius: Radius.sharp))

            if let suffix, !suffix.isEmpty {
                Text(suffix.uppercased())
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg3)
            }
        }
    }

    // MARK: - Date

    @ViewBuilder
    private func dateControl(allowOpenEnded: Bool, openLabel: String?) -> some View {
        let openKey = "\(question.id)_open"

        let openBinding = Binding<Bool>(
            get: {
                if case .bool(let b) = answers.values[openKey] { return b }
                return false
            },
            set: { newValue in
                answers.values[openKey] = .bool(newValue)
                if newValue {
                    // Clear the actual date when "open-ended" is on.
                    answers.values.removeValue(forKey: question.id)
                }
            }
        )

        let dateBinding = Binding<Date>(
            get: {
                if case .date(let d) = answers.values[question.id] { return d }
                return Date()
            },
            set: { newValue in
                answers.values[question.id] = .date(newValue)
            }
        )

        VStack(alignment: .leading, spacing: Spacing.s2) {
            DatePicker(
                question.label,
                selection: dateBinding,
                displayedComponents: [.date]
            )
            .datePickerStyle(.compact)
            .labelsHidden()
            .tint(Color.gf.accent)
            .disabled(openBinding.wrappedValue)
            .opacity(openBinding.wrappedValue ? 0.5 : 1.0)

            if allowOpenEnded {
                Toggle(isOn: openBinding) {
                    Text(openLabel ?? "Open-ended")
                        .font(.gf.bodySm)
                        .foregroundStyle(Color.gf.fg2)
                }
                .tint(Color.gf.accent)
            }
        }
    }

    // MARK: - Toggle

    @ViewBuilder
    private func toggleControl(label: String) -> some View {
        let binding = Binding<Bool>(
            get: {
                if case .bool(let b) = answers.values[question.id] { return b }
                return false
            },
            set: { newValue in
                answers.values[question.id] = .bool(newValue)
            }
        )

        Toggle(isOn: binding) {
            Text(label)
                .font(.gf.body)
                .foregroundStyle(Color.gf.fg1)
                .fixedSize(horizontal: false, vertical: true)
        }
        .tint(Color.gf.accent)
    }

    // MARK: - Checkbox group

    @ViewBuilder
    private func checkboxGroupControl(options: [SelectOption]) -> some View {
        let currentBinding = Binding<[String]>(
            get: {
                if case .stringArray(let xs) = answers.values[question.id] { return xs }
                return []
            },
            set: { newValue in
                answers.values[question.id] = .stringArray(newValue)
            }
        )

        VStack(spacing: Spacing.s2) {
            ForEach(options, id: \.value) { opt in
                let isOn = currentBinding.wrappedValue.contains(opt.value)
                Button {
                    var next = currentBinding.wrappedValue
                    if isOn {
                        next.removeAll { $0 == opt.value }
                    } else {
                        next.append(opt.value)
                    }
                    currentBinding.wrappedValue = next
                } label: {
                    HStack(spacing: Spacing.s3) {
                        Image(systemName: isOn ? "checkmark.square.fill" : "square")
                            .foregroundStyle(isOn ? Color.gf.accent : Color.gf.fg3)
                        Text(opt.label)
                            .font(.gf.body)
                            .foregroundStyle(Color.gf.fg1)
                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, Spacing.s3)
                    .padding(.vertical, Spacing.s3)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.gf.surfaceElev)
                    .overlay(
                        RoundedRectangle(cornerRadius: Radius.sharp)
                            .stroke(isOn ? Color.gf.accent : Color.gf.rule, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: Radius.sharp))
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Name group

    @ViewBuilder
    private func nameGroupControl(showBusiness: Bool) -> some View {
        // Pull current values out of the answer store.
        let current: (first: String?, family: String?, business: String?) = {
            if case .nameGroup(let f, let fam, let biz) = answers.values[question.id] {
                return (f, fam, biz)
            }
            return (nil, nil, nil)
        }()

        let firstBinding = Binding<String>(
            get: { current.first ?? "" },
            set: { newValue in
                answers.values[question.id] = .nameGroup(
                    first: newValue,
                    family: current.family,
                    business: current.business
                )
            }
        )
        let familyBinding = Binding<String>(
            get: { current.family ?? "" },
            set: { newValue in
                answers.values[question.id] = .nameGroup(
                    first: current.first,
                    family: newValue,
                    business: current.business
                )
            }
        )
        let businessBinding = Binding<String>(
            get: { current.business ?? "" },
            set: { newValue in
                answers.values[question.id] = .nameGroup(
                    first: current.first,
                    family: current.family,
                    business: newValue
                )
            }
        )

        VStack(alignment: .leading, spacing: Spacing.s2) {
            labeledRow("FIRST NAME") {
                GFInput(placeholder: "First name", text: firstBinding)
            }
            labeledRow("FAMILY NAME") {
                GFInput(placeholder: "Family name", text: familyBinding)
            }
            if showBusiness {
                labeledRow("BUSINESS (OPTIONAL)") {
                    GFInput(placeholder: "Business name", text: businessBinding)
                }
            }
        }
    }

    // MARK: - Address

    @ViewBuilder
    private func addressControl() -> some View {
        let current: (country: String?, city: String?, street: String?, postal: String?) = {
            if case .address(let c, let ci, let st, let p) = answers.values[question.id] {
                return (c, ci, st, p)
            }
            return (nil, nil, nil, nil)
        }()

        let countryBinding = Binding<String>(
            get: { current.country ?? "" },
            set: { newValue in
                answers.values[question.id] = .address(
                    country: newValue,
                    city: current.city,
                    street: current.street,
                    postal: current.postal
                )
            }
        )
        let cityBinding = Binding<String>(
            get: { current.city ?? "" },
            set: { newValue in
                answers.values[question.id] = .address(
                    country: current.country,
                    city: newValue,
                    street: current.street,
                    postal: current.postal
                )
            }
        )
        let streetBinding = Binding<String>(
            get: { current.street ?? "" },
            set: { newValue in
                answers.values[question.id] = .address(
                    country: current.country,
                    city: current.city,
                    street: newValue,
                    postal: current.postal
                )
            }
        )
        let postalBinding = Binding<String>(
            get: { current.postal ?? "" },
            set: { newValue in
                answers.values[question.id] = .address(
                    country: current.country,
                    city: current.city,
                    street: current.street,
                    postal: newValue
                )
            }
        )

        VStack(alignment: .leading, spacing: Spacing.s2) {
            labeledRow("STREET") {
                GFInput(placeholder: "Street + number", text: streetBinding)
            }
            labeledRow("CITY") {
                GFInput(placeholder: "City", text: cityBinding)
            }
            labeledRow("POSTAL CODE") {
                GFInput(placeholder: "Postal / ZIP", text: postalBinding)
            }
            labeledRow("COUNTRY (ISO-2)") {
                Picker("Country", selection: countryBinding) {
                    Text("— Select —").tag("")
                    ForEach(AddressCountry.options, id: \.code) { country in
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
    }

    // MARK: - Improve textarea

    @ViewBuilder
    private func improveTextareaControl(
        fieldKind: String,
        placeholder: String?,
        minRows: Int
    ) -> some View {
        let binding = Binding<String>(
            get: {
                if case .string(let s) = answers.values[question.id] { return s }
                return ""
            },
            set: { newValue in
                answers.values[question.id] = .string(newValue)
            }
        )

        // 22pt per row matches the web wizard's vertical rhythm closely enough.
        let minHeight = CGFloat(minRows) * 22.0
        let kind = ImproveFieldKind(rawValue: fieldKind) ?? .scope

        VStack(alignment: .leading, spacing: Spacing.s2) {
            HStack(alignment: .center) {
                Spacer(minLength: 0)
                GFButton(
                    label: isImproving ? "IMPROVING…" : "IMPROVE",
                    style: .link,
                    showsArrow: false,
                    isDisabled: isImproving
                ) {
                    improveAction(binding: binding, kind: kind)
                }
            }
            GFFrame {
                ZStack(alignment: .topLeading) {
                    if binding.wrappedValue.isEmpty, let placeholder, !placeholder.isEmpty {
                        Text(placeholder)
                            .font(.gf.body)
                            .foregroundStyle(Color.gf.fg4)
                            .padding(.horizontal, Spacing.s1)
                            .padding(.vertical, Spacing.s2)
                            .allowsHitTesting(false)
                    }
                    TextEditor(text: binding)
                        .font(.gf.body)
                        .foregroundStyle(Color.gf.fg1)
                        .scrollContentBackground(.hidden)
                        .frame(minHeight: minHeight)
                        .accessibilityLabel(question.label)
                }
            }
            if let tag = improveTag {
                GFTag(label: tag.label, severity: tag.severity)
            }
        }
    }

    private func improveAction(binding: Binding<String>, kind: ImproveFieldKind) {
        let current = binding.wrappedValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !current.isEmpty else {
            improveTag = (label: "TYPE SOMETHING FIRST", severity: .yellow)
            return
        }
        improveTag = nil
        isImproving = true
        Task {
            defer { isImproving = false }
            do {
                let token = try await session.currentAccessToken()
                let improved = try await APIClient.shared.improve(
                    text: binding.wrappedValue,
                    fieldKind: kind,
                    token: token
                )
                binding.wrappedValue = improved
                improveTag = nil
            } catch {
                improveTag = (label: String(describing: error).uppercased(), severity: .red)
            }
        }
    }

    // MARK: - Subviews

    @ViewBuilder
    private func labeledRow<Content: View>(
        _ label: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s1) {
            Text("// \(label)")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg4)
            content()
        }
    }

    private static let numberFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.maximumFractionDigits = 2
        f.minimumFractionDigits = 0
        f.locale = Locale(identifier: "en_US_POSIX")
        f.groupingSeparator = ""
        return f
    }()
}

// MARK: - Address country list

/// Curated ISO-3166 alpha-2 list. The server validates `country.length === 2`
/// against `COUNTRY_CODES` (the full ISO list), so this short list only
/// needs to be a subset — we expand it as analytics surface new markets.
struct AddressCountry: Hashable, Sendable {
    let code: String
    let name: String
    let flag: String

    static let options: [AddressCountry] = [
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
        .init(code: "IE", name: "Ireland",        flag: "🇮🇪"),
        .init(code: "SE", name: "Sweden",         flag: "🇸🇪"),
        .init(code: "DK", name: "Denmark",        flag: "🇩🇰"),
        .init(code: "NO", name: "Norway",         flag: "🇳🇴"),
        .init(code: "FI", name: "Finland",        flag: "🇫🇮"),
        .init(code: "CH", name: "Switzerland",    flag: "🇨🇭"),
        .init(code: "AT", name: "Austria",        flag: "🇦🇹"),
        .init(code: "BE", name: "Belgium",        flag: "🇧🇪"),
        .init(code: "PT", name: "Portugal",       flag: "🇵🇹"),
        .init(code: "CZ", name: "Czechia",        flag: "🇨🇿"),
        .init(code: "IL", name: "Israel",         flag: "🇮🇱"),
        .init(code: "AE", name: "UAE",            flag: "🇦🇪"),
        .init(code: "SG", name: "Singapore",      flag: "🇸🇬"),
        .init(code: "IN", name: "India",          flag: "🇮🇳"),
        .init(code: "JP", name: "Japan",          flag: "🇯🇵"),
        .init(code: "KR", name: "South Korea",    flag: "🇰🇷"),
        .init(code: "BR", name: "Brazil",         flag: "🇧🇷"),
        .init(code: "MX", name: "Mexico",         flag: "🇲🇽"),
        .init(code: "UA", name: "Ukraine",        flag: "🇺🇦"),
        .init(code: "RU", name: "Russia",         flag: "🇷🇺"),
    ]
}
