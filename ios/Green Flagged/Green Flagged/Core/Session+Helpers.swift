import Auth
import Foundation
import Supabase

/// Read-only conveniences over `Session.authState`. Kept out of `Session.swift`
/// itself so the core auth state machine stays focused on transitions and
/// these derived getters can grow without churning that file.
extension Session {
    /// The current Supabase user, or `nil` while loading or signed out.
    /// Both `.signedIn` and `.needsOnboarding` expose the same user object.
    var user: Supabase.User? {
        switch authState {
        case .signedIn(let user, _), .needsOnboarding(let user):
            return user
        case .loading, .signedOut:
            return nil
        }
    }

    /// Email of the current user, if any. Convenience so view code doesn't
    /// have to `import Auth` just to read this string.
    var email: String? {
        user?.email
    }

    /// The current `profiles` row, or `nil` if onboarding hasn't completed.
    var profile: Profile? {
        if case .signedIn(_, let profile) = authState {
            return profile
        }
        return nil
    }
}
