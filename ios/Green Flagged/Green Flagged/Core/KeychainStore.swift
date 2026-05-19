import Foundation
import Security

/// Thin wrapper around the iOS Keychain Services C API.
///
/// Stores small `Data` blobs keyed by `(service, account)`. Designed to be
/// reused by both ``KeychainAuthStorage`` (for supabase-swift session
/// persistence) and future call-sites that need to persist secrets.
///
/// All items are written with `kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`
/// so they survive locks but never sync to iCloud and never leave the device.
nonisolated struct KeychainStore: Sendable {
    enum Failure: Error, CustomStringConvertible, Sendable {
        case osStatus(OSStatus, op: String)

        var description: String {
            switch self {
            case let .osStatus(status, op):
                let msg = SecCopyErrorMessageString(status, nil) as String? ?? "unknown"
                return "Keychain \(op) failed (\(status)): \(msg)"
            }
        }
    }

    let service: String

    init(service: String) {
        self.service = service
    }

    func get(_ account: String) throws -> Data? {
        var query = baseQuery(account: account)
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        query[kSecReturnData as String] = kCFBooleanTrue!

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        switch status {
        case errSecSuccess:
            return item as? Data
        case errSecItemNotFound:
            return nil
        default:
            throw Failure.osStatus(status, op: "get(\(account))")
        }
    }

    func set(_ data: Data, account: String) throws {
        let baseQuery = baseQuery(account: account)
        let attrs: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]

        // Try update first (most common path after first write).
        let updateStatus = SecItemUpdate(baseQuery as CFDictionary, attrs as CFDictionary)
        switch updateStatus {
        case errSecSuccess:
            return
        case errSecItemNotFound:
            var addQuery = baseQuery
            for (k, v) in attrs { addQuery[k] = v }
            let addStatus = SecItemAdd(addQuery as CFDictionary, nil)
            guard addStatus == errSecSuccess else {
                throw Failure.osStatus(addStatus, op: "set(\(account))")
            }
        default:
            throw Failure.osStatus(updateStatus, op: "set(\(account))")
        }
    }

    func remove(_ account: String) throws {
        let query = baseQuery(account: account)
        let status = SecItemDelete(query as CFDictionary)
        switch status {
        case errSecSuccess, errSecItemNotFound:
            return
        default:
            throw Failure.osStatus(status, op: "remove(\(account))")
        }
    }

    private func baseQuery(account: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecAttrSynchronizable as String: kCFBooleanFalse!
        ]
    }
}
