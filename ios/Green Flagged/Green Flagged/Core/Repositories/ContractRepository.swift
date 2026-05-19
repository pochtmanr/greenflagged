import Foundation
import Supabase

/// Data-access for the `contracts` table. RLS scopes every read to the
/// current user, so callers don't need to (and shouldn't) pass `owner_id`.
actor ContractRepository {
    static let shared = ContractRepository()

    private let supabase: SupabaseClient

    init(client: SupabaseClient = SupabaseService.shared) {
        self.supabase = client
    }

    /// Page size used for the contracts list. Kept conservative for now to
    /// minimize PostgREST roundtrip cost; bump later if profiling says so.
    static let defaultPageSize = 20

    /// Returns one page of contracts ordered by `created_at` descending.
    /// `kind == nil` returns both `scanned` and `drafted`.
    func list(
        kind: ContractKind? = nil,
        page: Int,
        pageSize: Int = defaultPageSize
    ) async throws -> [Contract] {
        precondition(page >= 0, "page must be non-negative")
        precondition(pageSize > 0, "pageSize must be positive")

        let from = page * pageSize
        let to = from + pageSize - 1

        var query = supabase
            .from("contracts")
            .select("id,owner_id,kind,industry,title,storage_path,verdict_severity,created_at,retention_until")

        if let kind {
            query = query.eq("kind", value: kind.rawValue)
        }

        let rows: [Contract] = try await query
            .order("created_at", ascending: false)
            .range(from: from, to: to)
            .execute()
            .value

        return rows
    }
}

// MARK: - Detail reads

extension ContractRepository {
    /// Reads a single `contracts` row by id. Returns `nil` if RLS hid it or the
    /// row genuinely doesn't exist. Never throws on empty result — callers
    /// branch on `nil` to show a "not found" state.
    func get(id: String) async throws -> Contract? {
        let rows: [Contract] = try await supabase
            .from("contracts")
            .select("id,owner_id,kind,industry,title,storage_path,verdict_severity,created_at,retention_until")
            .eq("id", value: id)
            .limit(1)
            .execute()
            .value
        return rows.first
    }

    /// Reads the latest `scans` row for a contract. Returns `nil` if the
    /// contract is `drafted` (no scan), or if no scan has run yet. We decode
    /// into `[ScanResult]` and take `.first` — `maybeSingle()` is unreliable
    /// across supabase-swift versions.
    func scanResult(contractId: String) async throws -> ScanResult? {
        let rows: [ScanResult] = try await supabase
            .from("scans")
            .select("contract_id,verdict_md,taxonomy,redlines,source_text")
            .eq("contract_id", value: contractId)
            .order("created_at", ascending: false)
            .limit(1)
            .execute()
            .value
        return rows.first
    }

    /// Reads the highest-version `body_md` for a drafted contract.
    /// Returns `nil` if no version row exists yet.
    func latestVersionBody(contractId: String) async throws -> String? {
        let rows: [ContractVersionRow] = try await supabase
            .from("contract_versions")
            .select("body_md")
            .eq("contract_id", value: contractId)
            .order("version", ascending: false)
            .limit(1)
            .execute()
            .value
        return rows.first?.bodyMd
    }
}

// MARK: - Refresh signal

extension ContractRepository {
    /// Posted after a successful delete so the dashboard and contracts list
    /// can drop the row without a manual pull-to-refresh.
    nonisolated static let contractsChanged = Notification.Name("gf.contracts.changed")
}

/// Decodable row used by `latestVersionBody`. Private to this file.
private struct ContractVersionRow: Decodable, Sendable {
    let bodyMd: String?

    enum CodingKeys: String, CodingKey {
        case bodyMd = "body_md"
    }
}
