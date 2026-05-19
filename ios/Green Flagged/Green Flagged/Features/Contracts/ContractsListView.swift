import SwiftUI

struct ContractsListView: View {
    @Environment(Session.self) private var session
    @State private var vm = ContractsListViewModel()
    @State private var showDraftWizard = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.gf.bg.ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: Spacing.s5) {
                        header
                        filterChips

                        switch vm.state {
                        case .idle:
                            EmptyView()
                        case .loading where vm.contracts.isEmpty:
                            loadingPlaceholder
                        case .error(let message):
                            errorBanner(message)
                        default:
                            EmptyView()
                        }

                        if vm.contracts.isEmpty, case .loaded = vm.state {
                            emptyState
                        } else if !vm.contracts.isEmpty {
                            contractList
                        }
                    }
                    .padding(.horizontal, Spacing.s4)
                    .padding(.vertical, Spacing.s5)
                }
                .refreshable { await vm.refresh() }
                .navigationDestination(for: String.self) { id in
                    ContractDetailView(contractId: id)
                }
            }
            .task { await vm.refreshIfNeeded() }
            .onAppear { Task { await vm.refresh() } }
            .onReceive(NotificationCenter.default.publisher(for: ContractRepository.contractsChanged)) { _ in
                Task { await vm.refresh() }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showDraftWizard = true
                    } label: {
                        Image(systemName: "plus")
                            .foregroundStyle(Color.gf.fg1)
                    }
                    .accessibilityLabel("New draft")
                }
            }
            .sheet(isPresented: $showDraftWizard) {
                DraftWizard()
                    .environment(session)
            }
        }
    }

    // MARK: - Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// CONTRACTS")
                .font(.gf.label)
                .foregroundStyle(Color.gf.fg2)
            Text("Your contracts")
                .font(.gf.h1)
                .foregroundStyle(Color.gf.fg1)
        }
    }

    private var filterChips: some View {
        HStack(spacing: Spacing.s2) {
            ForEach(ContractFilter.allCases) { option in
                GFButton(
                    label: option.label,
                    style: vm.filter == option ? .solid : .ghost,
                    showsArrow: false
                ) {
                    Task { await vm.setFilter(option) }
                }
            }
        }
    }

    private var loadingPlaceholder: some View {
        HStack {
            Spacer()
            VStack(spacing: Spacing.s3) {
                GFTag(label: "LOADING…")
                ProgressView()
                    .progressViewStyle(.circular)
                    .tint(Color.gf.fg2)
            }
            Spacer()
        }
        .padding(.vertical, Spacing.s5)
    }

    private func errorBanner(_ message: String) -> some View {
        HStack {
            Spacer()
            VStack(spacing: Spacing.s3) {
                GFTag(label: message.uppercased(), severity: .red)
                GFButton(label: "RETRY", style: .ghost) {
                    Task { await vm.refresh() }
                }
                .frame(maxWidth: 240)
            }
            Spacer()
        }
        .padding(.top, Spacing.s4)
    }

    private var contractList: some View {
        VStack(spacing: 0) {
            ForEach(Array(vm.contracts.enumerated()), id: \.element.id) { index, contract in
                NavigationLink(value: contract.id) {
                    ContractRow(contract: contract)
                }
                .buttonStyle(.plain)

                if index < vm.contracts.count - 1 {
                    Rectangle()
                        .fill(Color.gf.rule)
                        .frame(height: 1)
                }
            }

            if vm.hasMore {
                Color.clear
                    .frame(height: 1)
                    .onAppear {
                        Task { await vm.loadMore() }
                    }

                if case .loading = vm.state {
                    ProgressView()
                        .progressViewStyle(.circular)
                        .tint(Color.gf.fg2)
                        .padding(.vertical, Spacing.s4)
                }
            }
        }
    }

    private var emptyState: some View {
        HStack {
            Spacer()
            GFFrame {
                VStack(alignment: .leading, spacing: Spacing.s3) {
                    Text("// NO CONTRACTS YET")
                        .font(.gf.label)
                        .foregroundStyle(Color.gf.fg2)
                    Text("Scan your first contract to see it here.")
                        .font(.gf.bodySm)
                        .foregroundStyle(Color.gf.fg3)
                }
            }
            Spacer()
        }
        .padding(.top, Spacing.s5)
    }
}

