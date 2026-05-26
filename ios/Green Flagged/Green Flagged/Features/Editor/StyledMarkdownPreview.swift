import SwiftUI
#if canImport(UIKit)
import UIKit
#endif

// =====================================================================
// StyledMarkdownPreview — lightweight SwiftUI approximation of the web's
// landing/components/contracts/styled-markdown.tsx. Intentionally NOT
// pixel-accurate — the canonical render lives server-side and ships as a
// downloaded PDF/DOCX. This is for in-editor live feedback only.
//
// Bottom watermark makes the approximation explicit.
// =====================================================================

/// Bare business fields the preview can render in `header_with_info` /
/// `cover` placements. Decoupled from the full `BusinessProfile` so the
/// editor only needs to extract the three strings it actually shows.
struct BusinessFields: Equatable, Sendable {
    var name: String?
    var address: String?
    var subtitle: String?
}

struct StyledMarkdownPreview: View {
    let body_md: String
    let title: String
    let style: ContractStyle
    var logoData: Data?
    var business: BusinessFields?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.s5) {
                switch style.layout {
                case .cover:
                    coverBlock
                    divider
                    headerBlock
                    bodyContent
                case .twoColumn:
                    headerBlock
                    twoColumnBody
                case .single:
                    headerBlock
                    bodyContent
                }

                watermark
            }
            .padding(Spacing.s5)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Color.gf.surface)
    }

    // MARK: - Header variants

    @ViewBuilder
    private var headerBlock: some View {
        switch style.logoPlacement {
        case .header:
            if let image = logoImage {
                HStack {
                    Spacer()
                    image
                        .resizable()
                        .scaledToFit()
                        .frame(maxHeight: 56)
                }
            }
        case .headerWithInfo:
            HStack(alignment: .top, spacing: Spacing.s4) {
                if let image = logoImage {
                    image
                        .resizable()
                        .scaledToFit()
                        .frame(maxWidth: 80, maxHeight: 64)
                }
                VStack(alignment: .leading, spacing: Spacing.s1) {
                    if let name = business?.name, !name.isEmpty {
                        Text(name)
                            .font(headingFont)
                            .foregroundStyle(accentColor)
                            .bold()
                    }
                    if let address = business?.address, !address.isEmpty {
                        Text(address)
                            .font(bodyFontSmall)
                            .foregroundStyle(Color.gf.fg2)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer(minLength: 0)
            }
        case .cover, .none:
            EmptyView()
        }
    }

    // MARK: - Cover block

    private var coverBlock: some View {
        VStack(alignment: .center, spacing: Spacing.s4) {
            if style.logoPlacement == .cover, let image = logoImage {
                image
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: 160, maxHeight: 120)
            }
            Text(title)
                .font(coverTitleFont)
                .multilineTextAlignment(.center)
                .foregroundStyle(accentColor)
                .fixedSize(horizontal: false, vertical: true)
            if let business = business?.name, !business.isEmpty {
                Text(business)
                    .font(bodyFont)
                    .foregroundStyle(Color.gf.fg2)
            }
            if let subtitle = business?.subtitle, !subtitle.isEmpty {
                Text(subtitle)
                    .font(bodyFontSmall)
                    .foregroundStyle(Color.gf.fg3)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Spacing.s6)
    }

    // MARK: - Body content

    private var bodyContent: some View {
        VStack(alignment: .leading, spacing: Spacing.s3) {
            ForEach(Array(paragraphs.enumerated()), id: \.offset) { _, chunk in
                paragraphText(chunk)
            }
        }
    }

    /// Two-column body — splits paragraphs roughly in half and renders side
    /// by side. GeometryReader sizes each column so the layout stays inside
    /// the available width without forcing horizontal scroll on iPhone.
    private var twoColumnBody: some View {
        GeometryReader { geo in
            let columnWidth = max(120, (geo.size.width - Spacing.s4) / 2)
            let split = splitParagraphs()
            HStack(alignment: .top, spacing: Spacing.s4) {
                VStack(alignment: .leading, spacing: Spacing.s3) {
                    ForEach(Array(split.left.enumerated()), id: \.offset) { _, chunk in
                        paragraphText(chunk)
                    }
                }
                .frame(width: columnWidth, alignment: .leading)

                VStack(alignment: .leading, spacing: Spacing.s3) {
                    ForEach(Array(split.right.enumerated()), id: \.offset) { _, chunk in
                        paragraphText(chunk)
                    }
                }
                .frame(width: columnWidth, alignment: .leading)
            }
        }
        .frame(minHeight: 400)
    }

    @ViewBuilder
    private func paragraphText(_ chunk: String) -> some View {
        if let attributed = try? AttributedString(
            markdown: chunk,
            options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)
        ) {
            Text(attributed)
                .font(bodyFont)
                .foregroundStyle(Color.gf.fg1)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        } else {
            Text(chunk)
                .font(bodyFont)
                .foregroundStyle(Color.gf.fg1)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private var divider: some View {
        Rectangle()
            .fill(Color.gf.rule)
            .frame(height: 1)
            .padding(.vertical, Spacing.s2)
    }

    private var watermark: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            divider
            Text("// PREVIEW IS APPROXIMATE — DOWNLOAD FOR FINAL")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg4)
        }
    }

    // MARK: - Fonts / colors

    private var accentColor: Color {
        switch style.accent {
        case .ink:
            return Color.gf.fg1
        case .brand:
            return Color(hex: style.brandColor ?? "#4A7A5C") ?? Color.gf.green500
        }
    }

    private var headingFont: Font {
        switch style.typography {
        case .editorial: return .custom("Inter-SemiBold", size: 18)
        case .modern:    return .system(size: 18, weight: .semibold)
        case .classic:   return .custom("Times New Roman", size: 18).weight(.semibold)
        }
    }

    private var coverTitleFont: Font {
        switch style.typography {
        case .editorial: return .custom("Inter-Bold", size: 32)
        case .modern:    return .system(size: 32, weight: .bold)
        case .classic:   return .custom("Times New Roman", size: 32).weight(.bold)
        }
    }

    private var bodyFont: Font {
        switch style.typography {
        case .editorial: return .custom("Inter-Regular", size: 16)
        case .modern:    return .system(size: 16)
        case .classic:   return .custom("Times New Roman", size: 16)
        }
    }

    private var bodyFontSmall: Font {
        switch style.typography {
        case .editorial: return .custom("Inter-Regular", size: 13)
        case .modern:    return .system(size: 13)
        case .classic:   return .custom("Times New Roman", size: 13)
        }
    }

    // MARK: - Image / paragraph helpers

    private var logoImage: Image? {
        #if canImport(UIKit)
        guard let data = logoData, let uiImage = UIImage(data: data) else { return nil }
        return Image(uiImage: uiImage)
        #else
        return nil
        #endif
    }

    private var paragraphs: [String] {
        body_md
            .components(separatedBy: "\n\n")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
    }

    /// Split paragraphs into roughly equal halves by paragraph count. Not
    /// balanced by character count; close enough for a live-preview surface.
    private func splitParagraphs() -> (left: [String], right: [String]) {
        let all = paragraphs
        let mid = (all.count + 1) / 2
        return (Array(all.prefix(mid)), Array(all.dropFirst(mid)))
    }
}
