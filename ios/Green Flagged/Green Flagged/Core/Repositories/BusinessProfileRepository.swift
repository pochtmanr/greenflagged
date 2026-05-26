import Foundation
import Supabase

/// Data-access for the `business_profiles` table + its logo objects in the
/// `contracts` storage bucket. RLS scopes every read/write to
/// `auth.uid() = owner_id` (migrations 0004 + 0005), so the iOS client never
/// passes `owner_id` filters except where the landing route did
/// (`is_default = false` cleanup before flipping a new default).
actor BusinessProfileRepository {
    static let shared = BusinessProfileRepository()

    private let supabase: SupabaseClient

    init(client: SupabaseClient = SupabaseService.shared) {
        self.supabase = client
    }

    // MARK: - Reads

    /// Newest-first listing for the current user.
    func list() async throws -> [BusinessProfile] {
        try await supabase
            .from("business_profiles")
            .select()
            .order("created_at", ascending: false)
            .execute()
            .value
    }

    // MARK: - Writes

    /// Inserts a new row owned by the current user. Mirrors the landing POST
    /// route's `is_default = true` cleanup: flip the user's other defaults off
    /// first so the partial-unique index `business_profiles_one_default_per_user`
    /// stays happy. A concurrent flip from another device would surface as a
    /// 23505 — same race as the web has today.
    @discardableResult
    func create(_ input: BusinessProfileInput) async throws -> BusinessProfile {
        let ownerId = try await currentUserId()

        if input.isDefault == true {
            try await unsetDefaults(ownerId: ownerId)
        }

        var payload = try payload(from: input)
        payload["owner_id"] = .string(ownerId)

        return try await supabase
            .from("business_profiles")
            .insert(payload)
            .select()
            .single()
            .execute()
            .value
    }

    /// Partial update — fields omitted in `BusinessProfileInput` (via
    /// `encodeIfPresent`) are preserved on the row.
    @discardableResult
    func update(id: String, with input: BusinessProfileInput) async throws -> BusinessProfile {
        if input.isDefault == true {
            try await unsetDefaults(ownerId: currentUserId())
        }

        var payload = try payload(from: input)
        payload["updated_at"] = .string(Self.iso8601.string(from: Date()))

        return try await supabase
            .from("business_profiles")
            .update(payload)
            .eq("id", value: id)
            .select()
            .single()
            .execute()
            .value
    }

    /// Deletes the profile. Contracts referencing it get `business_profile_id`
    /// nulled via the migration's `on delete set null`.
    func delete(id: String) async throws {
        try await supabase
            .from("business_profiles")
            .delete()
            .eq("id", value: id)
            .execute()
    }

    // MARK: - Logo upload

    /// Uploads to `business_profiles/<auth.uid>/<profileId>/logo.<ext>` and
    /// stamps the resulting path onto `logo_path`. The storage policy in
    /// migration 0005 requires exactly this path shape; deviating yields a
    /// 403. Callers must keep `mimeType` to `image/png` or `image/jpeg`.
    @discardableResult
    func uploadLogo(
        profileId: String,
        imageData: Data,
        mimeType: String
    ) async throws -> String {
        let ownerId = try await currentUserId()
        let ext = mimeType == "image/png" ? "png" : "jpg"
        let path = "business_profiles/\(ownerId)/\(profileId)/logo.\(ext)"

        _ = try await supabase.storage
            .from("contracts")
            .upload(
                path,
                data: imageData,
                options: FileOptions(contentType: mimeType, upsert: true)
            )

        try await supabase
            .from("business_profiles")
            .update(["logo_path": path])
            .eq("id", value: profileId)
            .execute()

        return path
    }

    // MARK: - Helpers

    private func currentUserId() async throws -> String {
        let user = try await supabase.auth.session.user
        return user.id.uuidString.lowercased()
    }

    private func unsetDefaults(ownerId: String) async throws {
        try await supabase
            .from("business_profiles")
            .update(["is_default": false])
            .eq("owner_id", value: ownerId)
            .execute()
    }

    /// Translate the call-site `Encodable` shape into PostgREST's
    /// `[String: AnyJSON]` payload. `encodeIfPresent` already drops nils, so
    /// the round-trip yields exactly the keys the caller wanted to send.
    private nonisolated func payload(from input: BusinessProfileInput) throws -> [String: AnyJSON] {
        let data = try JSONEncoder().encode(input)
        return try JSONDecoder().decode([String: AnyJSON].self, from: data)
    }

    nonisolated(unsafe) private static let iso8601: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
}
