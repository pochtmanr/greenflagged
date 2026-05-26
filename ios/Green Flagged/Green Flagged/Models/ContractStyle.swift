import Foundation

/// Mirrors `landing/lib/pdf/themes.ts` `ContractStyle`. Persisted as JSON in
/// the `contracts.style` column. Field naming uses snake_case on the wire to
/// match the web's zod schema and the row format.
///
/// `nonisolated` because `SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor` would
/// otherwise force `Codable`/`Sendable` onto the main actor and break decoding
/// inside background actors (APIClient).
nonisolated struct ContractStyle: Codable, Sendable, Hashable {
    enum Typography: String, Codable, CaseIterable, Sendable {
        case editorial, modern, classic
    }

    enum Accent: String, Codable, CaseIterable, Sendable {
        case ink, brand
    }

    enum Layout: String, Codable, CaseIterable, Sendable {
        case single
        case twoColumn = "two-column"
        case cover
    }

    enum LogoPlacement: String, Codable, CaseIterable, Sendable {
        case header
        case headerWithInfo = "header_with_info"
        case cover
        case none
    }

    var typography: Typography
    var accent: Accent
    var layout: Layout
    var logoPlacement: LogoPlacement
    var brandColor: String?

    static let `default` = ContractStyle(
        typography: .editorial,
        accent: .ink,
        layout: .single,
        logoPlacement: .header,
        brandColor: nil
    )

    enum CodingKeys: String, CodingKey {
        case typography
        case accent
        case layout
        case logoPlacement = "logo_placement"
        case brandColor    = "brand_color"
    }

    /// Tolerant decoder — older rows may carry retired enum cases (`sage`
    /// accent, `footer` placement) that the web's `coerceStyle` collapses.
    /// Mirror that coercion here so a legacy row doesn't crash the editor.
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)

        let typographyRaw = (try? c.decode(String.self, forKey: .typography)) ?? "editorial"
        typography = Typography(rawValue: typographyRaw) ?? .editorial

        let accentRaw = (try? c.decode(String.self, forKey: .accent)) ?? "ink"
        accent = Accent(rawValue: accentRaw) ?? .ink   // "sage" falls back to .ink

        let layoutRaw = (try? c.decode(String.self, forKey: .layout)) ?? "single"
        layout = Layout(rawValue: layoutRaw) ?? .single

        let placementRaw = (try? c.decode(String.self, forKey: .logoPlacement)) ?? "header"
        if placementRaw == "footer" {
            logoPlacement = .none
        } else {
            logoPlacement = LogoPlacement(rawValue: placementRaw) ?? .header
        }

        brandColor = try? c.decodeIfPresent(String.self, forKey: .brandColor)
    }

    init(
        typography: Typography,
        accent: Accent,
        layout: Layout,
        logoPlacement: LogoPlacement,
        brandColor: String?
    ) {
        self.typography = typography
        self.accent = accent
        self.layout = layout
        self.logoPlacement = logoPlacement
        self.brandColor = brandColor
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(typography, forKey: .typography)
        try c.encode(accent, forKey: .accent)
        try c.encode(layout, forKey: .layout)
        try c.encode(logoPlacement, forKey: .logoPlacement)
        try c.encodeIfPresent(brandColor, forKey: .brandColor)
    }
}
