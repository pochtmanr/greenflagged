import Foundation

// TODO Phase 2 — wrap supabase-swift SDK once SPM dep is added.
// The client must read AppConfig.supabaseURL and AppConfig.supabaseAnonKey
// and expose auth, postgrest, storage as a single shared singleton.
//
// Sketch:
//   import Supabase
//   let supabase = SupabaseClient(
//       supabaseURL: AppConfig.supabaseURL,
//       supabaseKey: AppConfig.supabaseAnonKey
//   )

enum SupabaseBootstrap {
    static func placeholder() {
        // Keeps the file compiling pre-SPM-dep. Replace in Phase 2.
    }
}
