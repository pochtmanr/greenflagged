import Foundation

/// Canonical industry list. Mirrors `landing/lib/industries.ts` exactly —
/// slugs are wire format and must not drift from the web. Used by the
/// onboarding flow and the settings industries editor; persisted as
/// `profiles.industries text[]`.
struct ProfileIndustry: Identifiable, Hashable, Sendable {
    let slug: String
    let label: String

    var id: String { slug }

    static let all: [ProfileIndustry] = [
        .init(slug: "freelance",  label: "Freelance services"),
        .init(slug: "software",   label: "Software / SaaS"),
        .init(slug: "design",     label: "Design / Creative"),
        .init(slug: "marketing",  label: "Marketing / Advertising"),
        .init(slug: "consulting", label: "Consulting / Advisory"),
        .init(slug: "ecommerce",  label: "E-commerce / Retail"),
        .init(slug: "realestate", label: "Real estate"),
        .init(slug: "legal",      label: "Legal services"),
        .init(slug: "healthcare", label: "Healthcare / Wellness"),
        .init(slug: "finance",    label: "Finance / Fintech"),
        .init(slug: "education",  label: "Education / Training"),
        .init(slug: "media",      label: "Media / Content"),
        .init(slug: "nonprofit",  label: "Non-profit / NGO"),
        .init(slug: "other",      label: "Other"),
    ]
}
