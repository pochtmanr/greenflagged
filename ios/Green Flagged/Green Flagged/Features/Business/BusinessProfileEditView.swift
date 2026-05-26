import PhotosUI
import SwiftUI
#if canImport(UIKit)
import UIKit
import Supabase
#endif

// =====================================================================
// BusinessProfileEditView — create + edit form.
//   • `profile == nil` → create flow (POST)
//   • `profile != nil` → edit flow (PATCH + delete + logo upload)
// Fields mirror landing/components/settings/business-profile-form.tsx.
// =====================================================================

struct BusinessProfileEditView: View {
    @Environment(\.dismiss) private var dismiss

    /// Nil when creating a new profile.
    let profile: BusinessProfile?
    /// Called with the saved row (whether new or edited).
    let onSave: (BusinessProfile) -> Void
    /// Called after a successful delete; only invoked in edit mode.
    var onDelete: ((String) -> Void)? = nil

    // Form state
    @State private var firstName: String = ""
    @State private var familyName: String = ""
    @State private var businessName: String = ""
    @State private var label: String = ""
    @State private var taxId: String = ""
    @State private var email: String = ""
    @State private var phone: String = ""
    @State private var website: String = ""
    @State private var countryCode: String = ""
    @State private var city: String = ""
    @State private var street: String = ""
    @State private var postalCode: String = ""
    @State private var isDefault: Bool = false
    @State private var logoPath: String? = nil

    // UI state
    @State private var isSaving: Bool = false
    @State private var saveError: String? = nil
    @State private var didJustSave: Bool = false
    @State private var photoItem: PhotosPickerItem? = nil
    @State private var isUploadingLogo: Bool = false
    @State private var logoError: String? = nil
    @State private var logoPreviewURL: URL? = nil
    @State private var showDeleteConfirm: Bool = false
    @State private var isDeleting: Bool = false

    private var isEditing: Bool { profile != nil }

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    header
                    logoSection
                    identitySection
                    contactSection
                    addressSection
                    defaultSection

                    if let saveError {
                        errorBanner(saveError)
                    }

                    saveButton

