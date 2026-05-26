import SwiftUI
import Supabase

// =====================================================================
// BusinessProfilesView — Settings → Business Profiles.
// List of saved company presets; tap a row to edit, "+" creates a new one.
// Mirrors landing/app/(app)/settings/business/page.tsx.
// =====================================================================

struct BusinessProfilesView: View {
    @State private var profiles: [BusinessProfile] = []
    @State private var isLoading: Bool = false
    @State private var loadError: String? = nil
    @State private var showCreate: Bool = false

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    header

                    if isLoading && profiles.isEmpty {
                        loadingRow
                    } else if let loadError {
                        errorBanner(loadError)
                    } else if profiles.isEmpty {
                        emptyState
                    } else {
                        profileList
                    }
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
            }
            .refreshable { await refresh() }
        }
        .navigationTitle("BUSINESS PROFILES")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showCreate = true } label: {
                    Image(systemName: "plus")
                        .foregroundStyle(Color.gf.fg1)
                }
                .accessibilityLabel("New business profile")
            }
        }
        .sheet(isPresented: $showCreate) {
            NavigationStack {
                BusinessProfileEditView(profile: nil) { saved in
                    profiles.insert(saved, at: 0)
                    if saved.isDefault { unsetOtherDefaults(except: saved.id) }
                }
            }
        }
        .navigationDestination(for: BusinessProfile.self) { profile in
            BusinessProfileEditView(profile: profile) { saved in
                if let idx = profiles.firstIndex(where: { $0.id == saved.id }) {
                    profiles[idx] = saved
                }
                if saved.isDefault { unsetOtherDefaults(except: saved.id) }
            } onDelete: { id in
                profiles.removeAll { $0.id == id }
            }
        }
        .task { await refreshIfNeeded() }
    }

    // MARK: - Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// PRESETS")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)
            Text("Your business profiles")
                .font(.gf.h2)
                .foregroundStyle(Color.gf.fg1)
            Text("Used to autofill the \"my company\" side of drafted contracts.")
                .font(.gf.bodySm)
                .foregroundStyle(Color.gf.fg3)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var loadingRow: some View {
        HStack {
            Spacer()
            VStack(spacing: Spacing.s3) {
                GFTag(label: "LOADING…")
                ProgressView()
                    .progressViewStyle(.circular)
                    .tint(Color.gf.fg2)
            }
            Spacer()
        }
        .padding(.vertical, Spacing.s5)
    }

    private func errorBanner(_ message: String) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            GFErrorBanner(message: message)
            GFButton(label: "RETRY", style: .ghost) {
                Task { await refresh() }
            }
        }
    }

    private var emptyState: some View {
        GFFrame {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("// NO PROFILES YET")
                    .font(.gf.label)
                    .foregroundStyle(Color.gf.fg2)
                Text("Add your business once, reuse on every drafted contract.")
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg3)
                GFButton(label: "ADD PROFILE", style: .solid) { showCreate = true }
            }
        }
    }

    private var profileList: some View {
        VStack(spacing: 0) {
            ForEach(Array(profiles.enumerated()), id: \.element.id) { index, profile in
                NavigationLink(value: profile) {
                    BusinessProfileRow(profile: profile)
                }
                .buttonStyle(.plain)

                if index < profiles.count - 1 {
                    Rectangle()
                        .fill(Color.gf.rule)
                        .frame(height: 1)
                }
            }
        }
    }

    // MARK: - Actions

    private func refreshIfNeeded() async {
        guard profiles.isEmpty, !isLoading else { return }
        await refresh()
    }

    private func refresh() async {
        if isLoading { return }
        isLoading = true
        loadError = nil
        defer { isLoading = false }
        do {
            profiles = try await BusinessProfileRepository.shared.list()
        } catch {
            loadError = String(describing: error)
        }
    }

    /// `business_profiles_one_default_per_user` is a partial-unique index, but
    /// the list view caches its own copy — keep it in sync after the server
    /// flips `is_default = false` on the previous default.
    private func unsetOtherDefaults(except keepId: String) {
        for i in profiles.indices where profiles[i].id != keepId && profiles[i].isDefault {
            profiles[i].isDefault = false
        }
    }
}

// MARK: - Row

private struct BusinessProfileRow: View {
    let profile: BusinessProfile

    @State private var thumbnailURL: URL? = nil

    var body: some View {
        HStack(spacing: Spacing.s3) {
            logoThumbnail

            VStack(alignment: .leading, spacing: Spacing.s1) {
                Text(displayTitle)
                    .font(.gf.body)
                    .foregroundStyle(Color.gf.fg1)
                    .lineLimit(1)
                if let subtitle = subtitle, !subtitle.isEmpty {
                    Text(subtitle)
                        .font(.gf.monoSm)
                        .foregroundStyle(Color.gf.fg3)
                        .lineLimit(1)
                }
            }

            Spacer()

            if profile.isDefault {
                GFTag(label: "DEFAULT", severity: .green)
            }

            Image(systemName: "chevron.right")
                .foregroundStyle(Color.gf.fg3)
        }
        .padding(.vertical, Spacing.s3)
        .contentShape(Rectangle())
        .task(id: profile.logoPath) {
            await loadThumbnail()
        }
    }

    private var displayTitle: String {
        if let label = profile.label?.trimmingCharacters(in: .whitespacesAndNewlines), !label.isEmpty {
            return label
        }
        if let biz = profile.businessName?.trimmingCharacters(in: .whitespacesAndNewlines), !biz.isEmpty {
            return biz
        }
        let parts = [profile.firstName, profile.familyName]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        return parts.isEmpty ? "Untitled profile" : parts.joined(separator: " ")
    }

    private var subtitle: String? {
        let parts = [profile.city, profile.countryCode]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }

    @ViewBuilder
    private var logoThumbnail: some View {
        if let url = thumbnailURL {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image.resizable().scaledToFill()
                default:
                    logoPlaceholder
                }
            }
            .frame(width: 44, height: 44)
            .background(Color.gf.surfaceElev)
            .clipShape(RoundedRectangle(cornerRadius: Radius.sharp))
            .overlay(
                RoundedRectangle(cornerRadius: Radius.sharp)
                    .stroke(Color.gf.rule, lineWidth: 1)
            )
        } else {
            logoPlaceholder
        }
    }

    private var logoPlaceholder: some View {
        ZStack {
            RoundedRectangle(cornerRadius: Radius.sharp)
                .fill(Color.gf.surfaceElev)
            RoundedRectangle(cornerRadius: Radius.sharp)
                .stroke(Color.gf.rule, lineWidth: 1)
            Image(systemName: profile.logoPath == nil ? "building.2" : "photo")
                .foregroundStyle(Color.gf.fg3)
        }
        .frame(width: 44, height: 44)
    }

    /// Resolves a 30-minute signed URL for the logo object. Silent failure
    /// falls back to the placeholder — the row still works without art.
    private func loadThumbnail() async {
        guard let path = profile.logoPath, !path.isEmpty else {
            thumbnailURL = nil
            return
        }
        do {
            let url = try await SupabaseService.shared.storage
                .from("contracts")
                .createSignedURL(path: path, expiresIn: 1800)
            thumbnailURL = url
        } catch {
            thumbnailURL = nil
        }
    }
}

#Preview {
    NavigationStack {
        BusinessProfilesView()
    }
}
