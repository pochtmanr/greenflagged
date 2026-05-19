import SwiftUI

struct DashboardView: View {
    @Environment(Session.self) private var session
    @State private var vm = DashboardViewModel()
    @State private var showDraftWizard = false

    /// Lifted from `MainTabsView`. Mutating it from inside the empty-state CTA
    /// jumps the user straight to the Scan tab without an extra modal.
    @Binding var selectedTab: AppTab

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            switch vm.state {
            case .loading:
                loadingState
            case .error(let message):
                errorState(message)
            case .loaded(let data):
                loadedState(data)
            }
        }
        .task { await vm.load() }
    }

    // MARK: - States

    private var loadingState: some View {
        VStack(spacing: Spacing.s3) {
            GFTag(label: "LOADING…")
            ProgressView()
                .progressViewStyle(.circular)
                .tint(Color.gf.fg2)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func errorState(_ message: String) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s4) {
            Text("// COULDN'T LOAD DASHBOARD")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)
            GFTag(label: message.uppercased(), severity: .red)
            GFButton(label: "RETRY", style: .ghost) {
                Task { await vm.load() }
            }
            .frame(maxWidth: 240)
        }
        .padding(Spacing.s5)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func loadedState(_ data: DashboardData) -> some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    greeting(data: data)
                    quickActions
                    usageMeter(data: data)
                    recentContracts(data: data)
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
                .frame(maxWidth: .infinity, alignment: .leading)
            }
            .refreshable { await vm.load() }
            .navigationDestination(for: String.self) { id in
                ContractDetailView(contractId: id)
            }
            .onReceive(NotificationCenter.default.publisher(for: ContractRepository.contractsChanged)) { _ in
                Task { await vm.load() }
            }
            .sheet(isPresented: $showDraftWizard) {
                DraftWizard()
                    .environment(session)
            }
        }
    }

    // MARK: - Sections

    private func greeting(data: DashboardData) -> some View {
        let name = data.greetingName(email: session.email).uppercased()
        return VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// HELLO, \(name)")
                .font(.gf.label)
                .tracking(1.5)
                .foregroundStyle(Color.gf.fg2)
            Text(DashboardView.todayLong)
                .font(.gf.monoSm)
                .foregroundStyle(Color.gf.fg3)
            Text("Your dashboard")
                .font(.gf.h1)
                .foregroundStyle(Color.gf.fg1)
                .padding(.top, Spacing.s2)
        }
    }

    private var quickActions: some View {
        VStack(alignment: .leading, spacing: Spacing.s3) {
            ScanActionCard { selectedTab = .scan }
            DraftActionCard { showDraftWizard = true }
        }
    }

    private func usageMeter(data: DashboardData) -> some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                HStack(alignment: .center) {
                    Text("USAGE THIS MONTH")
                        .font(.gf.label)
                        .tracking(1.0)
                        .foregroundStyle(Color.gf.fg2)
                    Spacer()
                    GFTag(label: "FREE TIER")
                    // TODO: derive from subscriptions table once billing schema ships (next session).
                }
                GFSpecRow(key: "SCANS", value: "\(data.scansThisMonth)")
                GFSpecRow(key: "DRAFTS", value: "\(data.draftsThisMonth)")
                GFSpecRow(key: "TOTAL", value: "\(data.totalUsedThisMonth)")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    @ViewBuilder
    private func recentContracts(data: DashboardData) -> some View {
        if data.contracts.isEmpty {
            emptyContractsCard
        } else {
            populatedContracts(data: data)
        }
    }

    private var emptyContractsCard: some View {
        GFFrame(bracketColor: Color.gf.accent) {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("// NO CONTRACTS YET")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.accent)
                Text("Scan your first contract.")
                    .font(.gf.h4)
                    .foregroundStyle(Color.gf.fg1)
                Text("Drop in a PDF or photo. Get the verdict, severity tags, and redlines in under a minute.")
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg2)
                    .fixedSize(horizontal: false, vertical: true)
                GFButton(label: "SCAN", style: .solid) {
                    selectedTab = .scan
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func populatedContracts(data: DashboardData) -> some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                HStack(alignment: .center) {
                    Text("MY CONTRACTS")
                        .font(.gf.label)
                        .tracking(1.0)
                        .foregroundStyle(Color.gf.fg2)
                    Spacer()
                    Button {
                        selectedTab = .contracts
                    } label: {
                        Text("VIEW ALL →")
                            .font(.gf.label)
                            .tracking(1.0)
                            .foregroundStyle(Color.gf.accent)
                    }
                    .buttonStyle(.plain)
                }

                VStack(spacing: 0) {
                    ForEach(Array(data.contracts.enumerated()), id: \.element.id) { index, contract in
                        if index > 0 {
                            Rectangle()
                                .fill(Color.gf.rule)
                                .frame(height: 1)
                        }
                        NavigationLink(value: contract.id) {
                            ContractRowView(contract: contract)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    // MARK: - Helpers

    private static let todayLong: String = {
        let df = DateFormatter()
        df.locale = Locale(identifier: "en_US_POSIX")
        df.dateFormat = "MMMM d, yyyy"
        return df.string(from: Date())
    }()
}

// MARK: - Quick action cards

private struct ScanActionCard: View {
    var onTap: () -> Void

    var body: some View {
        GFFrame(bracketColor: Color.gf.accent) {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                HStack(alignment: .center, spacing: Spacing.s3) {
                    Image(systemName: "doc.viewfinder")
                        .font(.system(size: 28, weight: .regular))
                        .foregroundStyle(Color.gf.accent)
                    Text("// 01 / SCAN")
                        .font(.gf.label)
                        .tracking(1.0)
                        .foregroundStyle(Color.gf.accent)
                    Spacer()
                }
                Text("Scan a contract")
                    .font(.gf.h4)
                    .foregroundStyle(Color.gf.fg1)
                Text("Drop a PDF or DOCX. Get the verdict, severity tags, and redlines in under a minute.")
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg2)
                    .fixedSize(horizontal: false, vertical: true)
                GFButton(label: "OPEN SCANNER", style: .solid, action: onTap)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity)
    }
}

private struct DraftActionCard: View {
    var onTap: () -> Void

    var body: some View {
        GFFrame {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                HStack(alignment: .center, spacing: Spacing.s3) {
                    Image(systemName: "square.and.pencil")
                        .font(.system(size: 28, weight: .regular))
                        .foregroundStyle(Color.gf.fg2)
                    Text("// 02 / DRAFT")
                        .font(.gf.label)
                        .tracking(1.0)
                        .foregroundStyle(Color.gf.fg2)
                    Spacer()
                }
                Text("Create a contract")
                    .font(.gf.h4)
                    .foregroundStyle(Color.gf.fg1)
                Text("Pick a clean template, answer a few questions, get a draft you can negotiate with.")
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg2)
                    .fixedSize(horizontal: false, vertical: true)
                GFButton(label: "START DRAFTING", style: .ghost, action: onTap)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Contract row

private struct ContractRowView: View {
    let contract: Contract

    var body: some View {
        HStack(spacing: Spacing.s3) {
            GFTag(label: contract.severity?.shortLabel ?? "—", severity: contract.severity)
            VStack(alignment: .leading, spacing: 2) {
                Text(contract.displayTitle)
                    .font(.gf.body)
                    .foregroundStyle(Color.gf.fg1)
                    .lineLimit(1)
                Text("\(kindLabel) · \(ContractRowView.relative(contract.createdAt))")
                    .font(.gf.monoSm)
                    .foregroundStyle(Color.gf.fg3)
            }
            Spacer(minLength: Spacing.s2)
            Image(systemName: "chevron.right")
                .font(.gf.monoSm)
                .foregroundStyle(Color.gf.fg3)
        }
        .padding(.vertical, Spacing.s3)
        .contentShape(Rectangle())
    }

    private var kindLabel: String {
        switch contract.kind {
        case .scanned: "SCANNED"
        case .drafted: "DRAFTED"
        case .none:    "CONTRACT"
        }
    }

    private static let relativeFormatter: RelativeDateTimeFormatter = {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .abbreviated
        return f
    }()

    private static func relative(_ date: Date) -> String {
        relativeFormatter.localizedString(for: date, relativeTo: Date())
    }
}

// MARK: - Severity short labels

private extension Severity {
    var shortLabel: String {
        switch self {
        case .green:  "OK"
        case .yellow: "WARN"
        case .orange: "HIGH"
        case .red:    "CRITICAL"
        }
    }
}

#Preview {
    DashboardView(selectedTab: .constant(.home))
        .environment(Session())
}
