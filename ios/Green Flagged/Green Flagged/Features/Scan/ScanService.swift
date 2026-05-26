import Foundation
import PDFKit
import Supabase

/// On-device port of `landing/app/api/scan/route.ts` + `landing/lib/ai/review.ts`.
///
/// Flow per `submit`:
/// 1. Extract text from the file (PDFKit) or use pasted text.
/// 2. Call OpenAI Chat Completions directly — same system prompt as the web.
/// 3. Insert `contracts` + `scans` rows into Supabase via supabase-swift
///    (RLS scopes the writes to the signed-in user, same as the web).
/// 4. Return the new contract id so ScanView can push the verdict screen.
///
/// No /api/scan call. No landing/ host involved.
actor ScanService {
    static let shared = ScanService()

    private let supabase: SupabaseClient
    private let urlSession: URLSession

    init(
        client: SupabaseClient = SupabaseService.shared,
        urlSession: URLSession = .shared
    ) {
        self.supabase = client
        self.urlSession = urlSession
    }

    private static let maxFileBytes = 10 * 1024 * 1024
    private static let maxPastedChars = 250_000
    private static let maxContextChars = 200_000

    /// Extract → review → persist. Returns the new contract id.
    func scan(
        fileURL: URL?,
        pastedText: String?,
        ownerId: String
    ) async throws -> String {
        // 1. Resolve input → text + (optional) file bytes
        let text: String
        let truncated: Bool
        let file: FilePayload?
        if let fileURL {
            let payload = try Self.readFile(at: fileURL)
            let extracted = try Self.extractText(from: payload)
            let trimmed = Self.truncate(extracted)
            text = trimmed.text
            truncated = trimmed.truncated
            file = payload
        } else if let pastedText, !pastedText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            if pastedText.count > Self.maxPastedChars {
                throw ScanServiceError.userFacing("Pasted text is too long")
            }
            let trimmed = Self.truncate(pastedText)
            text = trimmed.text
            truncated = trimmed.truncated
            file = nil
        } else {
            throw ScanServiceError.userFacing("Nothing to scan")
        }

        let cleanText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleanText.isEmpty {
            throw ScanServiceError.userFacing("No readable text found in the contract")
        }

        // 2. Create the contract row first (web does this before the AI call too)
        let contractId = UUID().uuidString.lowercased()
        let title = Self.deriveTitle(from: cleanText, fallback: file?.filename ?? "Untitled contract")

        var storagePath: String? = nil
        if let file {
            let ext = file.extensionGuess
            let path = "\(ownerId)/\(contractId)/source.\(ext)"
            do {
                _ = try await supabase.storage
                    .from("contracts")
                    .upload(
                        path,
                        data: file.data,
                        options: FileOptions(contentType: file.mime, upsert: false)
                    )
                storagePath = path
            } catch {
                // Non-fatal — surface but continue without storage so the user still gets a verdict.
                storagePath = nil
            }
        }

        let contractRow = ContractInsert(
            id: contractId,
            owner_id: ownerId,
            kind: "scanned",
            title: title,
            storage_path: storagePath
        )

        do {
            try await supabase.from("contracts").insert(contractRow).execute()
        } catch {
            if let path = storagePath {
                _ = try? await supabase.storage.from("contracts").remove(paths: [path])
            }
            throw ScanServiceError.userFacing("Failed to create contract: \(error.localizedDescription)")
        }

        // 3. Call OpenAI
        let review: ReviewResult
        do {
            review = try await reviewContract(text: cleanText)
        } catch {
            if let path = storagePath {
                _ = try? await supabase.storage.from("contracts").remove(paths: [path])
            }
            _ = try? await supabase.from("contracts").delete().eq("id", value: contractId).execute()
            throw ScanServiceError.aiFailed(error.localizedDescription)
        }

        let verdictMd = truncated
            ? "> Note: contract was truncated to 200KB for review. Re-upload a shorter version for full coverage.\n\n\(review.verdict_md)"
            : review.verdict_md

        // 4. Persist scans + verdict severity
        let scanRow = ScanInsert(
            contract_id: contractId,
            taxonomy: review.taxonomyJSON,
            verdict_md: verdictMd,
            redlines: review.redlinesJSON,
            source_text: cleanText
        )

        do {
            try await supabase.from("scans").insert(scanRow).execute()
        } catch {
            throw ScanServiceError.userFacing("Failed to save scan: \(error.localizedDescription)")
        }

        do {
            try await supabase
                .from("contracts")
                .update(ContractSeverityUpdate(verdict_severity: review.severity))
                .eq("id", value: contractId)
                .execute()
        } catch {
            throw ScanServiceError.userFacing("Failed to update verdict severity: \(error.localizedDescription)")
        }

        _ = try? await supabase
            .from("usage_events")
            .insert(UsageEventInsert(user_id: ownerId, kind: "scan", contract_id: contractId))
            .execute()

        return contractId
    }

    // MARK: - File reading

    private static func readFile(at url: URL) throws -> FilePayload {
        let didStart = url.startAccessingSecurityScopedResource()
        defer { if didStart { url.stopAccessingSecurityScopedResource() } }

        let data: Data
        do {
            data = try Data(contentsOf: url)
        } catch {
            throw ScanServiceError.userFacing("Could not read the file")
        }
        guard !data.isEmpty else {
            throw ScanServiceError.userFacing("Uploaded file is empty")
        }
        guard data.count <= maxFileBytes else {
            throw ScanServiceError.userFacing("File exceeds 10MB upload limit")
        }

        let ext = url.pathExtension.lowercased()
        let mime: String = {
            switch ext {
            case "pdf":  return "application/pdf"
            case "txt":  return "text/plain"
            case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            default:     return "application/octet-stream"
            }
        }()

        return FilePayload(data: data, filename: url.lastPathComponent, mime: mime, extensionGuess: ext.isEmpty ? "bin" : ext)
    }

    private static func extractText(from file: FilePayload) throws -> String {
        switch file.mime {
        case "application/pdf":
            return try extractPDFText(data: file.data)
        case "text/plain":
            guard let text = String(data: file.data, encoding: .utf8) else {
                throw ScanServiceError.userFacing("Could not decode text file (expected UTF-8)")
            }
            return text
        default:
            // DOCX on-device parsing is non-trivial; ask the user to paste text.
            throw ScanServiceError.userFacing("DOCX is not supported on iOS yet. Paste the text instead.")
        }
    }

    private static func extractPDFText(data: Data) throws -> String {
        guard let document = PDFDocument(data: data) else {
            throw ScanServiceError.userFacing("Could not open PDF")
        }
        var parts: [String] = []
        for index in 0..<document.pageCount {
            if let page = document.page(at: index), let s = page.string, !s.isEmpty {
                parts.append(s)
            }
        }
        let joined = parts.joined(separator: "\n\n")
        if joined.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            throw ScanServiceError.userFacing("PDF has no extractable text (it may be a scanned image)")
        }
        return joined
    }

    private static func truncate(_ text: String) -> (text: String, truncated: Bool) {
        if text.count <= maxContextChars { return (text, false) }
        let cut = text.index(text.startIndex, offsetBy: maxContextChars)
        return (String(text[..<cut]), true)
    }

    private static func deriveTitle(from text: String, fallback: String) -> String {
        for line in text.components(separatedBy: CharacterSet.newlines) {
            let candidate = line.trimmingCharacters(in: .whitespacesAndNewlines)
            if candidate.count >= 4 {
                return String(candidate.prefix(120))
            }
        }
        return fallback
    }

    // MARK: - OpenAI

    private func reviewContract(text: String) async throws -> ReviewResult {
        let first = try await callOpenAI(text: text, strictRetry: false)
        if let parsed = Self.tryParse(first) {
            return try Self.validate(parsed)
        }
        let retry = try await callOpenAI(text: text, strictRetry: true)
        guard let parsed = Self.tryParse(retry) else {
            throw ScanServiceError.userFacing("AI response was not valid JSON after retry")
        }
        return try Self.validate(parsed)
    }

    private func callOpenAI(text: String, strictRetry: Bool) async throws -> String {
        let userContent = strictRetry
            ? "Your previous response was not valid JSON. Return ONLY a valid JSON object matching the schema in the system prompt — no commentary, no code fences.\n\nContract:\n\(text)"
            : text

        let payload = OpenAIChatRequest(
            model: AppConfig.openAIReviewModel,
            messages: [
                .init(role: "system", content: ScanService.systemReviewPrompt),
                .init(role: "user", content: userContent)
            ],
            response_format: .init(type: "json_object"),
            temperature: 0.2,
            max_tokens: 4096
        )

        guard let url = URL(string: "https://api.openai.com/v1/chat/completions") else {
            throw ScanServiceError.userFacing("Invalid OpenAI URL")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 120
        request.setValue("Bearer \(AppConfig.openAIAPIKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await urlSession.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw ScanServiceError.userFacing("OpenAI returned no HTTP response")
        }
        guard (200..<300).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw ScanServiceError.userFacing("OpenAI HTTP \(http.statusCode): \(body.prefix(240))")
        }

        let decoded = try JSONDecoder().decode(OpenAIChatResponse.self, from: data)
        guard let content = decoded.choices.first?.message.content, !content.isEmpty else {
            throw ScanServiceError.userFacing("OpenAI returned an empty response")
        }
        return content
    }

    // MARK: - Review parsing (mirror of validate() in landing/lib/ai/review.ts)

    private static func tryParse(_ raw: String) -> [String: Any]? {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        let stripped = trimmed
            .replacingOccurrences(of: "^```(?:json)?\\s*", with: "", options: .regularExpression)
            .replacingOccurrences(of: "```$", with: "", options: .regularExpression)
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard let data = stripped.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else { return nil }
        return obj
    }

    private static let reviewKeys = [
        "ip_ownership", "payment_terms", "termination", "nda_scope",
        "liability_cap", "jurisdiction", "auto_renewal", "kill_fees", "exclusivity"
    ]

    private static func validate(_ parsed: [String: Any]) throws -> ReviewResult {
        guard let severityRaw = parsed["severity"] as? String,
              let severity = SeverityRaw(rawValue: severityRaw)
        else {
            throw ScanServiceError.userFacing("Invalid severity in AI response")
        }
        let verdictMd = (parsed["verdict_md"] as? String) ?? ""

        var taxonomy: [String: JSONValue] = [:]
        let taxonomyIn = (parsed["taxonomy"] as? [String: Any]) ?? [:]
        for key in reviewKeys {
            let entry = (taxonomyIn[key] as? [String: Any]) ?? [:]
            let present = (entry["present"] as? Bool) ?? false
            let summary = (entry["summary"] as? String) ?? ""
            let sev = (entry["severity"] as? String).flatMap(SeverityRaw.init(rawValue:)) ?? .green
            taxonomy[key] = .object([
                "present":  .bool(present),
                "summary":  .string(summary),
                "severity": .string(sev.rawValue)
            ])
        }

        var redlines: [JSONValue] = []
        if let arr = parsed["redlines"] as? [[String: Any]] {
            for entry in arr {
                let sev = (entry["severity"] as? String).flatMap(SeverityRaw.init(rawValue:)) ?? .yellow
                redlines.append(.object([
                    "clause_excerpt": .string((entry["clause_excerpt"] as? String) ?? ""),
                    "issue":          .string((entry["issue"] as? String) ?? ""),
                    "suggestion":     .string((entry["suggestion"] as? String) ?? ""),
                    "severity":       .string(sev.rawValue)
                ]))
            }
        }

        return ReviewResult(
            severity: severity.rawValue,
            verdict_md: verdictMd,
            taxonomyJSON: .object(taxonomy),
            redlinesJSON: .array(redlines)
        )
    }

    // MARK: - System prompt (verbatim from landing/lib/ai/review.ts)

    private static let systemReviewPrompt = """
You are a contract reviewer for Green Flagged. The reader
is a freelancer or small business owner deciding whether to sign. Be candid,
specific, and brief. Plain English. Explain any legalese you must use.

Return EXACTLY this JSON shape (no prose, no code fences):

{
  "severity": "green" | "yellow" | "orange" | "red",
  "verdict_md": "<markdown, see rules below>",
  "taxonomy": {
    "ip_ownership":  { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "payment_terms": { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "termination":   { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "nda_scope":     { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "liability_cap": { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "jurisdiction":  { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "auto_renewal":  { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "kill_fees":     { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" },
    "exclusivity":   { "present": boolean, "summary": string, "severity": "green|yellow|orange|red" }
  },
  "redlines": [
    {
      "clause_excerpt": "<verbatim clause text from the contract, up to ~300 chars>",
      "issue":          "<plain-language explanation of what's wrong>",
      "suggestion":     "<exact replacement language to propose>",
      "severity":       "green|yellow|orange|red"
    }
  ]
}

Rules for verdict_md:
- 3 to 5 short paragraphs. Each paragraph ≤ 70 words.
- Paragraph 1: one-sentence verdict that names the single biggest risk. No throat-clearing.
- Middle paragraphs: one material risk each. Quote the actual clause inline using "double quotes" so the reader can find it. Then say what to do about it in concrete terms (specific number, specific clause name, specific edit).
- Final paragraph: what to do next — sign, negotiate, or walk — and the top 1-2 asks to send back.
- Every claim of risk must be tied to a quoted phrase from the contract. If you cannot quote it, do not claim it.
- If a section is missing (e.g. no liability cap), say "the contract has no liability cap" — do not invent a quote.
- Banned openers and filler: "Overall", "This contract", "fairly standard", "straightforward", "However there are", "Key items to push back on include", "It is important to note", "robust". Start somewhere else.
- Proofread before emitting. No misspellings or invented words.

Rules for taxonomy.summary: one short sentence. If present, quote a key phrase. If absent, say so plainly.

Rules for redlines:
- clause_excerpt MUST be verbatim from the contract — do not paraphrase, do not invent.
- issue: 1-2 sentences naming the concrete harm to the signer.
- suggestion: drop-in replacement language the user can paste into a redline. Not a description of what to change — the actual replacement text.
- Order redlines by severity (red first), max 8 entries. Skip cosmetic issues.

Severity guide:
- green:  balanced, low risk
- yellow: minor issues, push back if you can
- orange: significant red flags, negotiate before signing
- red:    do not sign without changes, multiple unfair terms

Output ONLY the JSON object.
"""
}

