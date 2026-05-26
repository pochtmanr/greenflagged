import Foundation
import UIKit

/// On-device PDF rendering. No server involved — text is laid out via
/// NSLayoutManager so multi-page contracts paginate naturally.
enum PDFExportService {
    /// Renders a verdict (scanned) or draft body (drafted) into a temp PDF
    /// and returns the URL. Caller is responsible for sharing/deleting.
    @MainActor
    static func render(detail: ContractDetail) throws -> URL {
        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792) // US Letter
        let margin: CGFloat = 36
        let textRect = pageRect.insetBy(dx: margin, dy: margin)

        let attributed = buildAttributedString(detail: detail)
        let textStorage = NSTextStorage(attributedString: attributed)
        let layoutManager = NSLayoutManager()
        textStorage.addLayoutManager(layoutManager)

        // Add containers until every glyph has somewhere to live.
        var keepAdding = true
        while keepAdding {
            let container = NSTextContainer(size: textRect.size)
            container.lineFragmentPadding = 0
            layoutManager.addTextContainer(container)
            let placed = layoutManager.glyphRange(for: container).upperBound
            keepAdding = placed < layoutManager.numberOfGlyphs
        }

        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("\(detail.contract.id).pdf")
        try? FileManager.default.removeItem(at: url)

        let renderer = UIGraphicsPDFRenderer(bounds: pageRect)
        try renderer.writePDF(to: url) { ctx in
            for container in layoutManager.textContainers {
                ctx.beginPage()
                let range = layoutManager.glyphRange(for: container)
                layoutManager.drawBackground(forGlyphRange: range, at: textRect.origin)
                layoutManager.drawGlyphs(forGlyphRange: range, at: textRect.origin)
            }
        }
        return url
    }

    // MARK: - Attributed string builder

    @MainActor
    private static func buildAttributedString(detail: ContractDetail) -> NSAttributedString {
        let out = NSMutableAttributedString()
        let title = detail.contract.displayTitle
        out.append(line(title, font: .systemFont(ofSize: 22, weight: .bold)))
        out.append(spacer(8))

        if let scan = detail.scan {
            let sev = detail.contract.severity?.rawValue.uppercased() ?? "—"
            out.append(line("SEVERITY · \(sev)", font: .systemFont(ofSize: 12, weight: .semibold), color: .secondaryLabel))
            out.append(spacer(16))

            if !scan.verdictMd.isEmpty {
                out.append(line("FULL REVIEW", font: .systemFont(ofSize: 14, weight: .bold), color: .secondaryLabel))
                out.append(spacer(4))
                out.append(paragraph(scan.verdictMd))
                out.append(spacer(16))
            }

            if !scan.taxonomy.isEmpty {
                out.append(line("CONTRACT MAP", font: .systemFont(ofSize: 14, weight: .bold), color: .secondaryLabel))
                out.append(spacer(4))
                for (key, entry) in scan.taxonomy.sorted(by: { $0.key < $1.key }) {
                    let label = key.uppercased().replacingOccurrences(of: "_", with: " ")
                    let summary = (entry.summary?.isEmpty == false) ? entry.summary! : (entry.present == false ? "ABSENT" : "—")
                    out.append(line("\(label): \(summary)", font: .systemFont(ofSize: 11)))
                }
                out.append(spacer(16))
            }

            if !scan.redlines.isEmpty {
                out.append(line("REDLINES", font: .systemFont(ofSize: 14, weight: .bold), color: .secondaryLabel))
                out.append(spacer(4))
                for (idx, redline) in scan.redlines.enumerated() {
                    out.append(line(
                        "\(idx + 1). [\(redline.severity.rawValue.uppercased())] \(redline.issue)",
                        font: .systemFont(ofSize: 12, weight: .semibold)
                    ))
                    if !redline.clauseExcerpt.isEmpty {
                        out.append(paragraph("Clause: “\(redline.clauseExcerpt)”", font: .italicSystemFont(ofSize: 11), color: .secondaryLabel))
                    }
                    if !redline.suggestion.isEmpty {
                        out.append(paragraph("Suggestion: \(redline.suggestion)"))
                    }
                    out.append(spacer(8))
                }
            }
        } else if let body = detail.draftBody, !body.isEmpty {
            out.append(paragraph(body))
        } else {
            out.append(paragraph("No content available."))
        }

        return out
    }

    // MARK: - Helpers

    private static func line(_ text: String, font: UIFont, color: UIColor = .label) -> NSAttributedString {
        let para = NSMutableParagraphStyle()
        para.paragraphSpacing = 2
        return NSAttributedString(
            string: "\(text)\n",
            attributes: [.font: font, .foregroundColor: color, .paragraphStyle: para]
        )
    }

    private static func paragraph(_ text: String, font: UIFont = .systemFont(ofSize: 12), color: UIColor = .label) -> NSAttributedString {
        let para = NSMutableParagraphStyle()
        para.paragraphSpacing = 6
        para.lineSpacing = 2
        return NSAttributedString(
            string: "\(text)\n",
            attributes: [.font: font, .foregroundColor: color, .paragraphStyle: para]
        )
    }

    private static func spacer(_ height: CGFloat) -> NSAttributedString {
        let para = NSMutableParagraphStyle()
        para.paragraphSpacing = height
        return NSAttributedString(
            string: "\n",
            attributes: [.font: UIFont.systemFont(ofSize: 1), .paragraphStyle: para]
        )
    }
}
