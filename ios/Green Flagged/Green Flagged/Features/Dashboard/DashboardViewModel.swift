import Foundation
import Observation

/// State machine for the dashboard tab.
///
/// All Supabase calls fan out concurrently via `async let` so first-load
/// latency is the slowest single query, not the sum.
@MainActor
@Observable
final class DashboardViewModel {
    enum State: Sendable {
        case loading
        case loaded(DashboardData)
        case error(String)
    }

    private(set) var state: State = .loading

    func load() async {
        // Don't wipe the previous payload when refreshing — the UI keeps
        // showing the old data while the new fetch is in flight, which feels
        // much smoother than a flash to a spinner. Only show the spinner on
        // the very first load.
        if case .loaded = state { /* keep existing */ } else { state = .loading }

        do {
            async let profile   = ProfileRepository.shared.fetchCurrent()
            async let contracts = ContractRepository.shared.list(kind: nil, page: 0, pageSize: 10)
            async let counts    = UsageRepository.shared.monthlyCounts()
            async let usage     = UsageRepository.shared.recent(limit: 5)

            let (loadedProfile, loadedContracts, loadedCounts, loadedUsage) =
                try await (profile, contracts, counts, usage)

            state = .loaded(
                DashboardData(
                    profile: loadedProfile,
                    contracts: loadedContracts,
                    scansThisMonth: loadedCounts.scans,
                    draftsThisMonth: loadedCounts.drafts,
                    recentUsage: loadedUsage
                )
            )
        } catch {
            state = .error(error.localizedDescription)
        }
    }
}