// MARK: - Errors

enum ScanServiceError: Error, CustomStringConvertible {
    case userFacing(String)
    case aiFailed(String)

    var description: String {
        switch self {
        case .userFacing(let m): return m
        case .aiFailed(let m):   return "AI review failed · \(m)"
        }
    }
}

// MARK: - Wire types

private nonisolated struct FilePayload: Sendable {
    let data: Data
    let filename: String
    let mime: String
    let extensionGuess: String
}

private nonisolated enum SeverityRaw: String, Sendable {
    case green, yellow, orange, red
}

private nonisolated struct ReviewResult: Sendable {
    let severity: String
    let verdict_md: String
    let taxonomyJSON: JSONValue
    let redlinesJSON: JSONValue
}

// MARK: - OpenAI request / response

private nonisolated struct OpenAIChatRequest: Encodable, Sendable {
    let model: String
    let messages: [Message]
    let response_format: ResponseFormat
    let temperature: Double
    let max_tokens: Int

    struct Message: Encodable, Sendable {
        let role: String
        let content: String
    }
    struct ResponseFormat: Encodable, Sendable {
        let type: String
    }
}

private nonisolated struct OpenAIChatResponse: Decodable, Sendable {
    let choices: [Choice]
    struct Choice: Decodable, Sendable {
        let message: Message
    }
    struct Message: Decodable, Sendable {
        let content: String
    }
}

// MARK: - Supabase row payloads

private nonisolated struct ContractInsert: Encodable, Sendable {
    let id: String
    let owner_id: String
    let kind: String
    let title: String
    let storage_path: String?
}

private nonisolated struct ContractSeverityUpdate: Encodable, Sendable {
    let verdict_severity: String
}

private nonisolated struct ScanInsert: Encodable, Sendable {
    let contract_id: String
    let taxonomy: JSONValue
    let verdict_md: String
    let redlines: JSONValue
    let source_text: String
}

private nonisolated struct UsageEventInsert: Encodable, Sendable {
    let user_id: String
    let kind: String
    let contract_id: String
}

// MARK: - JSONValue — recursive Sendable Encodable for dynamic JSON payloads

nonisolated enum JSONValue: Encodable, Sendable {
    case string(String)
    case bool(Bool)
    case int(Int)
    case double(Double)
    case array([JSONValue])
    case object([String: JSONValue])
    case null

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let s): try container.encode(s)
        case .bool(let b):   try container.encode(b)
        case .int(let i):    try container.encode(i)
        case .double(let d): try container.encode(d)
        case .array(let a):  try container.encode(a)
        case .object(let o): try container.encode(o)
        case .null:          try container.encodeNil()
        }
    }
}
