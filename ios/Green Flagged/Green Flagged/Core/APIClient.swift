import Foundation
import UniformTypeIdentifiers

nonisolated enum APIError: Error, CustomStringConvertible {
    case unauthenticated
    case quotaExceeded(message: String)
    case aiFailed(message: String)
    case server(status: Int, message: String)
    case transport(Error)
    case decoding(Error)
    case invalidInput(String)

    var description: String {
        switch self {
        case .unauthenticated:
            return "SESSION EXPIRED — SIGN IN AGAIN"
        case .quotaExceeded(let message):
            return "OUT OF SCANS · \(message.uppercased())"
        case .aiFailed(let message):
            return "AI REVIEW FAILED · \(message.uppercased())"
        case .server(let status, let message):
            return "SERVER \(status) · \(message.uppercased())"
        case .transport(let error):
            return "NETWORK · \(error.localizedDescription.uppercased())"
        case .decoding:
            return "RESPONSE CORRUPTED — TRY AGAIN"
        case .invalidInput(let message):
            return message.uppercased()
        }
    }
}

nonisolated struct ScanResponse: Decodable, Sendable {
    let contract_id: String
    let severity: String   // "green" | "yellow" | "orange" | "red"
}

nonisolated struct DraftResponse: Decodable, Sendable {
    let contract_id: String
    let title: String
}

