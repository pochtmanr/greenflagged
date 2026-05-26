import Foundation
import Supabase

/// Data-access for the `profiles` table.
///
/// All calls go through PostgREST; RLS in Supabase enforces the `auth.uid()`
/// boundary so we never have to (and never should) pass `user_id` filters
/// manually for "read my own row" cases. We still pass it for `select()` to
/// keep intent explicit at the call site.
actor ProfileRepository {
    static let shared = ProfileRepository()

    private let supabase: SupabaseClient

    init(client: SupabaseClient = SupabaseService.shared) {
        self.supabase = client
    }

    // MARK: - Reads

    /// Returns the current user's profile row, or `nil` if it doesn't exist
    /// yet (first-time sign-in before the row is created by the auth trigger).
    func fetchCurrent() async throws -> Profile? {
        let user = try await supabase.auth.session.user
        let rows: [Profile] = try await supabase
            .from("profiles")
            .select()
            .eq("user_id", value: user.id.uuidString.lowercased())
            .limit(1)
            .execute()
            .value
        return rows.first
    }

    // MARK: - Writes

    /// Upserts the current user's profile and optionally marks them as
    /// onboarded. Mirrors `landing/app/(app)/onboarding/actions.ts` exactly —
    /// column names are wire-format.
    ///
    /// `markOnboarded`: when true, stamps `onboarded_at` with the current UTC
    /// instant. When false, the existing value is preserved (the upsert
    /// payload simply omits the column).
    @discardableResult
    func upsert(
        accountType: AccountType,
        country: String,
        businessName: String?,
        industries: [String]? = nil,
        markOnboarded: Bool
    ) async throws -> Profile {
        let user = try await supabase.auth.session.user
        let userId = user.id.uuidString.lowercased()

        let trimmedName = businessName?.trimmingCharacters(in: .whitespacesAndNewlines)
        let resolvedBusinessName: String? = {
            guard accountType == .business else { return nil }
            guard let trimmed = trimmedName, !trimmed.isEmpty else { return nil }
            return trimmed
        }()

        var payload: [String: AnyJSON] = [
            "user_id":       .string(userId),
            "account_type":  .string(accountType.rawValue),
            "country_code":  .string(country.uppercased()),
            "business_name": resolvedBusinessName.map { .string($0) } ?? .null,
            "updated_at":    .string(Self.iso8601.string(from: Date())),
        ]

        // Only include the column when the caller passed a value — `nil`
        // preserves whatever the row already has (settings edits don't
        // touch industries today).
        if let industries {
            payload["industries"] = .array(industries.map { .string($0) })
        }

        if markOnboarded {
            payload["onboarded_at"] = .string(Self.iso8601.string(from: Date()))
        }

        let row: Profile = try await supabase
            .from("profiles")
            .upsert(payload, onConflict: "user_id")
            .select()
            .single()
            .execute()
            .value

        return row
    }

    // MARK: - Helpers

    /// `ISO8601DateFormatter` isn't `Sendable`, but it's safe to share once
    /// configured because Foundation guarantees thread-safety for read-only
    /// formatting. `nonisolated(unsafe)` opts out of the Sendable check we
    /// don't need.
    nonisolated(unsafe) private static let iso8601: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
}
