import Foundation

enum AppConfigError: Error, CustomStringConvertible {
    case missingKey(String)
    case invalidURL(String, raw: String)

    var description: String {
        switch self {
        case let .missingKey(key):
            return "AppConfig: missing Info.plist key '\(key)' — check Secrets.xcconfig."
        case let .invalidURL(key, raw):
            return "AppConfig: '\(key)' is not a valid URL: '\(raw)'."
        }
    }
}

enum AppConfig {
    nonisolated static let supabaseURL: URL = try! readURL("SUPABASE_URL")
    nonisolated static let supabaseAnonKey: String = try! readString("SUPABASE_ANON_KEY")
    nonisolated static let apiBaseURL: URL = try! readAPIBase()
    nonisolated static let revenueCatAPIKey: String = try! readString("REVENUECAT_IOS_API_KEY")
    nonisolated static let openAIAPIKey: String = try! readString("OPENAI_API_KEY")
    nonisolated static let openAIReviewModel: String = (try? readString("OPENAI_REVIEW_MODEL")) ?? "gpt-4o-mini"

    /// Universal callback URL for OAuth flows. Must match the
    /// `CFBundleURLSchemes` entry in Info.plist and the redirect URL
    /// configured in the Supabase dashboard (Authentication → URL
    /// Configuration → Redirect URLs).
    nonisolated static let authCallbackURL: URL = URL(string: "xyz.flag.green://auth/callback")!

    nonisolated private static func readAPIBase() throws -> URL {
        #if DEBUG
        return try readURL("API_BASE_URL_DEBUG")
        #else
        return try readURL("API_BASE_URL")
        #endif
    }

    nonisolated private static func readString(_ key: String) throws -> String {
        guard let raw = Bundle.main.object(forInfoDictionaryKey: key) as? String,
              !raw.isEmpty,
              !raw.contains("replace_me")
        else { throw AppConfigError.missingKey(key) }
        return raw
    }

    nonisolated private static func readURL(_ key: String) throws -> URL {
        let raw = try readString(key)
        guard let url = URL(string: raw), url.scheme != nil else {
            throw AppConfigError.invalidURL(key, raw: raw)
        }
        return url
    }
}
