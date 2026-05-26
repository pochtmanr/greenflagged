import Foundation
import Supabase

/// Data-access for the `clients` table. RLS scopes every read/write to
/// `auth.uid() = owner_id` (migration 0004).
actor ClientRepository {
    static let shared = ClientRepository()

    private let supabase: SupabaseClient

    init(client: SupabaseClient = SupabaseService.shared) {
        self.supabase = client
    }

    // MARK: - Reads

    func list() async throws -> [Client] {
        try await supabase
            .from("clients")
            .select()
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    // MARK: - Writes

    /// Insert a row owned by the current user. Same `is_default = true`
    /// cleanup as `BusinessProfileRepository.create` — flip other defaults off
    /// so the partial-unique index `clients_one_default_per_user` stays happy.
    @discardableResult
    func create(_ input: ClientInput) async throws -> Client {
        let ownerId = try await currentUserId()

        if input.isDefault == true {
            try await unsetDefaults(ownerId: ownerId)
        }

        var payload = try payload(from: input)
        payload["owner_id"] = .string(ownerId)

        return try await supabase
            .from("clients")
            .insert(payload)
            .select()
            .single()
            .execute()
            .value
    }

    /// Partial update — fields omitted in `ClientInput` are preserved.
    @discardableResult
    func update(id: String, with input: ClientInput) async throws -> Client {
        if input.isDefault == true {
            try await unsetDefaults(ownerId: currentUserId())
        }

        var payload = try payload(from: input)
        payload["updated_at"] = .string(Self.iso8601.string(from: Date()))

        return try await supabase
            .from("clients")
            .update(payload)
            .eq("id", value: id)
            .select()
            .single()
            .execute()
            .value
    }

    func delete(id: String) async throws {
        try await supabase
            .from("clients")
            .delete()
            .eq("id", value: id)
            .execute()
    }

    // MARK: - Helpers

    private func currentUserId() async throws -> String {
        let user = try await supabase.auth.session.user
        return user.id.uuidString.lowercased()
    }

    private func unsetDefaults(ownerId: String) async throws {
        try await supabase
            .from("clients")
            .update(["is_default": false])
            .eq("owner_id", value: ownerId)
            .execute()
    }

    private nonisolated func payload(from input: ClientInput) throws -> [String: AnyJSON] {
        let data = try JSONEncoder().encode(input)
        return try JSONDecoder().decode([String: AnyJSON].self, from: data)
    }

    nonisolated(unsafe) private static let iso8601: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
}
