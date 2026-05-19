import Foundation
import Supabase

/// Shared, lazily-initialized ``SupabaseClient`` for the whole app.
///
/// Config comes from ``AppConfig`` (which reads `SUPABASE_URL` and
/// `SUPABASE_ANON_KEY` from Info.plist → Secrets.xcconfig). The client uses
/// ``KeychainAuthStorage`` so refresh tokens survive app relaunches without
/// ending up in UserDefaults / on disk in plaintext.
///
/// Fail-loud rule (`AGENTS.md`): if config is missing, `AppConfig` already
/// crashes at first access — we don't paper over it with a fallback default.
enum SupabaseService {
    /// Single, process-wide client. supabase-swift's `SupabaseClient` is
    /// `Sendable` so this is safe to share across actors.
    nonisolated static let shared: SupabaseClient = {
        SupabaseClient(
            supabaseURL: AppConfig.supabaseURL,
            supabaseKey: AppConfig.supabaseAnonKey,
            options: SupabaseClientOptions(
                auth: SupabaseClientOptions.AuthOptions(
                    storage: KeychainAuthStorage(),
                    redirectToURL: AppConfig.authCallbackURL,
                    flowType: .pkce,
                    autoRefreshToken: true
                )
            )
        )
    }()
}
