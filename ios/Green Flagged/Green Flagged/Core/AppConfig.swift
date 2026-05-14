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