actor APIClient {
    static let shared = APIClient()

    private let baseURL: URL
    private let session: URLSession

    private init(baseURL: URL = AppConfig.apiBaseURL,
                 session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    /// POST /api/scan — multipart when `fileURL` is provided, JSON when `text` is.
    /// The caller passes the current Supabase access token at the moment of the
    /// call so token refreshes (handled by supabase-swift on its own clock) are
    /// always reflected. The client itself holds no session state.
    func scan(fileURL: URL?, text: String?, token: String) async throws -> ScanResponse {
        guard let url = URL(string: "api/scan", relativeTo: baseURL) else {
            throw APIError.invalidInput("invalid api base url")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 120
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        if let fileURL {
            let boundary = "gf-\(UUID().uuidString)"
            request.setValue(
                "multipart/form-data; boundary=\(boundary)",
                forHTTPHeaderField: "Content-Type"
            )
            request.httpBody = try Self.multipartBody(fileURL: fileURL, boundary: boundary)
        } else if let text {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONEncoder().encode(["text": text])
        } else {
            throw APIError.invalidInput("provide a file or pasted text")
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.transport(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.server(status: 0, message: "no http response")
        }

        switch http.statusCode {
        case 200, 201:
            do {
                return try JSONDecoder().decode(ScanResponse.self, from: data)
            } catch {
                throw APIError.decoding(error)
            }

        case 401:
            throw APIError.unauthenticated

        case 402:
            let message = Self.errorMessage(from: data) ?? "Free tier exhausted"
            throw APIError.quotaExceeded(message: message)

        case 413:
            throw APIError.server(status: 413, message: "File too large — 10MB max")

        case 502:
            if Self.errorCode(from: data) == "ai_review_failed" {
                let message = Self.errorMessage(from: data) ?? "AI review failed"
                throw APIError.aiFailed(message: message)
            }
            throw APIError.server(
                status: 502,
                message: Self.errorMessage(from: data) ?? Self.fallbackMessage(data: data)
            )

        default:
            throw APIError.server(
                status: http.statusCode,
                message: Self.errorMessage(from: data) ?? Self.fallbackMessage(data: data)
            )
        }
    }

    // MARK: - Multipart

    private static func multipartBody(fileURL: URL, boundary: String) throws -> Data {
        let didStart = fileURL.startAccessingSecurityScopedResource()
        defer { if didStart { fileURL.stopAccessingSecurityScopedResource() } }

        let fileData: Data
        do {
            fileData = try Data(contentsOf: fileURL)
        } catch {
            throw APIError.transport(error)
        }

        let filename = fileURL.lastPathComponent
        let mime = UTType(filenameExtension: fileURL.pathExtension)?.preferredMIMEType
            ?? "application/octet-stream"

        let head = (
            "--\(boundary)\r\n" +
            "Content-Disposition: form-data; name=\"file\"; filename=\"\(filename)\"\r\n" +
            "Content-Type: \(mime)\r\n\r\n"
        ).data(using: .utf8) ?? Data()
        let tail = "\r\n--\(boundary)--\r\n".data(using: .utf8) ?? Data()

        var body = Data()
        body.append(head)
        body.append(fileData)
        body.append(tail)
        return body
    }

    // MARK: - Error parsing

    private static func errorMessage(from data: Data) -> String? {
        guard
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let message = json["error"] as? String,
            !message.isEmpty
        else { return nil }
        return message
    }

    private static func errorCode(from data: Data) -> String? {
        guard
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let code = json["code"] as? String
        else { return nil }
        return code
    }

    private static func fallbackMessage(data: Data) -> String {
        let raw = String(data: data, encoding: .utf8)?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return raw.isEmpty ? "unknown error" : raw
    }
}

// MARK: - Draft

extension APIClient {
    /// POST /api/contracts/draft — submits the wizard answers and asks the
    /// server to render + persist a contract draft. Returns the new
    /// contract id and its server-built title.
    ///
    /// `bodyJSON` is the pre-serialized request body. The caller builds it
    /// on its own actor (typically `MainActor`) so we never have to send a
    /// non-Sendable `[String: Any]` across the actor boundary.
    func draftContract(
        bodyJSON: Data,
        token: String
    ) async throws -> DraftResponse {
        guard let url = URL(string: "api/contracts/draft", relativeTo: baseURL) else {
            throw APIError.invalidInput("invalid api base url")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 120
        request.setValue("Bearer \(token)",   forHTTPHeaderField: "Authorization")
        request.setValue("application/json",  forHTTPHeaderField: "Accept")
        request.setValue("application/json",  forHTTPHeaderField: "Content-Type")
        request.httpBody = bodyJSON

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.transport(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.server(status: 0, message: "no http response")
        }

        switch http.statusCode {
        case 200, 201:
            do {
                return try JSONDecoder().decode(DraftResponse.self, from: data)
            } catch {
                throw APIError.decoding(error)
            }

        case 400:
            let baseMessage = Self.errorMessage(from: data) ?? Self.fallbackMessage(data: data)
            let issues = Self.issueSummary(from: data)
            let merged = issues.isEmpty
                ? baseMessage
                : "\(baseMessage) · \(issues)"
            throw APIError.server(status: 400, message: merged)

        case 401:
            throw APIError.unauthenticated

        case 402:
            let message = Self.errorMessage(from: data) ?? "Out of drafts"
            throw APIError.quotaExceeded(message: message)

        case 502:
            throw APIError.server(
                status: 502,
                message: Self.errorMessage(from: data) ?? Self.fallbackMessage(data: data)
            )

        default:
            throw APIError.server(
                status: http.statusCode,
                message: Self.errorMessage(from: data) ?? Self.fallbackMessage(data: data)
            )
        }
    }

    /// Parses the zod `issues[]` array on a 400 response and joins it
    /// into a single line for surfacing inline. Returns empty if absent.
    fileprivate static func issueSummary(from data: Data) -> String {
        guard
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let issues = json["issues"] as? [[String: Any]],
            !issues.isEmpty
        else { return "" }
        let parts: [String] = issues.compactMap { issue in
            let path = (issue["path"] as? String) ?? ""
            let message = (issue["message"] as? String) ?? ""
            if path.isEmpty && message.isEmpty { return nil }
            if path.isEmpty { return message }
            if message.isEmpty { return path }
            return "\(path): \(message)"
        }
        return parts.joined(separator: " · ")
    }
}

// MARK: - Detail endpoints (DELETE / PDF)

extension APIClient {
    /// DELETE /api/contracts/{id}. 200/204 both treated as success.
    func deleteContract(id: String, token: String) async throws {
        var request = try Self.contractRequest(id: id, suffix: "", baseURL: baseURL)
        request.httpMethod = "DELETE"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.transport(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.server(status: 0, message: "no http response")
        }

        switch http.statusCode {
        case 200, 204:
            return
        case 401:
            throw APIError.unauthenticated
        case 404:
            throw APIError.server(status: 404, message: "Not found")
        default:
            throw APIError.server(
                status: http.statusCode,
                message: Self.errorMessage(from: data) ?? Self.fallbackMessage(data: data)
            )
        }
    }

    /// GET /api/contracts/{id}/pdf — the rendered contract PDF (drafted).
    func contractPDF(id: String, token: String) async throws -> Data {
        try await pdfRequest(id: id, suffix: "/pdf", token: token)
    }

    /// GET /api/contracts/{id}/report/pdf — the verdict report PDF (scanned).
    func contractReportPDF(id: String, token: String) async throws -> Data {
        try await pdfRequest(id: id, suffix: "/report/pdf", token: token)
    }

    // MARK: - Private helpers

    private func pdfRequest(id: String, suffix: String, token: String) async throws -> Data {
        var request = try Self.contractRequest(id: id, suffix: suffix, baseURL: baseURL)
        request.httpMethod = "GET"
        request.timeoutInterval = 60
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/pdf", forHTTPHeaderField: "Accept")

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.transport(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw APIError.server(status: 0, message: "no http response")
        }

        switch http.statusCode {
        case 200:
            return data
        case 401:
            throw APIError.unauthenticated
        case 402:
            let message = Self.errorMessage(from: data) ?? "Upgrade required"
            throw APIError.quotaExceeded(message: message)
        case 404:
            throw APIError.server(status: 404, message: "Not found")
        default:
            throw APIError.server(
                status: http.statusCode,
                message: Self.errorMessage(from: data) ?? Self.fallbackMessage(data: data)
            )
        }
    }

    private static func contractRequest(id: String, suffix: String, baseURL: URL) throws -> URLRequest {
        let trimmed = id.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            throw APIError.invalidInput("missing contract id")
        }
        let path = "api/contracts/\(trimmed)\(suffix)"
        guard let url = URL(string: path, relativeTo: baseURL) else {
            throw APIError.invalidInput("invalid api base url")
        }
        return URLRequest(url: url)
    }
}
