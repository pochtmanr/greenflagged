# PROMPT 3 — Scanner end-to-end (camera + upload + paste → /api/scan)

**Working directory:** `/Users/romanpochtman/Developer/ContractChecker/`
**Suggested agent:** `swift-ui-architect` (will also edit one Next.js file — that's OK)
**Depends on:** nothing (but eats into territory P4 will deepen — see below)
**Blocks:** P4 (verdict screen) wants to receive a `contract_id` from this prompt's `done` state
**Estimated size:** ~2 hours

---

## Read first

```
mempalace search "greenflagged ios scan upload bearer" --wing greenflagged
mempalace search "greenflagged design dropdown card" --wing greenflagged --room design
```

Then read in this order:
1. `AGENTS.md` and `CLAUDE.md` — repo rules. Stay on `main`. Never hardcode URLs / keys.
2. `ios/Green Flagged/Green Flagged/Features/Scan/ScanView.swift` — the file you're rewriting. Lines 272–277 are the literal `TODO` you're replacing.
3. `ios/Green Flagged/Green Flagged/Core/APIClient.swift` — empty skeleton, you're filling it in.
4. `ios/Green Flagged/Green Flagged/Core/AppConfig.swift` — how URLs are loaded. Use `AppConfig.apiBaseURL`. Never inline a host.
5. `ios/Green Flagged/Green Flagged/Core/Session.swift` — where the access token lives. `session.currentAccessToken()` returns `String?`. Refresh logic already handled by supabase-swift.
6. `ios/Green Flagged/Info.plist` — currently missing camera permission key. Lines 76–80 are where SUPABASE_URL etc. live; add the new keys above the `</dict>` close.
7. `landing/app/api/scan/route.ts` — the route you're calling. Read it carefully: multipart for files, JSON for paste, 10MB cap, 250k char cap, returns `{ contract_id, severity }`.
8. `landing/lib/supabase/server.ts` — note `getSupabaseFromRequest()` exists at lines 31–46. The scan route currently uses `getSupabaseServer()` only (cookies). You must retrofit it.

## Goal

The scanner has three UI modes (Upload / Paste / Scan Paper) all already implemented, but the submit button never actually calls the server — `ScanViewModel.submit()` at `ScanView.swift:272-277` is a TODO. The camera flow also freezes because `Info.plist` is missing `NSCameraUsageDescription`. Make all three modes actually scan, return a contract id, and transition to a verdict placeholder.

There are **three discrete pieces** you're shipping:

1. **`Info.plist` permissions** — fixes the camera freeze.
2. **`APIClient` real implementation** — Bearer-authed multipart/JSON upload to `POST /api/scan`.
3. **`ScanViewModel.submit()` wiring** — call the API, drive state transitions, handle errors, present a stubbed `ContractDetailView` placeholder so P4 can drop in its real screen later.

Plus one **server-side retrofit**: `landing/app/api/scan/route.ts` and `landing/app/api/scan/preview/route.ts` swap `getSupabaseServer()` → `getSupabaseFromRequest()`. Without this, the iOS Bearer header is ignored and every call 401s.

## Tasks

### Task 1 — `Info.plist` (fixes the freeze)

Add these two keys above `</dict>` in `ios/Green Flagged/Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Green Flagged uses the camera to scan paper contracts. Photos stay on your device until you submit a scan.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Green Flagged can import contract PDFs and DOCX files from your photo library or Files app.</string>
```

Without `NSCameraUsageDescription` iOS kills the process the moment `VNDocumentCameraViewController` requests the camera — that's the freeze the user is hitting.

### Task 2 — Server-side Bearer retrofit (5-minute web edit)

In `landing/app/api/scan/route.ts`:
- Change line 7 import from `import { getSupabaseServer } from "@/lib/supabase/server";` → `import { getSupabaseFromRequest } from "@/lib/supabase/server";`
- Change line 87 from `const supabase = await getSupabaseServer();` → `const supabase = await getSupabaseFromRequest();`

In `landing/app/api/scan/preview/route.ts`:
- Same swap: import + line 167 callsite.

Run `pnpm tsc --noEmit` in `landing/` after the edit. Must be clean.

### Task 3 — Implement `Core/APIClient.swift`

Replace the whole file. The public surface should be a single async method plus error type. Pattern:

```swift
import Foundation

enum APIError: Error, CustomStringConvertible {
    case unauthenticated
    case quotaExceeded(message: String)
    case aiFailed(message: String)
    case server(status: Int, message: String)
    case transport(Error)
    case decoding(Error)

    var description: String { /* user-facing strings, mono-uppercase friendly */ }
}

struct ScanResponse: Decodable, Sendable {
    let contract_id: String
    let severity: String   // "green" | "yellow" | "orange" | "red"
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

    /// POST /api/scan — multipart when fileURL is provided, JSON when text is.
    /// Returns the new contract id + severity on success.
    /// Reads the access token from Session at call time so refreshes are picked up.
    func scan(fileURL: URL?, text: String?, token: String) async throws -> ScanResponse { /* ... */ }
}
```

Implementation notes:

- `baseURL` ends with `/` or doesn't; build endpoints with `URL(string: "api/scan", relativeTo: baseURL)!`. Don't string-concat.
- **Bearer token**: every request sets `request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")`. Token is passed in by the caller — APIClient does not hold session state.
- **Multipart upload (file mode)**: build a multipart body manually. Boundary = `"gf-\(UUID().uuidString)"`. Body parts:
  - One `file` part, `Content-Disposition: form-data; name="file"; filename="<original>"`, `Content-Type: <mime>` (use `UTType(filenameExtension:)?.preferredMIMEType ?? "application/octet-stream"`).
  - Don't send a `model` field. The server picks the default.
- **JSON (paste mode)**: body is `{"text": "..."}`. No `model` field.
- **Status mapping**:
  - 200/201 → decode `ScanResponse`. Throw `.decoding` if it fails.
  - 401 → `.unauthenticated` (Session will sign the user out on this).
  - 402 → `.quotaExceeded(message:)` — read the error JSON body for the message.
  - 413 → `.server(status: 413, message: "File too large — 10MB max")`.
  - 502 with `code: "ai_review_failed"` in body → `.aiFailed(message:)`.
  - Anything else → `.server(status:, message:)` where message is the JSON body's `error` field or the raw response string.
- **No retry**, **no 401 refresh-and-retry yet** — keep it simple. Supabase-swift refreshes the token on its own clock; if we hit 401 with a stale token, the user re-signs-in.
- **Timeout**: `URLRequest.timeoutInterval = 120` for scan (server allows up to 60s; give headroom).

### Task 4 — Wire `ScanViewModel.submit()` in `ScanView.swift`

Replace lines 272–277 of `ScanView.swift`. The view model needs access to the session (for the token) — pass it in. Two ways:

- (Recommended) Add a `session: Session?` property on `ScanViewModel`, set it from the view via `vm.session = session` in `.task { vm.session = session }` or in an `.onAppear`. The view already has `@Environment(Session.self) private var session`.

State transitions:
1. `state = .uploading`
2. Resolve `(fileURL, text)` from current mode:
   - `.upload` / `.scanPaper` → `vm.pickedFileURL`, `text = nil`
   - `.paste` → `text = vm.pastedText`, `fileURL = nil`
3. Pull token: `guard let token = await session.currentAccessToken() else { state = .error("SESSION EXPIRED — SIGN IN AGAIN"); return }`.
4. `state = .reviewing` just before the call (the server takes ~10–40s; the user wants to see "REVIEWING WITH AI…" during that window).
5. `let response = try await APIClient.shared.scan(fileURL:, text:, token:)`
6. `state = .done(contractId: response.contract_id)`.
7. On `APIError.quotaExceeded(let m)` → `state = .error("OUT OF SCANS · \(m.uppercased())")`. (Prompt 7 will swap this for a paywall sheet.)
8. On `APIError.aiFailed(let m)` → `state = .error("AI REVIEW FAILED · \(m.uppercased())")`.
9. On `APIError.unauthenticated` → `state = .error("SESSION EXPIRED — SIGN IN AGAIN")` and call `await session.signOut()`.
10. Any other error → `state = .error(error.localizedDescription.uppercased())`.

### Task 5 — Stub navigation to detail on `.done`

`ContractDetailView` will be built by Prompt 4 and may not exist yet. Add a temporary placeholder in `Features/Contracts/ContractDetailView.swift`:

```swift
import SwiftUI
struct ContractDetailView: View {
    let contractId: String
    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()
            VStack(spacing: Spacing.s4) {
                GFTag(label: "VERDICT READY")
                Text(contractId).font(.gf.monoSm).foregroundStyle(Color.gf.fg2)
                Text("Detail screen lands in Prompt 4.")
                    .font(.gf.bodySm).foregroundStyle(Color.gf.fg3)
            }
        }
    }
}
```

If the file already exists (P4 ran first), leave it alone.

In `ScanView`, when `vm.state` becomes `.done(let id)`, present `ContractDetailView(contractId: id)` via a `.fullScreenCover` bound to a `@State private var doneContractId: String?`. Watch state changes with `.onChange(of: vm.state)` — when `case .done(let id)` set `doneContractId = id`. Dismissing the cover should reset `vm.state` to `.idle` and clear `vm.pickedFileURL` / `vm.pastedText`.

### Task 6 — Polish the upload card

The user asked for a "professional" drop-zone. Keep changes minimal:

- When `vm.state == .ready(filename, size)`, replace the placeholder "Tap to choose…" with a filled card showing:
  - Mono filename (truncate middle if long, `.lineLimit(1).truncationMode(.middle)`)
  - `Spacer()`
  - Size string via the existing `formattedSize` helper
  - A small "REMOVE" `GFButton` (link style) that calls `vm.pickedFileURL = nil; vm.state = .idle`
- Use `GFFrame` border, not a new component.

## Constraints

- Stay on `main`. No PR, no branches.
- Never hardcode `apiBaseURL` or the Bearer token — load from `AppConfig` / `Session`. Fail loud if missing.
- Never log the token, even at debug level. Logging the response body is fine in DEBUG only.
- Don't introduce Combine, async streams, or third-party libs. `URLSession` is enough.
- The multipart body must use `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, or `text/plain` for `Content-Type` based on the file's UTType. Don't blindly send `application/octet-stream` unless the type is genuinely unknown.

## Web API contract (quoted exact)

`POST /api/scan` — see `landing/app/api/scan/route.ts`

- **Multipart**: form fields `file` (required) and optional `model` (don't send). 10MB hard cap.
- **JSON**: body `{ "text": "<string>" }`. 250,000 char cap.
- **Auth**: `Authorization: Bearer <jwt>` (after Task 2 retrofit).
- **200**: `{ "contract_id": "<uuid>", "severity": "green" | "yellow" | "orange" | "red" }`.
- **400**: `{ "error": "<msg>" }` — bad input.
- **401**: `{ "error": "Sign in required", "code": "unauthenticated" }`.
- **402**: blocked by quota — body has `{ "error": "<msg>" }` plus typically `{ "paywall_url": "..." }`. Surface `error` to the user.
- **413**: `{ "error": "File exceeds 10MB upload limit" }` or `"Pasted text is too long"`.
- **415**: `{ "error": "Unsupported Content-Type" }` or `"Failed to parse file"`.
- **422**: `{ "error": "No readable text found in the contract" }`.
- **502**: `{ "error": "<msg>", "code": "ai_review_failed" }`.
- **500**: storage/insert failures — `{ "error": "<msg>" }`.

## Done when

- [ ] `Info.plist` contains `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription`.
- [ ] `landing/app/api/scan/route.ts` and `landing/app/api/scan/preview/route.ts` use `getSupabaseFromRequest()`. `pnpm tsc --noEmit` clean in `landing/`.
- [ ] `Core/APIClient.swift` exports `APIClient.shared`, `APIError`, `ScanResponse`, and a working `scan(fileURL:text:token:)` method.
- [ ] `ScanViewModel.submit()` calls the API and drives the state machine to `.done` or `.error`.
- [ ] Scan Paper opens the camera (no freeze), finishes a scan, transitions through `.uploading → .reviewing → .done`, and lands on the `ContractDetailView` placeholder.
- [ ] Upload mode does the same with a PDF.
- [ ] Paste mode does the same with text.
- [ ] The "ready" upload card shows filename + size + REMOVE button.

## Verification

```bash
# 1. Web side — types clean.
cd landing
pnpm tsc --noEmit

# 2. iOS side — device-SDK build.
cd ..
xcodebuild -project "ios/Green Flagged/Green Flagged.xcodeproj" \
           -scheme "Green Flagged" \
           -sdk iphoneos \
           -configuration Debug \
           build \
           CODE_SIGNING_ALLOWED=NO
```

Then Roman runs on his iPhone:
1. Tap Scan tab → Scan Paper → camera prompt appears, no freeze → take photo → finishes.
2. Tap SCAN CONTRACT → see "UPLOADING…" then "REVIEWING WITH AI…" then the verdict placeholder.
3. Repeat with Upload (any PDF in Files app) and Paste (paragraph of contract text).
4. Try with a known oversized file → see "FILE TOO LARGE" error.

## Out of scope

- The actual verdict UI — Prompt 4.
- Paywall on 402 — Prompt 7 wires the paywall sheet; for now we just display an error.
- Retrying scan after error beyond a manual "TRY AGAIN" button (already in the view).
- Background uploads / progress bar — server is fast enough that a spinner suffices.
- Pre-signed Supabase storage uploads — server-side route handles storage.
- Retrofitting other `/api/contracts/*` routes — Prompts 4 and 5 each own their slice.
