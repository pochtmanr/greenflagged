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
            #if DEBUG
            if let url = error as? URLError,
               [.cannotConnectToHost, .cannotFindHost, .timedOut, .notConnectedToInternet].contains(url.code) {
                return "DEV SERVER UNREACHABLE · CHECK pnpm dev IN landing/"
            }
            #endif
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

nonisolated enum ImproveFieldKind: String, Sendable {
    case scope
    case deliverables
}

nonisolated struct TweakResponse: Decodable, Sendable {
    let body_md: String
    let previous_body_md: String
}

nonisolated struct TranslateResponse: Decodable, Sendable {
    let body_md: String
    let cached: Bool
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
    /// `locale` is optional and forwarded as `?locale=` so the server returns
    /// the cached translation for that locale (404 if absent).
    func contractPDF(id: String, locale: String? = nil, token: String) async throws -> Data {
        try await binaryDownload(
            id: id,
            suffix: "/pdf",
            accept: "application/pdf",
            locale: locale,
            token: token
        )
    }

    // MARK: - Private helpers

    private func binaryDownload(
        id: String,
        suffix: String,
        accept: String,
        locale: String?,
        token: String
    ) async throws -> Data {
        var request = try Self.contractRequest(
            id: id,
            suffix: suffix,
            baseURL: baseURL,
            locale: locale
        )
        request.httpMethod = "GET"
        request.timeoutInterval = 60
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue(accept, forHTTPHeaderField: "Accept")

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

    private static func contractRequest(
        id: String,
        suffix: String,
        baseURL: URL,
        locale: String? = nil
    ) throws -> URLRequest {
        let trimmed = id.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            throw APIError.invalidInput("missing contract id")
        }
        let path = "api/contracts/\(trimmed)\(suffix)"
        guard var components = URLComponents(
            url: URL(string: path, relativeTo: baseURL) ?? baseURL,
            resolvingAgainstBaseURL: true
        ) else {
            throw APIError.invalidInput("invalid api base url")
        }
        if let locale, !locale.isEmpty {
            var items = components.queryItems ?? []
            items.append(URLQueryItem(name: "locale", value: locale))
            components.queryItems = items
        }
        guard let url = components.url else {
            throw APIError.invalidInput("invalid api base url")
        }
        return URLRequest(url: url)
    }
}

// MARK: - AI editing endpoints (improve / tweak / fix / translate / versions / clone)

extension APIClient {
    /// POST /api/contracts/improve — rewrite a single wizard field (scope/deliverables).
    func improve(text: String, fieldKind: ImproveFieldKind, token: String) async throws -> String {
        guard let url = URL(string: "api/contracts/improve", relativeTo: baseURL) else {
            throw APIError.invalidInput("invalid api base url")
        }
        let body = try JSONEncoder().encode(ImproveRequest(text: text, field_kind: fieldKind.rawValue))
        let request = try makeJSONRequest(url: url, body: body, token: token)
        let data = try await runAIRequest(request)
        do {
            return try JSONDecoder().decode(ImproveResponse.self, from: data).improved
        } catch {
            throw APIError.decoding(error)
        }
    }

