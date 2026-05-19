import Foundation

// =====================================================================
// Mirrors landing/lib/contracts/types.ts (Question union + helpers).
// Keep aligned with the four industry schemas under
// landing/lib/contracts/industries/. The server validates submitted
// answers with the matching zod validator, so diverging here surfaces
// as 400 "Invalid answers" responses on submit.
// =====================================================================

enum DraftIndustry: String, CaseIterable, Identifiable, Sendable {
    case freelance
    case software
    case design
    case nda

    var id: String { rawValue }

    /// Mirrors the `label` field on the matching `IndustrySchema` export.
    var label: String {
        switch self {
        case .freelance: "Freelance"
        case .software:  "Software / IT"
        case .design:    "Design / Creative"
        case .nda:       "NDA"
        }
    }

    /// Mirrors the `description` field on the matching `IndustrySchema`
    /// export. Used in the industry-picker step.
    var description: String {
        switch self {
        case .freelance: "Services contract for solo freelancers and small studios."
        case .software:  "Build, integrate, or maintain software for a client."
        case .design:    "Brand, graphic, web, or illustration work."
        case .nda:       "Mutual or one-way non-disclosure agreement."
        }
    }

    /// Short headline shown on the industry-picker cards.
    var headline: String {
        switch self {
        case .freelance: "Freelance services"
        case .software:  "Software engagement"
        case .design:    "Design / creative"
        case .nda:       "NDA / confidentiality"
        }
    }
}

struct SelectOption: Hashable, Sendable {
    let value: String
    let label: String
}

/// Discriminated union mirroring `Question` in
/// `landing/lib/contracts/types.ts`. Every case captures only the fields
/// the iOS wizard renders; server-only helpers (`dynamicHelp`, `tooltip`)
/// are intentionally omitted.
enum Question: Identifiable, Sendable, Hashable {
    case text(
        id: String,
        label: String,
        placeholder: String?,
        multiline: Bool,
        required: Bool,
        help: String?
    )
    case select(
        id: String,
        label: String,
        options: [SelectOption],
        required: Bool,
        help: String?,
        optionDescriptions: [String: String]
    )
    case number(
        id: String,
        label: String,
        min: Double?,
        max: Double?,
        step: Double?,
        suffix: String?,
        defaultValue: Double?,
        required: Bool,
        help: String?
    )
    case date(
        id: String,
        label: String,
        allowOpenEnded: Bool,
        openLabel: String?,
        required: Bool,
        help: String?
    )
    case toggle(
        id: String,
        label: String,
        defaultValue: Bool,
        help: String?
    )
    case checkboxGroup(
        id: String,
        label: String,
        options: [SelectOption],
        defaultValue: [String],
        required: Bool,
        help: String?
    )
    case nameGroup(
        id: String,
        label: String,
        showBusiness: Bool,
        required: Bool,
        help: String?
    )
    case address(
        id: String,
        label: String,
        required: Bool,
        help: String?
    )
    case improveTextarea(
        id: String,
        label: String,
        fieldKind: String,  // "scope" | "deliverables"
        placeholder: String?,
        minRows: Int,
        required: Bool,
        help: String?
    )

    var id: String {
        switch self {
        case .text(let id, _, _, _, _, _),
             .select(let id, _, _, _, _, _),
             .number(let id, _, _, _, _, _, _, _, _),
             .date(let id, _, _, _, _, _),
             .toggle(let id, _, _, _),
             .checkboxGroup(let id, _, _, _, _, _),
             .nameGroup(let id, _, _, _, _),
             .address(let id, _, _, _),
             .improveTextarea(let id, _, _, _, _, _, _):
            return id
        }
    }

    var label: String {
        switch self {
        case .text(_, let l, _, _, _, _),
             .select(_, let l, _, _, _, _),
             .number(_, let l, _, _, _, _, _, _, _),
             .date(_, let l, _, _, _, _),
             .toggle(_, let l, _, _),
             .checkboxGroup(_, let l, _, _, _, _),
             .nameGroup(_, let l, _, _, _),
             .address(_, let l, _, _),
             .improveTextarea(_, let l, _, _, _, _, _):
            return l
        }
    }

    var help: String? {
        switch self {
        case .text(_, _, _, _, _, let h),
             .select(_, _, _, _, let h, _),
             .number(_, _, _, _, _, _, _, _, let h),
             .date(_, _, _, _, _, let h),
             .toggle(_, _, _, let h),
             .checkboxGroup(_, _, _, _, _, let h),
             .nameGroup(_, _, _, _, let h),
             .address(_, _, _, let h),
             .improveTextarea(_, _, _, _, _, _, let h):
            return h
        }
    }

    /// `true` when the question must be answered before the user can
    /// advance the wizard. Mirrors the `required` flag on the TS source.
    var isRequired: Bool {
        switch self {
        case .text(_, _, _, _, let r, _),
             .select(_, _, _, let r, _, _),
             .number(_, _, _, _, _, _, _, let r, _),
             .date(_, _, _, _, let r, _),
             .checkboxGroup(_, _, _, _, let r, _),
             .nameGroup(_, _, _, let r, _),
             .address(_, _, let r, _),
             .improveTextarea(_, _, _, _, _, let r, _):
            return r
        case .toggle:
            // Toggles always have a default value — never blocking.
            return false
        }
    }
}

/// Curated jurisdiction list mirroring `JURISDICTION_OPTIONS` in
/// `landing/lib/contracts/jurisdictions.ts`. The eight supported
/// jurisdictions the server understands for the per-country legal layer.
let JURISDICTION_OPTIONS: [SelectOption] = [
    SelectOption(value: "DE", label: "Germany"),
    SelectOption(value: "EU", label: "European Union (B2B, non-DE)"),
    SelectOption(value: "US", label: "United States"),
    SelectOption(value: "UK", label: "United Kingdom"),
    SelectOption(value: "IL", label: "Israel"),
    SelectOption(value: "SG", label: "Singapore"),
    SelectOption(value: "IN", label: "India"),
    SelectOption(value: "AE", label: "United Arab Emirates"),
]

/// Returns the question list for the given industry. Mirrors
/// `getIndustry(id).questions` on the server.
func industrySchema(_ industry: DraftIndustry) -> [Question] {
    switch industry {
    case .freelance: return FreelanceQuestions.questions
    case .software:  return SoftwareQuestions.questions
    case .design:    return DesignQuestions.questions
    case .nda:       return NdaQuestions.questions
    }
}
