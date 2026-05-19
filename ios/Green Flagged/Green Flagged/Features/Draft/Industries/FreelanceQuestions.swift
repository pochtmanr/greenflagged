import Foundation

// Mirrors landing/lib/contracts/industries/freelance.ts (freelanceQuestions).
// If you change one, change the other. Diverging means the iOS form
// submits answers the server rejects.

enum FreelanceQuestions {
    private static let RATE_TYPE_OPT_DESC: [String: String] = [
        "hourly":
            "You bill for hours worked. Best for ongoing maintenance or unscoped work.",
        "fixed":
            "One total price for a defined deliverable. Best when scope is clear.",
        "retainer":
            "A recurring monthly amount for ongoing availability or work. Best for long engagements.",
    ]

    private static let PAYMENT_SCHEDULE_OPT_DESC: [String: String] = [
        "on_completion": "Invoice is due when the work is delivered.",
        "milestones":    "Invoices follow named milestones in the scope.",
        "net_15":        "Invoices are due 15 days after issue.",
        "net_30":        "Invoices are due 30 days after issue.",
    ]

    private static let IP_OPT_DESC: [String: String] = [
        "client_on_payment":
            "All rights transfer to the Client once you've been paid in full.",
        "provider_retains":
            "You keep the rights and grant the Client a license to use the work.",
        "shared":
            "Ownership is split between named parties by the percentages you set below.",
    ]

    private static let HELP_RATE_TYPE =
        "How you charge for this engagement. Pick one — the contract phrasing follows."
    private static let HELP_PAYMENT_SCHEDULE =
        "When invoices are due. Shorter schedules favor you (the Provider)."
    private static let HELP_IP =
        "Who owns the work product. The freelance norm is 'Client owns on full payment' — you keep rights until the invoice clears."
    private static let HELP_TERMINATION =
        "How many days' written notice either party must give to end the contract. 14–30 days is typical."
    private static let HELP_GOVERNING_LAW =
        "The legal system that interprets this contract. Pick where you (the Provider) are based — easier and cheaper to enforce locally."

    static let questions: [Question] = [
        .nameGroup(
            id: "client",
            label: "Client",
            showBusiness: true,
            required: true,
            help: "The person or company you're working for. Add the business name if you're contracting with a company."
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
            placeholder: "What you'll deliver, in plain language",
            minRows: 6,
            required: true,
            help: "Describe what you'll do. The Improve button polishes it into professional contract language."
        ),
        .improveTextarea(
            id: "deliverables",
            label: "Deliverables",
            fieldKind: "deliverables",
            placeholder: "Specific outputs the Client will receive",
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
            help: HELP_RATE_TYPE,
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
            help: HELP_PAYMENT_SCHEDULE,
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
        .select(
            id: "ip_ownership",
            label: "IP ownership",
            options: [
                SelectOption(value: "client_on_payment", label: "Client owns on full payment"),
                SelectOption(value: "provider_retains",  label: "Provider retains; Client licenses"),
                SelectOption(value: "shared",            label: "Shared"),
            ],
            required: true,
            help: HELP_IP,
            optionDescriptions: IP_OPT_DESC
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
            help: HELP_TERMINATION
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
