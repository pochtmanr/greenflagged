import SwiftUI

// =====================================================================
// ClientsView — Settings → Clients. CRUD list of saved counterparties,
// reused to pre-fill the "their company" side of drafted contracts.
// Mirrors landing/app/(app)/settings/clients/page.tsx (no logo column).
// =====================================================================

struct ClientsView: View {
    @State private var clients: [Client] = []
    @State private var isLoading: Bool = false
    @State private var loadError: String? = nil
    @State private var showCreate: Bool = false

    var body: some View {
        ZStack {
            Color.gf.bg.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: Spacing.s5) {
                    header

                    if isLoading && clients.isEmpty {
                        loadingRow
                    } else if let loadError {
                        errorBanner(loadError)
                    } else if clients.isEmpty {
                        emptyState
                    } else {
                        clientList
                    }
                }
                .padding(.horizontal, Spacing.s4)
                .padding(.vertical, Spacing.s5)
            }
            .refreshable { await refresh() }
        }
        .navigationTitle("CLIENTS")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { showCreate = true } label: {
                    Image(systemName: "plus")
                        .foregroundStyle(Color.gf.fg1)
                }
                .accessibilityLabel("New client")
            }
        }
        .sheet(isPresented: $showCreate) {
            NavigationStack {
                ClientEditView(client: nil) { saved in
                    clients.insert(saved, at: 0)
                    if saved.isDefault { unsetOtherDefaults(except: saved.id) }
                }
            }
        }
        .navigationDestination(for: Client.self) { client in
            ClientEditView(client: client) { saved in
                if let idx = clients.firstIndex(where: { $0.id == saved.id }) {
                    clients[idx] = saved
                }
                if saved.isDefault { unsetOtherDefaults(except: saved.id) }
            } onDelete: { id in
                clients.removeAll { $0.id == id }
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
            Text("Your clients")
                .font(.gf.h2)
                .foregroundStyle(Color.gf.fg1)
            Text("Reuse client info across draft wizards instead of retyping every time.")
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
                Text("// NO CLIENTS YET")
                    .font(.gf.label)
                    .foregroundStyle(Color.gf.fg2)
                Text("Save a client once, reuse them in every draft.")
                    .font(.gf.bodySm)
                    .foregroundStyle(Color.gf.fg3)
                GFButton(label: "ADD CLIENT", style: .solid) { showCreate = true }
            }
        }
    }

    private var clientList: some View {
        VStack(spacing: 0) {
            ForEach(Array(clients.enumerated()), id: \.element.id) { index, client in
                NavigationLink(value: client) {
                    ClientRow(client: client)
                }
                .buttonStyle(.plain)

                if index < clients.count - 1 {
                    Rectangle()
                        .fill(Color.gf.rule)
                        .frame(height: 1)
                }
            }
        }
    }

    // MARK: - Actions

    private func refreshIfNeeded() async {
        guard clients.isEmpty, !isLoading else { return }
        await refresh()
    }

    private func refresh() async {
        if isLoading { return }
        isLoading = true
        loadError = nil
        defer { isLoading = false }
        do {
            clients = try await ClientRepository.shared.list()
        } catch {
            loadError = String(describing: error)
        }
    }

    private func unsetOtherDefaults(except keepId: String) {
        for i in clients.indices where clients[i].id != keepId && clients[i].isDefault {
            clients[i].isDefault = false
        }
    }
}

// MARK: - Row

private struct ClientRow: View {
    let client: Client

    var body: some View {
        HStack(spacing: Spacing.s3) {
            ZStack {
                RoundedRectangle(cornerRadius: Radius.sharp)
                    .fill(Color.gf.surfaceElev)
                RoundedRectangle(cornerRadius: Radius.sharp)
                    .stroke(Color.gf.rule, lineWidth: 1)
                Image(systemName: "person.crop.rectangle")
                    .foregroundStyle(Color.gf.fg3)
            }
            .frame(width: 44, height: 44)

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

            if client.isDefault {
                GFTag(label: "DEFAULT", severity: .green)
            }

            Image(systemName: "chevron.right")
                .foregroundStyle(Color.gf.fg3)
        }
        .padding(.vertical, Spacing.s3)
        .contentShape(Rectangle())
    }

    private var displayTitle: String {
        if let biz = client.businessName?.trimmingCharacters(in: .whitespacesAndNewlines), !biz.isEmpty {
            return biz
        }
        let parts = [client.firstName, client.familyName]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        return parts.isEmpty ? "Untitled client" : parts.joined(separator: " ")
    }

    private var subtitle: String? {
        let parts = [client.city, client.countryCode]
            .compactMap { $0?.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        return parts.isEmpty ? nil : parts.joined(separator: " · ")
    }
}

#Preview {
    NavigationStack {
        ClientsView()
    }
}
