import Foundation

// Mirrors landing/lib/contracts/industries/nda.ts (ndaQuestions).
// If you change one, change the other. Diverging means the iOS form
// submits answers the server rejects.

enum NdaQuestions {
    private static let CARVE_OUT_OPTIONS: [SelectOption] = [
        SelectOption(value: "prior",       label: "Prior knowledge"),
        SelectOption(value: "independent", label: "Independently developed"),
        SelectOption(value: "public",      label: "Publicly known"),
        SelectOption(value: "legal",       label: "Required by law"),
    ]

    private static let HELP_SURVIVAL =
        "When on, confidentiality obligations continue after the NDA ends. Standard for trade secrets — they don't stop being secret when the contract expires."
    private static let HELP_CARVE_OUTS =
        "Information that isn't covered by the NDA. The four defaults are standard."
    private static let HELP_GOVERNING_LAW =
        "The legal system that interprets this NDA. Pick where you (or the disclosing party) are based — easier and cheaper to enforce locally."

    static let questions: [Question] = [
        .toggle(
            id: "mutual",
            label: "Mutual NDA? (off = one-way)",
            defaultValue: true,
            help: nil
        ),
        .nameGroup(
            id: "disclosing_party",
            label: "Disclosing party",
            showBusiness: true,
            required: true,
            help: "The party sharing confidential information."
        ),
        .address(
            id: "disclosing_party_address",
            label: "Disclosing party address",
            required: true,
            help: nil
        ),
        .nameGroup(
            id: "receiving_party",
            label: "Receiving party",
            showBusiness: true,
            required: true,
            help: "The party receiving confidential information."
        ),
        .address(
            id: "receiving_party_address",
            label: "Receiving party address",
            required: true,
            help: nil
        ),
        .text(
            id: "purpose",
            label: "Purpose of disclosure",
            placeholder: "Why are you sharing the information? (e.g. evaluate a partnership)",
            multiline: true,
            required: true,
            help: nil
        ),
        .number(
            id: "term_years",
            label: "Term (years)",
            min: 1,
            max: 10,
            step: nil,
            suffix: "years",
            defaultValue: 3,
            required: true,
            help: nil
        ),
        .toggle(
            id: "survival",
            label: "Confidentiality survives termination?",
            defaultValue: true,
            help: HELP_SURVIVAL
        ),
        .checkboxGroup(
            id: "carve_outs",
            label: "Standard carve-outs",
            options: CARVE_OUT_OPTIONS,
            defaultValue: ["prior", "independent", "public", "legal"],
            required: false,
            help: HELP_CARVE_OUTS
        ),
        .select(
            id: "governing_law",
            label: "Governing law (country)",
            options: JURISDICTION_OPTIONS,
            required: true,
            help: HELP_GOVERNING_LAW,
            optionDescriptions: [:]
        ),
    ]
}
