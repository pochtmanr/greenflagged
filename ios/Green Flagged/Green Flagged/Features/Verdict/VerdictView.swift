import SwiftUI

/// Verdict landing for a scanned contract. Rendered by `ContractDetailView`
/// once the contract + scan load — the parent owns the action callbacks,
/// loading flags, and any sheets (share, version history, translate). This
/// view is a pure presenter, no IO of its own.
///
/// Layout, top → bottom:
/// 1. Severity hero stripe (full-width, ~64pt)
/// 2. Title row + kind badge + relative date
/// 3. Verdict markdown (`AttributedString(markdown:)` w/ paragraph fallback)
/// 4. Taxonomy chips grouped by `TaxonomyDomain`
/// 5. Collapsible redlines list
/// 6. Source toggle (raw `source_text` reveal)
/// 7. Action bar — EXPORT PDF · GENERATE FIX
struct VerdictView: View {
    let detail: ContractDetail
    var isExportingPDF: Bool = false
    var isFixing: Bool = false
    var onExportPDF: () -> Void
    var onApplyFix: (() -> Void)?

    @State private var showSource = false
    @State private var expandedRedlineId: UUID? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: Spacing.s5) {
            severityHero
            titleRow
            verdictMarkdown
            taxonomyChips
            redlinesSection
            sourceToggle
            actionBar
        }
    }

    // MARK: - Severity hero

    private var severityHero: some View {
        let severity = detail.contract.severity ?? .green
        return HStack(alignment: .center, spacing: Spacing.s3) {
            GFTag(label: severity.shortLabel, severity: severity)
            Text(severity.label)
                .font(.gf.h3)
                .foregroundStyle(severity.color)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, Spacing.s4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(height: 64)
        .background(severity.tint)
        .overlay(
            RoundedRectangle(cornerRadius: Radius.sharp)
                .stroke(severity.color.opacity(0.4), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: Radius.sharp))
    }

    // MARK: - Title row

    private var titleRow: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text(detail.contract.displayTitle)
                .font(.gf.h2)
                .foregroundStyle(Color.gf.fg1)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: Spacing.s2) {
                GFTag(label: kindBadge(detail.contract.kind))
                Text(relativeDate(detail.contract.createdAt))
                    .font(.gf.monoSm)
                    .foregroundStyle(Color.gf.fg3)
            }
        }
    }

    // MARK: - Verdict markdown

    private var verdictMarkdown: some View {
        let md = detail.scan?.verdictMd.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("// FULL REVIEW")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                if md.isEmpty {
                    Text("// NO VERDICT YET")
                        .font(.gf.label)
                        .foregroundStyle(Color.gf.fg3)
                } else {
                    let paragraphs = md
                        .components(separatedBy: "\n\n")
                        .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                        .filter { !$0.isEmpty }
                    ForEach(Array(paragraphs.enumerated()), id: \.offset) { _, chunk in
                        markdownParagraph(chunk)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private func markdownParagraph(_ chunk: String) -> some View {
        if let attributed = try? AttributedString(
            markdown: chunk,
            options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        ) {
            Text(attributed)
                .font(.gf.body)
                .foregroundStyle(Color.gf.fg1)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        } else {
            Text(LocalizedStringKey(chunk))
                .font(.gf.body)
                .foregroundStyle(Color.gf.fg1)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Taxonomy chips

    private var taxonomyChips: some View {
        let taxonomy = detail.scan?.taxonomy ?? [:]
        let groups: [(TaxonomyDomain, [TaxonomyKey])] = TaxonomyDomain.allCases.compactMap { domain in
            let keys = TaxonomyKey.allCases.filter {
                $0.domain == domain && taxonomy[$0.rawValue] != nil
            }
            return keys.isEmpty ? nil : (domain, keys)
        }
        let extras = taxonomy.keys
            .filter { TaxonomyKey(rawValue: $0) == nil }
            .sorted()

        return GFCard {
            VStack(alignment: .leading, spacing: Spacing.s4) {
                Text("// CONTRACT MAP")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                if taxonomy.isEmpty {
                    Text("// NO TAXONOMY DATA")
                        .font(.gf.label)
                        .foregroundStyle(Color.gf.fg3)
                } else {
                    ForEach(groups, id: \.0) { (domain, keys) in
                        VStack(alignment: .leading, spacing: Spacing.s2) {
                            Text(domain.label)
                                .font(.gf.label)
                                .tracking(1.0)
                                .foregroundStyle(Color.gf.fg3)
                            chipRow(keys: keys, taxonomy: taxonomy)
                        }
                    }
                    if !extras.isEmpty {
                        VStack(alignment: .leading, spacing: Spacing.s2) {
                            Text("OTHER")
                                .font(.gf.label)
                                .tracking(1.0)
                                .foregroundStyle(Color.gf.fg3)
                            extraChipRow(keys: extras, taxonomy: taxonomy)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func chipRow(keys: [TaxonomyKey], taxonomy: [String: TaxonomyEntry]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Spacing.s2) {
                ForEach(keys, id: \.self) { key in
                    let entry = taxonomy[key.rawValue]
                    GFTag(label: key.label, severity: chipSeverity(entry))
                }
            }
        }
    }

    private func extraChipRow(keys: [String], taxonomy: [String: TaxonomyEntry]) -> some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: Spacing.s2) {
                ForEach(keys, id: \.self) { raw in
                    let entry = taxonomy[raw]
                    GFTag(
                        label: raw.uppercased().replacingOccurrences(of: "_", with: " "),
                        severity: chipSeverity(entry)
                    )
                }
            }
        }
    }

    /// Absent entries render as red — they signal a missing clause the model
    /// expected to find. Otherwise pull whatever severity the AI assigned.
    private func chipSeverity(_ entry: TaxonomyEntry?) -> Severity? {
        guard let entry else { return nil }
        if entry.present == false { return .red }
        return entry.severity
    }

    // MARK: - Redlines

    private var redlinesSection: some View {
        let redlines = detail.scan?.redlines ?? []
        return GFCard {
            VStack(alignment: .leading, spacing: Spacing.s4) {
                Text("// REDLINES")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                if redlines.isEmpty {
                    Text("// NO ISSUES FLAGGED")
                        .font(.gf.label)
                        .foregroundStyle(Color.gf.fg3)
                } else {
                    ForEach(Array(redlines.enumerated()), id: \.element.id) { idx, redline in
                        CollapsibleRedlineBlock(
                            index: idx,
                            redline: redline,
                            isExpanded: expandedRedlineId == redline.id
                        ) {
                            withAnimation(.easeInOut(duration: 0.15)) {
                                expandedRedlineId = expandedRedlineId == redline.id
                                    ? nil
                                    : redline.id
                            }
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Source toggle

    private var sourceToggle: some View {
        VStack(alignment: .leading, spacing: Spacing.s3) {
            GFButton(
                label: showSource ? "HIDE SOURCE" : "VIEW SOURCE",
                style: .link,
                showsArrow: false
            ) {
                withAnimation(.easeInOut(duration: 0.15)) {
                    showSource.toggle()
                }
            }

            if showSource, let sourceText = detail.scan?.sourceText, !sourceText.isEmpty {
                GFFrame {
                    ScrollView {
                        Text(sourceText)
                            .font(.gf.mono)
                            .foregroundStyle(Color.gf.fg2)
                            .textSelection(.enabled)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    .frame(maxHeight: 480)
                }
            }
        }
    }

    // MARK: - Action bar

    private var actionBar: some View {
        VStack(spacing: Spacing.s3) {
            GFButton(
                label: isExportingPDF ? "EXPORTING…" : "EXPORT PDF",
                style: .solid,
                showsArrow: false,
                isDisabled: isExportingPDF
            ) { onExportPDF() }

            if let onApplyFix {
                GFButton(
                    label: isFixing ? "REVISING…" : "GENERATE FIX",
                    style: .ghost,
                    showsArrow: false,
                    isDisabled: isFixing
                ) { onApplyFix() }
            }
        }
    }

    // MARK: - Helpers

    private func relativeDate(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.dateTimeStyle = .named
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }

    private func kindBadge(_ kind: ContractKind?) -> String {
        switch kind {
        case .scanned: "SCANNED"
        case .drafted: "DRAFTED"
        case .none:    "CONTRACT"
        }
    }
}

// MARK: - Collapsible redline block

private struct CollapsibleRedlineBlock: View {
    let index: Int
    let redline: Redline
    let isExpanded: Bool
    let onToggle: () -> Void

    var body: some View {
        GFFrame(bracketColor: redline.severity.color) {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Button(action: onToggle) {
                    HStack(alignment: .top, spacing: Spacing.s3) {
                        VStack(alignment: .leading, spacing: Spacing.s2) {
                            GFTag(
                                label: "\(redline.severity.shortLabel) · REDLINE \(index + 1)",
                                severity: redline.severity
                            )
                            Text(redline.issue)
                                .font(.gf.body)
                                .foregroundStyle(Color.gf.fg1)
                                .lineLimit(isExpanded ? nil : 2)
                                .fixedSize(horizontal: false, vertical: true)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                            .font(.gf.label)
                            .foregroundStyle(Color.gf.fg3)
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)

                if isExpanded {
                    section(
                        label: "// EXCERPT",
                        body: "\u{201C}\(redline.clauseExcerpt)\u{201D}",
                        mono: true,
                        color: Color.gf.fg2
                    )
                    section(
                        label: "// SUGGEST",
                        body: redline.suggestion,
                        mono: false,
                        color: Color.gf.fg1
                    )
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func section(label: String, body: String, mono: Bool, color: Color) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s1) {
            Text(label)
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg3)
            Text(body)
                .font(mono ? .gf.mono : .gf.body)
                .foregroundStyle(color)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