                    if isEditing {
                        dangerZone
                    }
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
            }
        }
        .navigationTitle(isEditing ? "EDIT PROFILE" : "NEW PROFILE")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar { cancelToolbar }
        .onAppear(perform: hydrate)
        .onChange(of: photoItem) { _, newItem in
            if let newItem { Task { await handlePhotoPick(newItem) } }
        }
        .alert("Delete this profile?", isPresented: $showDeleteConfirm) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) { Task { await deleteProfile() } }
        } message: {
            Text("Contracts using this profile will keep working — they just won't autofill from it anymore.")
        }
    }

    // MARK: - Toolbar

    /// Only injected in the create-as-sheet flow. When the view is pushed via
    /// NavigationLink for editing, the system back chevron is the right cancel
    /// affordance and a `topBarLeading` item here would override it.
    @ToolbarContentBuilder
    private var cancelToolbar: some ToolbarContent {
        if !isEditing {
            ToolbarItem(placement: .topBarLeading) {
                Button("Cancel") { dismiss() }
                    .foregroundStyle(Color.gf.fg2)
            }
        }
    }

    // MARK: - Header

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text(isEditing ? "// EDIT" : "// NEW")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)
            Text(isEditing ? "Edit business profile" : "Add a business profile")
                .font(.gf.h2)
                .foregroundStyle(Color.gf.fg1)
        }
    }

    // MARK: - Logo

    private var logoSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("LOGO")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.fg2)

                HStack(spacing: Spacing.s3) {
                    logoPreview

                    VStack(alignment: .leading, spacing: Spacing.s2) {
                        if isEditing {
                            PhotosPicker(
                                selection: $photoItem,
                                matching: .images,
                                photoLibrary: .shared()
                            ) {
                                HStack(spacing: Spacing.s2) {
                                    Image(systemName: "photo")
                                    Text(isUploadingLogo ? "UPLOADING…" : "UPLOAD LOGO")
                                        .font(.gf.label)
                                        .tracking(1.0)
                                }
                                .padding(.horizontal, Spacing.s4)
                                .padding(.vertical, Spacing.s3)
                                .frame(maxWidth: .infinity)
                                .background(Color.gf.fg1)
                                .foregroundStyle(Color.gf.bg)
                                .clipShape(RoundedRectangle(cornerRadius: Radius.sharp))
                            }
                            .disabled(isUploadingLogo)
                            .opacity(isUploadingLogo ? 0.5 : 1.0)
                        } else {
                            Text("Save the profile first, then come back to upload a logo.")
                                .font(.gf.bodySm)
                                .foregroundStyle(Color.gf.fg3)
                                .fixedSize(horizontal: false, vertical: true)
                        }

                        if let logoError {
                            GFTag(label: logoError.uppercased(), severity: .red)
                        }
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var logoPreview: some View {
        if let url = logoPreviewURL {
            AsyncImage(url: url) { phase in
                switch phase {
                case .success(let image):
                    image.resizable().scaledToFill()
                default:
                    logoPlaceholder
                }
            }
            .frame(width: 72, height: 72)
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
            Image(systemName: "building.2")
                .foregroundStyle(Color.gf.fg3)
        }
        .frame(width: 72, height: 72)
    }

    // MARK: - Identity

    private var identitySection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                sectionHeader("IDENTITY")
                labeledRow("LABEL (OPTIONAL)") {
                    GFInput(placeholder: "e.g. Acme LLC EU", text: $label)
                }
                labeledRow("FIRST NAME") {
                    GFInput(placeholder: "First name", text: $firstName)
                }
                labeledRow("FAMILY NAME") {
                    GFInput(placeholder: "Family name", text: $familyName)
                }
                labeledRow("BUSINESS NAME (OPTIONAL)") {
                    GFInput(placeholder: "Business name", text: $businessName)
                }
                labeledRow("TAX ID (OPTIONAL)") {
                    GFInput(placeholder: "Tax ID / VAT", text: $taxId)
                }
            }
        }
    }

    // MARK: - Contact

    private var contactSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                sectionHeader("CONTACT")
                labeledRow("EMAIL (OPTIONAL)") {
                    GFInput(placeholder: "you@example.com", text: $email,
                            keyboard: .emailAddress, textContentType: .emailAddress)
                }
                labeledRow("PHONE (OPTIONAL)") {
                    GFInput(placeholder: "Phone", text: $phone,
                            keyboard: .phonePad, textContentType: .telephoneNumber)
                }
                labeledRow("WEBSITE (OPTIONAL)") {
                    GFInput(placeholder: "https://example.com", text: $website,
                            keyboard: .URL, textContentType: .URL)
                }
            }
        }
    }

    // MARK: - Address

    private var addressSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                sectionHeader("ADDRESS")
                labeledRow("STREET") {
                    GFInput(placeholder: "Street + number", text: $street)
                }
                labeledRow("CITY") {
                    GFInput(placeholder: "City", text: $city)
                }
                labeledRow("POSTAL CODE") {
                    GFInput(placeholder: "Postal / ZIP", text: $postalCode)
                }
                labeledRow("COUNTRY (ISO-2)") {
                    Picker("Country", selection: $countryCode) {
                        Text("— Select —").tag("")
                        ForEach(AddressCountry.options, id: \.code) { country in
                            Text("\(country.flag)  \(country.name)  ·  \(country.code)")
                                .tag(country.code)
                        }
                    }
                    .pickerStyle(.menu)
                    .tint(Color.gf.fg1)
                    .padding(.horizontal, Spacing.s3)
                    .padding(.vertical, Spacing.s2)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.gf.surfaceElev)
                    .overlay(
                        RoundedRectangle(cornerRadius: Radius.sharp)
                            .stroke(Color.gf.rule, lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: Radius.sharp))
                }
            }
        }
    }

    // MARK: - Default toggle

    private var defaultSection: some View {
        GFCard {
            Toggle(isOn: $isDefault) {
                VStack(alignment: .leading, spacing: Spacing.s1) {
                    Text("SET AS DEFAULT")
                        .font(.gf.label)
                        .tracking(1.0)
                        .foregroundStyle(Color.gf.fg2)
                    Text("Pre-selected in the draft wizard.")
                        .font(.gf.bodySm)
                        .foregroundStyle(Color.gf.fg3)
                }
            }
            .tint(Color.gf.accent)
        }
    }

    // MARK: - Save / Delete

    private var saveButton: some View {
        GFButton(
            label: didJustSave ? "SAVED" : (isSaving ? "SAVING…" : (isEditing ? "SAVE CHANGES" : "CREATE PROFILE")),
            style: .solid,
            isDisabled: isSaving
        ) {
            Task { await save() }
        }
    }

    private var dangerZone: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                Text("DANGER ZONE")
                    .font(.gf.label)
                    .tracking(1.0)
                    .foregroundStyle(Color.gf.sevRed)
                Text("Deleting this profile won't delete contracts that used it — they'll just lose the autofill link.")
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg3)
                    .fixedSize(horizontal: false, vertical: true)
                GFButton(
                    label: isDeleting ? "DELETING…" : "DELETE THIS PROFILE",
                    style: .ghost,
                    showsArrow: false,
                    isDisabled: isDeleting
                ) {
                    showDeleteConfirm = true
                }
            }
        }
    }

    private func errorBanner(_ message: String) -> some View {
        GFErrorBanner(message: message)
    }

    // MARK: - Subviews

    private func sectionHeader(_ text: String) -> some View {
        Text(text)
            .font(.gf.label)
            .tracking(1.0)
            .foregroundStyle(Color.gf.fg2)
    }

    @ViewBuilder
    private func labeledRow<Content: View>(
        _ label: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: Spacing.s1) {
            Text("// \(label)")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg4)
            content()
        }
    }

    // MARK: - Hydrate

    private func hydrate() {
        guard let profile else { return }
        firstName    = profile.firstName ?? ""
        familyName   = profile.familyName ?? ""
        businessName = profile.businessName ?? ""
        label        = profile.label ?? ""
        taxId        = profile.taxId ?? ""
        email        = profile.email ?? ""
        phone        = profile.phone ?? ""
        website      = profile.website ?? ""
        countryCode  = profile.countryCode ?? ""
        city         = profile.city ?? ""
        street       = profile.street ?? ""
        postalCode   = profile.postalCode ?? ""
        isDefault    = profile.isDefault
        logoPath     = profile.logoPath
        Task { await refreshLogoPreview() }
    }

    // MARK: - Save

    private func save() async {
        guard !isSaving else { return }
        saveError = nil
        isSaving = true
        defer { isSaving = false }

        let input = BusinessProfileInput(
            firstName:    trimmedOrNil(firstName),
            familyName:   trimmedOrNil(familyName),
            businessName: trimmedOrNil(businessName),
            taxId:        trimmedOrNil(taxId),
            email:        trimmedOrNil(email),
            phone:        trimmedOrNil(phone),
            website:      trimmedOrNil(website),
            countryCode:  trimmedOrNil(countryCode),
            city:         trimmedOrNil(city),
            street:       trimmedOrNil(street),
            postalCode:   trimmedOrNil(postalCode),
            label:        trimmedOrNil(label),
            isDefault:    isDefault
        )

        do {
            let saved: BusinessProfile
            if let profile {
                saved = try await BusinessProfileRepository.shared.update(id: profile.id, with: input)
            } else {
                saved = try await BusinessProfileRepository.shared.create(input)
            }
            didJustSave = true
            onSave(saved)
            if !isEditing {
                // Close the create sheet; user can re-open to upload a logo.
                dismiss()
            }
        } catch {
            saveError = String(describing: error)
        }
    }

    // MARK: - Delete

    private func deleteProfile() async {
        guard let profile, !isDeleting else { return }
        isDeleting = true
        defer { isDeleting = false }
        do {
            try await BusinessProfileRepository.shared.delete(id: profile.id)
            onDelete?(profile.id)
            dismiss()
        } catch {
            saveError = String(describing: error)
        }
    }

    // MARK: - Logo handling

    /// PhotosPicker → Data → downscale to ≤ 1024px longest side at JPEG 0.6 →
    /// POST. The server enforces a hard 500 KB cap, so we also bail locally if
    /// the compressed payload exceeds that.
    private func handlePhotoPick(_ item: PhotosPickerItem) async {
        guard let profile else { return }
        logoError = nil
        isUploadingLogo = true
        defer {
            isUploadingLogo = false
            photoItem = nil
        }

        let raw: Data
        do {
            guard let data = try await item.loadTransferable(type: Data.self) else {
                logoError = "Could not read image"
                return
            }
            raw = data
        } catch {
            logoError = error.localizedDescription
            return
        }

        guard let image = UIImage(data: raw) else {
            logoError = "Unsupported image"
            return
        }

        guard let compressed = Self.compressLogo(image: image) else {
            logoError = "Could not compress image"
            return
        }
        if compressed.count > 500 * 1024 {
            logoError = "Image still too large — try a smaller photo"
            return
        }

        do {
            let newPath = try await BusinessProfileRepository.shared.uploadLogo(
                profileId: profile.id,
                imageData: compressed,
                mimeType: "image/jpeg"
            )
            logoPath = newPath
            await refreshLogoPreview()
            // Update the parent's row by reporting the patched profile back.
            var updated = profile
            updated.logoPath = newPath
            onSave(updated)
        } catch {
            logoError = String(describing: error)
        }
    }

    private func refreshLogoPreview() async {
        guard let path = logoPath, !path.isEmpty else {
            logoPreviewURL = nil
            return
        }
        do {
            let url = try await SupabaseService.shared.storage
                .from("contracts")
                .createSignedURL(path: path, expiresIn: 1800)
            logoPreviewURL = url
        } catch {
            logoPreviewURL = nil
        }
    }

    /// Downscale to max 1024px longest side, then JPEG at quality 0.6.
    /// `UIGraphicsImageRenderer` rasterizes on the main thread but the work
    /// is bounded (≤ 1024² pixels), so it's fine for a one-shot operation.
    nonisolated static func compressLogo(image: UIImage) -> Data? {
        let maxSide: CGFloat = 1024
        let original = image.size
        let scale: CGFloat = {
            let longest = max(original.width, original.height)
            return longest > maxSide ? maxSide / longest : 1.0
        }()
        let targetSize = CGSize(
            width: floor(original.width * scale),
            height: floor(original.height * scale)
        )

        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        format.opaque = false
        let renderer = UIGraphicsImageRenderer(size: targetSize, format: format)
        let resized = renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: targetSize))
        }
        return resized.jpegData(compressionQuality: 0.6)
    }

    // MARK: - Helpers

    private func trimmedOrNil(_ s: String) -> String? {
        let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : t
    }
}

#Preview {
    NavigationStack {
        BusinessProfileEditView(profile: nil) { _ in }
    }
}
