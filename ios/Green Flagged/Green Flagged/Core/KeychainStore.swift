import Foundation
import Security

// TODO Phase 2 — Keychain-backed token persistence.
// Service: "xyz.flag.green.auth"
// Keys: "refreshToken", optionally "accessToken"
enum KeychainStore {
    static let service = "xyz.flag.green.auth"
}