    /// POST /api/contracts/{id}/tweak — natural-language edit of a drafted contract.
    func tweak(contractId: String, instruction: String, token: String) async throws -> TweakResponse {
        var request = try Self.contractRequest(id: contractId, suffix: "/tweak", baseURL: baseURL)
        decorateJSON(&request, token: token)
        request.httpBody = try JSONEncoder().encode(TweakRequest(instruction: instruction))
        let data = try await runAIRequest(request)
        do {
            return try JSONDecoder().decode(TweakResponse.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }

    /// POST /api/contracts/{id}/fix — generate a drafted contract addressing a scan's redlines.
    func applyFix(contractId: String, token: String) async throws -> String {
        var request = try Self.contractRequest(id: contractId, suffix: "/fix", baseURL: baseURL)
        decorateJSON(&request, token: token)
        request.httpBody = "{}".data(using: .utf8) ?? Data()
        let data = try await runAIRequest(request)
        do {
            return try JSONDecoder().decode(ContractIdResponse.self, from: data).contract_id
        } catch {
            throw APIError.decoding(error)
        }
    }

    /// POST /api/contracts/{id}/translate — translate body_md to another locale (cached server-side).
    func translate(contractId: String, locale: String, token: String) async throws -> TranslateResponse {
        var request = try Self.contractRequest(id: contractId, suffix: "/translate", baseURL: baseURL)
        decorateJSON(&request, token: token)
        request.httpBody = try JSONEncoder().encode(TranslateRequest(locale: locale))
        let data = try await runAIRequest(request)
        do {
            return try JSONDecoder().decode(TranslateResponse.self, from: data)
        } catch {
            throw APIError.decoding(error)
        }
    }

    /// POST /api/contracts/{id}/versions — append a new contract version. Returns the new version number.
    /// `style` and `businessProfileId` are forwarded to the server which writes
    /// them onto the `contracts` row (the version row only stores `body_md`).
    /// Passing `businessProfileId == nil` does NOT unset the column — encode a
    /// JSON null at the call site if you mean to clear it. Stream E's editor
    /// only ever sets a profile, so this matches its semantics.
    func createVersion(
        contractId: String,
        bodyMd: String,
        title: String?,
        style: ContractStyle? = nil,
        businessProfileId: UUID? = nil,
        token: String
    ) async throws -> Int {
        var request = try Self.contractRequest(id: contractId, suffix: "/versions", baseURL: baseURL)
        decorateJSON(&request, token: token)
        request.httpBody = try JSONEncoder().encode(
            CreateVersionRequest(
                body_md: bodyMd,
                title: title,
                style: style,
                business_profile_id: businessProfileId?.uuidString.lowercased()
            )
        )
        let data = try await runMutationRequest(request)
        do {
            return try JSONDecoder().decode(CreateVersionResponse.self, from: data).version
        } catch {
            throw APIError.decoding(error)
        }
    }

    /// POST /api/contracts/{id}/clone — duplicate a contract. Returns the new contract id.
    func cloneContract(contractId: String, token: String) async throws -> String {
        var request = try Self.contractRequest(id: contractId, suffix: "/clone", baseURL: baseURL)
        decorateJSON(&request, token: token)
        request.httpBody = "{}".data(using: .utf8) ?? Data()
        let data = try await runMutationRequest(request)
        do {
            return try JSONDecoder().decode(ContractIdResponse.self, from: data).contract_id
        } catch {
            throw APIError.decoding(error)
        }
    }

    /// POST /api/account/delete — permanently delete the signed-in user and
    /// all RLS-cascaded data. The server returns 200 with `{ ok: true }`; we
    /// treat 200/204 as success and surface anything else through the
    /// standard mutation pathway.
    func deleteAccount(token: String) async throws {
        guard let url = URL(string: "api/account/delete", relativeTo: baseURL) else {
            throw APIError.invalidInput("invalid api base url")
        }
        var request = URLRequest(url: url)
        decorateJSON(&request, token: token)
        request.httpBody = "{}".data(using: .utf8) ?? Data()
        _ = try await runMutationRequest(request)
    }

    /// POST /api/contact — unauthenticated feedback form. Bearer header is
    /// omitted because the server route ignores auth.
    func sendContactMessage(
        name: String,
        email: String,
        message: String
    ) async throws {
        guard let url = URL(string: "api/contact", relativeTo: baseURL) else {
            throw APIError.invalidInput("invalid api base url")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 60
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(
            ContactRequest(name: name, email: email, message: message)
        )
        _ = try await runMutationRequest(request)
    }

    // MARK: - Request helpers

    private func makeJSONRequest(url: URL, body: Data, token: String) throws -> URLRequest {
        var request = URLRequest(url: url)
        decorateJSON(&request, token: token)
        request.httpBody = body
        return request
    }

    private func decorateJSON(_ request: inout URLRequest, token: String) {
        request.httpMethod = "POST"
        request.timeoutInterval = 120
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    }

    /// Shared status-code handling for AI-backed POSTs (improve/tweak/fix/translate).
    /// Maps 5xx into `.aiFailed` so the UI can route to the AI-error banner.
    private func runAIRequest(_ request: URLRequest) async throws -> Data {
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
            return data
        case 401:
            throw APIError.unauthenticated
        case 402:
            throw APIError.quotaExceeded(message: Self.errorMessage(from: data) ?? "Upgrade required")
        case 404:
            throw APIError.server(status: 404, message: Self.errorMessage(from: data) ?? "Not found")
        case 500, 502:
            throw APIError.aiFailed(message: Self.errorMessage(from: data) ?? Self.fallbackMessage(data: data))
        default:
            throw APIError.server(
                status: http.statusCode,
                message: Self.errorMessage(from: data) ?? Self.fallbackMessage(data: data)
            )
        }
    }

    /// Status-code handling for non-AI mutations (versions/clone).
    private func runMutationRequest(_ request: URLRequest) async throws -> Data {
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
            return data
        case 401:
            throw APIError.unauthenticated
        case 404:
            throw APIError.server(status: 404, message: Self.errorMessage(from: data) ?? "Not found")
        default:
            throw APIError.server(
                status: http.statusCode,
                message: Self.errorMessage(from: data) ?? Self.fallbackMessage(data: data)
            )
        }
    }
}

// MARK: - AI request / response payloads

private nonisolated struct ImproveRequest: Encodable, Sendable {
    let text: String
    let field_kind: String
}

private nonisolated struct ImproveResponse: Decodable, Sendable {
    let improved: String
}

private nonisolated struct TweakRequest: Encodable, Sendable {
    let instruction: String
}

private nonisolated struct TranslateRequest: Encodable, Sendable {
    let locale: String
}

private nonisolated struct CreateVersionRequest: Encodable, Sendable {
    let body_md: String
    let title: String?
    let style: ContractStyle?
    let business_profile_id: String?

    enum CodingKeys: String, CodingKey {
        case body_md, title, style, business_profile_id
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(body_md, forKey: .body_md)
        try c.encodeIfPresent(title, forKey: .title)
        try c.encodeIfPresent(style, forKey: .style)
        try c.encodeIfPresent(business_profile_id, forKey: .business_profile_id)
    }
}

private nonisolated struct CreateVersionResponse: Decodable, Sendable {
    let version: Int
}

private nonisolated struct ContractIdResponse: Decodable, Sendable {
    let contract_id: String
}

private nonisolated struct ContactRequest: Encodable, Sendable {
    let name: String
    let email: String
    let message: String
}

