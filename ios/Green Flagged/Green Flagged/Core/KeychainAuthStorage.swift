import Foundation
import Supabase

/// `AuthLocalStorage` implementation backed by ``KeychainStore``.
///
/// supabase-swift uses this to persist the encrypted session blob between
/// app launches. Service `xyz.flag.green.auth`, account `supabase.session`
/// (the SDK passes its own `key` argument; we forward it to Keychain so a
/// single store can hold multiple SDK-managed entries if needed in the future).
nonisolated struct KeychainAuthStorage: AuthLocalStorage {
    static let service = "xyz.flag.green.auth"
    static let defaultAccount = "supabase.session"

    private let store: KeychainStore

    init(service: String = KeychainAuthStorage.service) {
        self.store = KeychainStore(service: service)
    }

    func store(key: String, value: Data) throws {
        try store.set(value, account: key)
    }

    func retrieve(key: String) throws -> Data? {
        try store.get(key)
    }

    func remove(key: String) throws {
        try store.remove(key)
    }
}
