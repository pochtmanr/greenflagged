import Foundation

enum GFError: Error, Sendable {
    case network(URLError)
    case unauthorized
    case quotaExceeded(paywallURL: String?)
    case uploadFailed(reason: String)
    case aiFailed
    case server(status: Int, code: String?)
    case decode(underlying: String)
}
