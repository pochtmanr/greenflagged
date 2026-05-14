import OSLog

enum Log {
    static let auth    = Logger(subsystem: "xyz.flag.green", category: "auth")
    static let api     = Logger(subsystem: "xyz.flag.green", category: "api")
    static let billing = Logger(subsystem: "xyz.flag.green", category: "billing")
    static let scan    = Logger(subsystem: "xyz.flag.green", category: "scan")
    static let app     = Logger(subsystem: "xyz.flag.green", category: "app")
}
