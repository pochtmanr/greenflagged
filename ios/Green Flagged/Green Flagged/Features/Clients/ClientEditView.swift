import SwiftUI

// =====================================================================
// ClientEditView — create + edit form for a client (counterparty preset).
// Same shape as BusinessProfileEditView minus the logo upload, tax_id,
// website, and label fields. Adds a free-text `notes` field.
// =====================================================================

struct ClientEditView: View {
    @Environment(\.dismiss) private var dismiss

    /// Nil when creating.
    let client: Client?
    let onSave: (Client) -> Void
    var onDelete: ((String) -> Void)? = nil

    @State private var firstName: String = ""
    @State private var familyName: String = ""
    @State private var businessName: String = ""
    @State private var email: String = ""
    @State private var phone: String = ""
    @State private var countryCode: String = ""
    @State private var city: String = ""
    @State private var street: String = ""
    @State private var postalCode: String = ""
    @State private var notes: String = ""
    @State private var isDefault: Bool = false

    @State private var isSaving: Bool = false
    @State private var saveError: String? = nil
    @State private var didJustSave: Bool = false
    @State private var showDeleteConfirm: Bool = false
    @State private var isDeleting: Bool = false

    private var isEditing: Bool { client != nil }

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    header
                    identitySection
                    contactSection
                    addressSection
                    notesSection
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
        .navigationTitle(isEditing ? "EDIT CLIENT" : "NEW CLIENT")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            // Only the create-as-sheet flow needs an explicit Cancel. When
            // pushed for editing, overriding `topBarLeading` would hide the
            // system back chevron.
            if !isEditing {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(Color.gf.fg2)
                }
            }
        }
        .onAppear(perform: hydrate)
        .alert("Delete this client?", isPresented: $showDeleteConfirm) {
            Button("Cancel", role: .cancel) {}
            Button("Delete", role: .destructive) { Task { await deleteClient() } }
        } message: {
            Text("This won't touch any contracts already drafted for this client.")
        }
    }

    // MARK: - Sections

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text(isEditing ? "// EDIT" : "// NEW")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)
            Text(isEditing ? "Edit client" : "Add a client")
                .font(.gf.h2)
                .foregroundStyle(Color.gf.fg1)
        }
    }

    private var identitySection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                sectionHeader("IDENTITY")
                labeledRow("FIRST NAME") {
                    GFInput(placeholder: "First name", text: $firstName)
                }
                labeledRow("FAMILY NAME") {
                    GFInput(placeholder: "Family name", text: $familyName)
                }
                labeledRow("BUSINESS NAME (OPTIONAL)") {
                    GFInput(placeholder: "Business name", text: $businessName)
                }
            }
        }
    }

    private var contactSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                sectionHeader("CONTACT")
                labeledRow("EMAIL (OPTIONAL)") {
                    GFInput(placeholder: "client@example.com", text: $email,
                            keyboard: .emailAddress, textContentType: .emailAddress)
                }
                labeledRow("PHONE (OPTIONAL)") {
                    GFInput(placeholder: "Phone", text: $phone,
                            keyboard: .phonePad, textContentType: .telephoneNumber)
                }
            }
        }
    }

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

    private var notesSection: some View {
        GFCard {
            VStack(alignment: .leading, spacing: Spacing.s3) {
                sectionHeader("NOTES (OPTIONAL)")
                GFFrame {
                    TextEditor(text: $notes)
                        .font(.gf.body)
                        .foregroundStyle(Color.gf.fg1)
                        .scrollContentBackground(.hidden)
                        .frame(minHeight: 100)
                }
            }
        }
    }

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

    private var saveButton: some View {
        GFButton(
            label: didJustSave ? "SAVED" : (isSaving ? "SAVING…" : (isEditing ? "SAVE CHANGES" : "CREATE CLIENT")),
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
                Text("Deleting this client doesn't touch any contracts you already drafted for them.")
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg3)
                    .fixedSize(horizontal: false, vertical: true)
                GFButton(
                    label: isDeleting ? "DELETING…" : "DELETE THIS CLIENT",
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
        guard let client else { return }
        firstName    = client.firstName ?? ""
        familyName   = client.familyName ?? ""
        businessName = client.businessName ?? ""
        email        = client.email ?? ""
        phone        = client.phone ?? ""
        countryCode  = client.countryCode ?? ""
        city         = client.city ?? ""
        street       = client.street ?? ""
        postalCode   = client.postalCode ?? ""
        notes        = client.notes ?? ""
        isDefault    = client.isDefault
    }

    // MARK: - Save

    private func save() async {
        guard !isSaving else { return }
        saveError = nil
        isSaving = true
        defer { isSaving = false }

        let input = ClientInput(
            firstName:    trimmedOrNil(firstName),
            familyName:   trimmedOrNil(familyName),
            businessName: trimmedOrNil(businessName),
            email:        trimmedOrNil(email),
            phone:        trimmedOrNil(phone),
            countryCode:  trimmedOrNil(countryCode),
            city:         trimmedOrNil(city),
            street:       trimmedOrNil(street),
            postalCode:   trimmedOrNil(postalCode),
            notes:        trimmedOrNil(notes),
            isDefault:    isDefault
        )

        do {
            let saved: Client
            if let client {
                saved = try await ClientRepository.shared.update(id: client.id, with: input)
            } else {
                saved = try await ClientRepository.shared.create(input)
            }
            didJustSave = true
            onSave(saved)
            if !isEditing { dismiss() }
        } catch {
            saveError = String(describing: error)
        }
    }

    // MARK: - Delete

    private func deleteClient() async {
        guard let client, !isDeleting else { return }
        isDeleting = true
        defer { isDeleting = false }
        do {
            try await ClientRepository.shared.delete(id: client.id)
            onDelete?(client.id)
            dismiss()
        } catch {
            saveError = String(describing: error)
        }
    }

    private func trimmedOrNil(_ s: String) -> String? {
        let t = s.trimmingCharacters(in: .whitespacesAndNewlines)
        return t.isEmpty ? nil : t
    }
}

#Preview {
    NavigationStack {
        ClientEditView(client: nil) { _ in }
    }
}
