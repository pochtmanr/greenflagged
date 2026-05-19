import Foundation

// Mirrors landing/lib/contracts/industries/design.ts (designQuestions).
// If you change one, change the other. Diverging means the iOS form
// submits answers the server rejects.

enum DesignQuestions {
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

    private static let IP_TRANSFER_OPT_DESC: [String: String] = [
        "on_full_payment":
            "Recommended design norm. Rights transfer to the Client once you've been paid in full.",
        "on_signature":
            "Risky for you — rights transfer the moment the contract is signed, before payment.",
        "retained_until_paid":
            "You keep rights; Client gets a licence to use the work once paid in full.",
    ]

    private static let HELP_GOVERNING_LAW =
        "The legal system that interprets this contract. Pick where you (the Designer) are based — easier and cheaper to enforce locally."

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
            label: "You (Designer)",
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
            placeholder: "Brand identity, web design, illustration, etc.",
            minRows: 6,
            required: true,
            help: "Describe what you'll do. The Improve button polishes it into professional contract language."
        ),
        .improveTextarea(
            id: "deliverables",
            label: "Deliverables",
            fieldKind: "deliverables",
            placeholder: "Logo files, brand guidelines, source files, etc.",
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
            id: "revision_rounds",
            label: "Number of revision rounds",
            min: 0,
            max: nil,
            step: nil,
            suffix: nil,
            defaultValue: 3,
            required: false,
            help: nil
        ),
        .number(
            id: "kill_fee_pct",
            label: "Kill fee (% of total)",
            min: 0,
            max: 100,
            step: nil,
            suffix: "%",
            defaultValue: 50,
            required: false,
            help: "If the Client cancels mid-project, you keep this percentage of unbilled work. Industry standard: 25–50%."
        ),
        .select(
            id: "ip_transfer",
            label: "IP transfer",
            options: [
                SelectOption(value: "on_full_payment",     label: "On full payment"),
                SelectOption(value: "on_signature",        label: "On signature"),
                SelectOption(value: "retained_until_paid", label: "Retained until paid"),
            ],
            required: true,
            help: "Who owns the work product once payment is made.",
            optionDescriptions: IP_TRANSFER_OPT_DESC
        ),
        .toggle(
            id: "portfolio_use",
            label: "Designer may show work in portfolio?",
            defaultValue: true,
            help: nil
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