// MARK: - Row

private struct ContractRow: View {
    let contract: Contract

    var body: some View {
        HStack(spacing: Spacing.s3) {
            if let severity = contract.severity {
                GFTag(label: shortLabel(severity), severity: severity)
            } else {
                GFTag(label: "—")
            }

            VStack(alignment: .leading, spacing: Spacing.s1) {
                Text(contract.displayTitle)
                    .font(.gf.body)
                    .foregroundStyle(Color.gf.fg1)
                    .lineLimit(1)
                Text("\(kindBadge) · \(relativeDate)")
                    .font(.gf.monoSm)
                    .foregroundStyle(Color.gf.fg3)
            }

            Spacer()

            Image(systemName: "chevron.right")
                .foregroundStyle(Color.gf.fg3)
        }
        .padding(.vertical, Spacing.s3)
        .contentShape(Rectangle())
    }

    private func shortLabel(_ severity: Severity) -> String {
        switch severity {
        case .green:  "OK"
        case .yellow: "WARN"
        case .orange: "HIGH"
        case .red:    "CRITICAL"
        }
    }

    private var kindBadge: String {
        switch contract.kind {
        case .scanned: "SCANNED"
        case .drafted: "DRAFTED"
        case .none:    "CONTRACT"
        }
    }

    private var relativeDate: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.dateTimeStyle = .named
        return formatter.localizedString(for: contract.createdAt, relativeTo: Date())
    }
}

// MARK: - Filter

enum ContractFilter: String, CaseIterable, Identifiable, Hashable {
    case all, scanned, drafted

    var id: String { rawValue }
    var label: String { rawValue.uppercased() }

    /// Maps to the `ContractKind` filter passed to `ContractRepository`. `.all`
    /// returns nil — the repo treats nil as "no filter".
    var kind: ContractKind? {
        switch self {
        case .all:     nil
        case .scanned: .scanned
        case .drafted: .drafted
        }
    }
}

// MARK: - View model

@MainActor
@Observable
final class ContractsListViewModel {
    enum State: Sendable, Equatable {
        case idle
        case loading
        case loaded
        case error(String)
    }

    private(set) var state: State = .idle
    private(set) var contracts: [Contract] = []
    private(set) var hasMore: Bool = false
    private(set) var filter: ContractFilter = .all

    private var currentPage: Int = 0
    private let pageSize: Int = ContractRepository.defaultPageSize

    // MARK: - Public

    /// Called from `.task` — only fetches on first appearance.
    func refreshIfNeeded() async {
        if case .idle = state {
            await refresh()
        }
    }

    /// Resets pagination and refetches page 0 with the current filter.
    func refresh() async {
        currentPage = 0
        state = .loading
        do {
            let page = try await ContractRepository.shared.list(
                kind: filter.kind,
                page: 0,
                pageSize: pageSize
            )
            contracts = page
            hasMore = page.count == pageSize
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    /// Pulls the next page and appends. Bails if we already know there's
    /// nothing more, or if a fetch is already in flight.
    func loadMore() async {
        guard hasMore else { return }
        if case .loading = state { return }

        state = .loading
        let nextPage = currentPage + 1
        do {
            let page = try await ContractRepository.shared.list(
                kind: filter.kind,
                page: nextPage,
                pageSize: pageSize
            )
            currentPage = nextPage
            contracts.append(contentsOf: page)
            hasMore = page.count == pageSize
            state = .loaded
        } catch {
            state = .error(error.localizedDescription)
        }
    }

    /// Filter chip tap. Skips work if the filter didn't actually change.
    func setFilter(_ filter: ContractFilter) async {
        guard self.filter != filter else { return }
        self.filter = filter
        await refresh()
    }
}

#Preview {
    ContractsListView()
        .environment(Session())
}
