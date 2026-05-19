import Foundation
import Supabase

/// Data-access for `usage_events`. Reads are RLS-scoped to the current user.
actor UsageRepository {
    static let shared = UsageRepository()

    private let supabase: SupabaseClient

    init(client: SupabaseClient = SupabaseService.shared) {
        self.supabase = client
    }

    // MARK: - Counts

    /// Returns the number of `scan` and `draft` events since the start of the
    /// current UTC month. Mirrors `dashboard/page.tsx` semantics — month
    /// boundary is computed in UTC so it matches what the web sees.
    func monthlyCounts() async throws -> (scans: Int, drafts: Int) {
        let monthStartIso = Self.iso8601.string(from: Self.startOfCurrentMonthUTC())

        async let scanCount = countEvents(kind: .scan, sinceIso: monthStartIso)
        async let draftCount = countEvents(kind: .draft, sinceIso: monthStartIso)
        return try await (scans: scanCount, drafts: draftCount)
    }

    private func countEvents(kind: UsageKind, sinceIso: String) async throws -> Int {
        let response = try await supabase
            .from("usage_events")
            .select("id", head: true, count: .exact)
            .eq("kind", value: kind.rawValue)
            .gte("created_at", value: sinceIso)
            .execute()
        return response.count ?? 0
    }

    // MARK: - Recent feed

    /// Most recent N usage events, newest first.
    func recent(limit: Int = 5) async throws -> [UsageEvent] {
        precondition(limit > 0, "limit must be positive")
        let rows: [UsageEvent] = try await supabase
            .from("usage_events")
            .select("id,kind,created_at")
            .order("created_at", ascending: false)
            .limit(limit)
            .execute()
            .value
        return rows
    }

    // MARK: - Helpers

    private static func startOfCurrentMonthUTC() -> Date {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "UTC") ?? .gmt
        let components = calendar.dateComponents([.year, .month], from: Date())
        return calendar.date(from: components) ?? Date()
    }

    /// `ISO8601DateFormatter` isn't `Sendable`, but it's safe to share once
    /// configured because Foundation guarantees thread-safety for read-only
    /// formatting.
    nonisolated(unsafe) private static let iso8601: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
}
