import Foundation

// Mirrors landing/lib/contracts/industries/software.ts (softwareQuestions).
// If you change one, change the other. Diverging means the iOS form
// submits answers the server rejects.

enum SoftwareQuestions {
    private static let RATE_TYPE_OPT_DESC: [String: String] = [
        "hourly":   "You bill for hours worked. Best for ongoing maintenance or unscoped work.",
        "fixed":    "One total price for a defined deliverable. Best when scope is clear.",
        "retainer": "A recurring monthly amount. Best for long engagements.",
    ]

    private static let PAYMENT_SCHEDULE_OPT_DESC: [String: String] = [
        "on_completion": "Invoice is due when the work is delivered.",
        "milestones":    "Invoices follow named milestones in the scope.",
        "net_15":        "Invoices are due 15 days after issue.",
        "net_30":        "Invoices are due 30 days after issue.",
    ]

    private static let INDEMNITY_OPT_DESC: [String: String] = [
        "1x":
            "Recommended freelancer-friendly cap. Limits exposure to 1× the fees the Client paid you in the last 12 months.",
        "2x":
            "Middle ground. Higher exposure but a more comfortable position for the Client.",
        "uncapped":
            "Uncapped exposure. Never accept without a lawyer review — a single claim can exceed everything you've earned.",
    ]

    private static let HELP_GOVERNING_LAW =
        "The legal system that interprets this contract. Pick where you (the Provider) are based — easier and cheaper to enforce locally."

    static let questions: [Question] = [
        .nameGroup(
            id: "client",
            label: "Client",
            showBusiness: true,
            required: true,
            help: nil
        ),
        .address(
            id: "client_address",
            label: "Client address",
            required: true,
            help: nil
        ),
        .nameGroup(
            id: "provider",
            label: "You (Provider)",
            showBusiness: true,
            required: true,
            help: nil
        ),
        .address(
            id: "provider_address",
            label: "Your address",
            required: true,
            help: nil
        ),
        .improveTextarea(
            id: "scope",
            label: "Scope of work",
            fieldKind: "scope",
            placeholder: "What software you will design, build, or maintain",
            minRows: 6,
            required: true,
            help: "Describe what you'll do. The Improve button polishes it into professional contract language."
        ),
        .improveTextarea(
            id: "deliverables",
            label: "Deliverables",
            fieldKind: "deliverables",
            placeholder: "Source code, docs, environments, etc.",
            minRows: 4,
            required: false,
            help: "What concrete outputs the client receives. Improve will format it as a numbered list."
        ),
        .select(
            id: "rate_type",
            label: "Rate type",
            options: [
                SelectOption(value: "hourly",   label: "Hourly"),
                SelectOption(value: "fixed",    label: "Fixed project fee"),
                SelectOption(value: "retainer", label: "Monthly retainer"),
            ],
            required: true,
            help: "How you charge for this engagement. Pick one — the contract phrasing follows.",
            optionDescriptions: RATE_TYPE_OPT_DESC
        ),
        .number(
            id: "rate_amount",
            label: "Rate amount",
            min: 0,
            max: nil,
            step: nil,
            suffix: "€",
            defaultValue: nil,
            required: true,
            help: nil
        ),
        .select(
            id: "payment_schedule",
            label: "Payment schedule",
            options: [
                SelectOption(value: "on_completion", label: "On completion"),
                SelectOption(value: "milestones",    label: "Milestones"),
                SelectOption(value: "net_15",        label: "Net 15"),
                SelectOption(value: "net_30",        label: "Net 30"),
            ],
            required: true,
            help: "When invoices are due. Shorter schedules favor you.",
            optionDescriptions: PAYMENT_SCHEDULE_OPT_DESC
        ),
        .date(
            id: "start_date",
            label: "Start date",
            allowOpenEnded: false,
            openLabel: nil,
            required: false,
            help: nil
        ),
        .date(
            id: "end_date",
            label: "Estimated end date",
            allowOpenEnded: true,
            openLabel: "No estimated end date",
            required: false,
            help: nil
        ),
        .number(
            id: "warranty_days",
            label: "Warranty period (days)",
            min: 0,
            max: nil,
            step: nil,
            suffix: "days",
            defaultValue: 30,
            required: false,
            help: "Days after delivery during which you fix bugs at no charge. Standard: 30."
        ),
        .toggle(
            id: "ip_assignment",
            label: "Full IP assignment on payment? (off = perpetual licence)",
            defaultValue: true,
            help: "On: rights transfer to the Client on payment. Off: you keep ownership and the Client gets a perpetual licence."
        ),
        .toggle(
            id: "oss_ack",
            label: "Acknowledge use of open-source components?",
            defaultValue: true,
            help: nil
        ),
        .select(
            id: "indemnity_cap",
            label: "Indemnity cap",
            options: [
                SelectOption(value: "1x",       label: "1× fees paid"),
                SelectOption(value: "2x",       label: "2× fees paid"),
                SelectOption(value: "uncapped", label: "Uncapped"),
            ],
            required: true,
            help: "Maximum amount you'd pay if a third party sues over your code. 1× fees is the safest cap.",
            optionDescriptions: INDEMNITY_OPT_DESC
        ),
        .number(
            id: "termination_notice",
            label: "Termination notice (days)",
            min: 0,
            max: nil,
            step: nil,
            suffix: "days",
            defaultValue: 14,
            required: false,
            help: "Days of written notice either party must give to end the contract. 14–30 is typical."
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
