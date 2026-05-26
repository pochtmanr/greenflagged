import Foundation

/// Shared OpenAI Chat Completions client. Same shape as the inlined call
/// inside `ScanService`, factored out so the other on-device AI flows
/// (improve / tweak / applyFix / translate) don't each redefine it.
///
/// No server in the chain — iOS reads `AppConfig.openAIAPIKey` from
/// `Secrets.xcconfig` and POSTs straight to api.openai.com.
nonisolated enum OpenAIChat {
    enum Failure: Error, CustomStringConvertible {
        case transport(Error)
        case http(status: Int, body: String)
        case emptyResponse
        case decoding(Error)

        var description: String {
            switch self {
            case .transport(let e): "OPENAI NETWORK · \(e.localizedDescription.uppercased())"
            case .http(let s, let b): "OPENAI HTTP \(s) · \(b.prefix(240))"
            case .emptyResponse: "OPENAI EMPTY RESPONSE"
            case .decoding(let e): "OPENAI DECODE · \(e.localizedDescription.uppercased())"
            }
        }
    }

    static func complete(
        system: String,
        user: String,
        model: String = AppConfig.openAIReviewModel,
        maxTokens: Int = 4096,
        temperature: Double = 0.2,
        json: Bool = false,
        urlSession: URLSession = .shared
    ) async throws -> String {
        let payload = Request(
            model: model,
            messages: [
                .init(role: "system", content: system),
                .init(role: "user", content: user),
            ],
            response_format: json ? .init(type: "json_object") : nil,
            temperature: temperature,
            max_tokens: maxTokens
        )

        guard let url = URL(string: "https://api.openai.com/v1/chat/completions") else {
            throw Failure.http(status: 0, body: "invalid url")
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 120
        request.setValue("Bearer \(AppConfig.openAIAPIKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = try JSONEncoder().encode(payload)

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await urlSession.data(for: request)
        } catch {
            throw Failure.transport(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw Failure.http(status: 0, body: "no http response")
        }
        guard (200..<300).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw Failure.http(status: http.statusCode, body: body)
        }

        let decoded: Response
        do {
            decoded = try JSONDecoder().decode(Response.self, from: data)
        } catch {
            throw Failure.decoding(error)
        }
        guard let content = decoded.choices.first?.message.content, !content.isEmpty else {
            throw Failure.emptyResponse
        }
        return content
    }

    private struct Request: Encodable {
        let model: String
        let messages: [Message]
        let response_format: ResponseFormat?
        let temperature: Double
        let max_tokens: Int

        struct Message: Encodable {
            let role: String
            let content: String
        }
        struct ResponseFormat: Encodable {
            let type: String
        }
    }

    private struct Response: Decodable {
        let choices: [Choice]
        struct Choice: Decodable { let message: Message }
        struct Message: Decodable { let content: String }
    }
}
