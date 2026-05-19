import Foundation

// =====================================================================
// Wizard answers model. The shapes here mirror what the server's zod
// validators accept (see landing/lib/contracts/industries/*.ts).
//   - name-group → { first, family, business? } (business default "")
//   - address    → { country, city, street, postal }
//   - date       → "YYYY-MM-DD" string (server expects optional string)
//   - allowOpenEnded date writes a companion `${id}_open: true` bool
//
// `toJSON()` produces a JSONSerialization-safe value (only String, Bool,
// Double, [String], [String: Any], NSNumber). The wizard wraps the whole
// `values` dictionary into the request body via `.mapValues { $0.toJSON() }`.
// =====================================================================

@MainActor
@Observable
final class DraftAnswers {
    var industry: DraftIndustry? = nil
    var values: [String: AnyAnswer] = [:]
    var title: String? = nil
    var jurisdiction: String? = nil
    var description: String? = nil
    /// Reserved for the future Business Profile picker (out of scope for P5).
    /// When nil, the server uses its own defaults.
    var businessProfileId: String? = nil

    /// Resets every answer when switching industry, so cross-industry
    /// keys with different shapes (e.g. `provider` on freelance vs.
    /// `disclosing_party` on nda) don't leak through.
    func setIndustry(_ industry: DraftIndustry) {
        if self.industry != industry {
            values.removeAll()
            self.industry = industry
            seedDefaults(for: industry)
        }
    }

    /// Pre-fills every default value declared on the question schema so
    /// the user sees the same starting state the web wizard does.
    private func seedDefaults(for industry: DraftIndustry) {
        for q in industrySchema(industry) {
            switch q {
            case .toggle(let id, _, let def, _):
                values[id] = .bool(def)
            case .number(let id, _, _, _, _, _, let def, _, _):
                if let def {
                    values[id] = .number(def)
                }
            case .checkboxGroup(let id, _, _, let def, _, _):
                if !def.isEmpty {
                    values[id] = .stringArray(def)
                }
            default:
                break
            }
        }
    }
}

/// Heterogeneous answer type. `toJSON()` returns a value safe for
/// `JSONSerialization.data(withJSONObject:)` — i.e. only the types the
/// JSON spec admits. Optional sub-fields collapse to empty strings on
/// name-group/address shapes to match the zod `.optional().default("")`
/// pattern used on the server's `business` field.
enum AnyAnswer: Sendable, Hashable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case stringArray([String])
    case date(Date)
    case nameGroup(first: String?, family: String?, business: String?)
    case address(country: String?, city: String?, street: String?, postal: String?)

    func toJSON() -> Any {
        switch self {
        case .string(let s):
            return s
        case .number(let n):
            return n
        case .bool(let b):
            return b
        case .stringArray(let xs):
            return xs
        case .date(let d):
            return Self.isoDateFormatter.string(from: d)
        case .nameGroup(let first, let family, let business):
            return [
                "first":    (first    ?? "").trimmingCharacters(in: .whitespacesAndNewlines),
                "family":   (family   ?? "").trimmingCharacters(in: .whitespacesAndNewlines),
                "business": (business ?? "").trimmingCharacters(in: .whitespacesAndNewlines),
            ]
        case .address(let country, let city, let street, let postal):
            return [
                "country": (country ?? "").trimmingCharacters(in: .whitespacesAndNewlines),
                "city":    (city    ?? "").trimmingCharacters(in: .whitespacesAndNewlines),
                "street":  (street  ?? "").trimmingCharacters(in: .whitespacesAndNewlines),
                "postal":  (postal  ?? "").trimmingCharacters(in: .whitespacesAndNewlines),
            ]
        }
    }

    /// Renders the answer for the review screen's `GFSpecRow` value side.
    /// Kept terse — the wizard never has to log full values, and we never
    /// log PII in production builds.
    var summaryText: String {
        switch self {
        case .string(let s):
            let trimmed = s.trimmingCharacters(in: .whitespacesAndNewlines)
            return trimmed.isEmpty ? "—" : trimmed
        case .number(let n):
            return Self.numberFormatter.string(from: NSNumber(value: n)) ?? "\(n)"
        case .bool(let b):
            return b ? "YES" : "NO"
        case .stringArray(let xs):
            return xs.isEmpty ? "—" : xs.joined(separator: ", ").uppercased()
        case .date(let d):
            return Self.isoDateFormatter.string(from: d)
        case .nameGroup(let first, let family, let business):
            let business = business?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            if !business.isEmpty { return business }
            let person = [first, family]
                .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
                .joined(separator: " ")
            return person.isEmpty ? "—" : person
        case .address(let country, let city, let street, let postal):
            let parts = [street, city, postal, country]
                .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
            return parts.isEmpty ? "—" : parts.joined(separator: ", ")
        }
    }

    // MARK: - Formatters

    private static let isoDateFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = TimeZone(secondsFromGMT: 0)
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    private static let numberFormatter: NumberFormatter = {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.maximumFractionDigits = 2
        f.minimumFractionDigits = 0
        return f
    }()
}
