import Foundation

// TODO Phase 4 — wire the actual transport.
// Responsibilities (per claude/api/contracts.md and bearer-auth.md):
//   - Build URLRequest against AppConfig.apiBaseURL
//   - Inject `Authorization: Bearer <session.currentAccessToken()>` on every call
//   - Encode JSON or multipart/form-data
//   - Map 401 → refresh + retry once
//   - Map 402 → GFError.quotaExceeded(paywallURL:)
//   - Map 502 ai_review_failed → GFError.aiFailed
//
// Endpoints used by mobile:
//   POST /api/scan                       (multipart or JSON)
//   POST /api/contracts/draft            (JSON)
//   GET  /api/contracts/{id}/pdf         (binary)
//   POST /api/billing/apple/webhook      (JSON, Phase 6)

actor APIClient {
    let baseURL: URL
    let session: URLSession

    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    static func makeDefault() async -> APIClient {
        APIClient(baseURL: AppConfig.apiBaseURL)
    }
}
