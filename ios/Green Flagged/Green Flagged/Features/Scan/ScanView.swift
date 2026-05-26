import SwiftUI
import UniformTypeIdentifiers
#if canImport(UIKit)
import UIKit
import VisionKit
#endif

struct ScanView: View {
    @Environment(Session.self) private var session
    @Environment(EntitlementGate.self) private var gate
    @State private var vm = ScanViewModel()
    @State private var showFilePicker = false
    @State private var showDocScanner = false
    @State private var doneContractId: String?

    var body: some View {
        @Bindable var vm = vm
        ScrollView {
            VStack(alignment: .leading, spacing: Spacing.s5) {
                header

                HStack(spacing: Spacing.s2) {
                    modeButton(.upload, label: "UPLOAD")
                    modeButton(.paste, label: "PASTE TEXT")
                    modeButton(.scanPaper, label: "SCAN PAPER")
                }

                switch vm.mode {
                case .upload:
                    if case .ready(let filename, let sizeBytes) = vm.state {
                        readyFileCard(filename: filename, sizeBytes: sizeBytes)
                    } else {
                        Button {
                            showFilePicker = true
                        } label: {
                            GFFrame {
                                VStack(spacing: Spacing.s3) {
                                    Image(systemName: "arrow.up.doc.fill")
                                        .font(.system(size: 32))
                                        .foregroundStyle(Color.gf.fg2)
                                    Text("Tap to choose a PDF or DOCX")
                                        .font(.gf.bodySm)
                                        .foregroundStyle(Color.gf.fg3)
                                }
                                .frame(maxWidth: .infinity, minHeight: 220)
                            }
                        }
                        .buttonStyle(.plain)
                    }

                case .paste:
                    GFFrame {
                        TextEditor(text: $vm.pastedText)
                            .font(.gf.body)
                            .foregroundStyle(Color.gf.fg1)
                            .scrollContentBackground(.hidden)
                            .background(Color.gf.surfaceElev)
                            .frame(minHeight: 320)
                    }
                    .onChange(of: vm.pastedText) { _, newValue in
                        if newValue.isEmpty {
                            vm.state = .idle
                        } else {
                            vm.state = .ready(
                                filename: "pasted text",
                                sizeBytes: newValue.utf8.count
                            )
                        }
                    }

                case .scanPaper:
                    #if canImport(UIKit)
                    GFButton(label: "OPEN CAMERA", style: .solid) {
                        showDocScanner = true
                    }
                    #else
                    GFFrame {
                        Text("Document scanning is only available on iOS.")
                            .font(.gf.bodySm)
                            .foregroundStyle(Color.gf.fg2)
                            .frame(maxWidth: .infinity, minHeight: 120, alignment: .center)
                    }
                    #endif
                }

                GFSpecRow(key: "STATUS", value: statusLabel, valueColor: statusColor)

                VStack(spacing: Spacing.s3) {
                    GFButton(
                        label: "SCAN CONTRACT",
                        style: .solid,
                        isDisabled: !vm.canSubmit
                    ) {
                        Task { await vm.submit() }
                    }

                    if case .error = vm.state {
                        GFButton(label: "TRY AGAIN", style: .ghost, showsArrow: false) {
                            resetAfterError()
                        }
                    }
                }
            }
            .padding(.horizontal, Spacing.s4)
            .padding(.vertical, Spacing.s5)
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .background(Color.gf.bg.ignoresSafeArea())
        .fileImporter(
            isPresented: $showFilePicker,
            allowedContentTypes: [
                .pdf,
                .plainText,
                UTType("org.openxmlformats.wordprocessingml.document")!
            ]
        ) { result in
            handleFilePick(result)
        }
        #if canImport(UIKit)
        .sheet(isPresented: $showDocScanner) {
            DocScannerSheet(
                onComplete: handleScan,
                onCancel: { vm.state = .idle },
                onError: { vm.state = .error($0.localizedDescription) }
            )
        }
        #endif
        .task { vm.session = session }
        .onChange(of: vm.state) { _, newState in
            if case .done(let id) = newState {
                doneContractId = id
            }
        }
        .fullScreenCover(
            isPresented: Binding(
                get: { doneContractId != nil },
                set: { presenting in
                    if !presenting {
                        doneContractId = nil
                        vm.pickedFileURL = nil
                        vm.pastedText = ""
                        vm.state = .idle
                    }
                }
            )
        ) {
            if let id = doneContractId {
                NavigationStack {
                    ContractDetailView(contractId: id)
                        .toolbar {
                            ToolbarItem(placement: .topBarLeading) {
                                Button("Done") {
                                    doneContractId = nil
                                    vm.pickedFileURL = nil
                                    vm.pastedText = ""
                                    vm.state = .idle
                                }
                                .tint(Color.gf.fg1)
                            }
                        }
                }
            }
        }
        .fullScreenCover(isPresented: $vm.presentPaywall, onDismiss: {
            // Re-check entitlement so a fresh purchase unblocks the next submit.
            Task { await gate.refresh(reason: .purchaseCompleted) }
        }) {
            BillingPaywallView()
        }
    }

    private func readyFileCard(filename: String, sizeBytes: Int) -> some View {
        GFFrame {
            HStack(spacing: Spacing.s3) {
                Text(filename)
                    .font(.gf.mono)
                    .foregroundStyle(Color.gf.fg1)
                    .lineLimit(1)
                    .truncationMode(.middle)
                Spacer(minLength: Spacing.s2)
                Text(Self.formattedSize(sizeBytes))
                    .font(.gf.monoSm)
                    .foregroundStyle(Color.gf.fg3)
                    .fixedSize()
                GFButton(label: "REMOVE", style: .link, showsArrow: false) {
                    vm.pickedFileURL = nil
                    vm.state = .idle
                }
                .fixedSize()
            }
            .frame(maxWidth: .infinity, minHeight: 80)
        }
    }

    private var header: some View {
        VStack(alignment: .leading, spacing: Spacing.s2) {
            Text("// SCAN")
                .font(.gf.label)
                .tracking(1.0)
                .foregroundStyle(Color.gf.fg2)
            Text("Scan a contract")
                .font(.gf.h1)
                .foregroundStyle(Color.gf.fg1)
            Text("Drop a PDF, paste the text, or photograph the paper. Verdict in under two minutes.")
                .font(.gf.bodySm)
                .foregroundStyle(Color.gf.fg2)
        }
    }

    private func modeButton(_ mode: ScanMode, label: String) -> some View {
        GFButton(
            label: label,
            style: vm.mode == mode ? .solid : .ghost,
            showsArrow: false
        ) {
            switchMode(to: mode)
        }
    }

    private func switchMode(to next: ScanMode) {
        guard vm.mode != next else { return }
        switch vm.mode {
        case .upload: vm.pickedFileURL = nil
        case .paste: vm.pastedText = ""
        case .scanPaper: vm.pickedFileURL = nil
        }
        vm.mode = next
        vm.state = .idle
    }

    private func handleFilePick(_ result: Result<URL, Error>) {
        switch result {
        case .success(let url):
            let didStart = url.startAccessingSecurityScopedResource()
            defer { if didStart { url.stopAccessingSecurityScopedResource() } }
            do {
                let values = try url.resourceValues(forKeys: [.fileSizeKey, .nameKey])
                let size = values.fileSize ?? 0
                let name = values.name ?? url.lastPathComponent
                vm.pickedFileURL = url
                vm.state = .ready(filename: name, sizeBytes: size)
            } catch {
                vm.state = .error(error.localizedDescription)
            }
        case .failure(let error):
            vm.state = .error(error.localizedDescription)
        }
    }

    private func handleScan(_ scan: VNDocumentCameraScan) {
        do {
            let url = try writePDF(from: scan)
            let values = try url.resourceValues(forKeys: [.fileSizeKey, .nameKey])
            let size = values.fileSize ?? 0
            let name = values.name ?? url.lastPathComponent
            vm.pickedFileURL = url
            vm.state = .ready(filename: name, sizeBytes: size)
        } catch {
            vm.state = .error(error.localizedDescription)
        }
    }

    private func writePDF(from scan: VNDocumentCameraScan) throws -> URL {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("scan-\(UUID().uuidString).pdf")
        let renderer = UIGraphicsPDFRenderer(bounds: .zero)
        try renderer.writePDF(to: url) { ctx in
            for i in 0..<scan.pageCount {
                let image = scan.imageOfPage(at: i)
                let bounds = CGRect(origin: .zero, size: image.size)
                ctx.beginPage(withBounds: bounds, pageInfo: [:])
                image.draw(in: bounds)
            }
        }
        return url
    }

    private func resetAfterError() {
        switch vm.mode {
        case .upload, .scanPaper: vm.pickedFileURL = nil
        case .paste: vm.pastedText = ""
        }
        vm.state = .idle
    }

    private var statusLabel: String {
        switch vm.state {
        case .idle:
            return "WAITING FOR FILE"
        case .ready(_, let bytes):
            return "READY · \(Self.formattedSize(bytes))"
        case .uploading:
            return "UPLOADING…"
        case .reviewing:
            return "REVIEWING WITH AI…"
        case .done:
            return "DONE"
        case .error(let msg):
            return "ERROR · \(msg.uppercased())"
        }
    }

    private var statusColor: Color {
        switch vm.state {
        case .error: return Color.gf.sevRed
        case .done: return Color.gf.sevGreen
        default: return Color.gf.fg1
        }
    }

    private static func formattedSize(_ bytes: Int) -> String {
        let f = ByteCountFormatter()
        f.allowedUnits = [.useKB, .useMB]
        f.countStyle = .file
        return f.string(fromByteCount: Int64(bytes))
    }
}

private enum ScanMode { case upload, paste, scanPaper }

private enum ScanState: Equatable {
    case idle
    case ready(filename: String, sizeBytes: Int)
    case uploading
    case reviewing
    case done(contractId: String)
    case error(String)
}

@MainActor
@Observable
private final class ScanViewModel {
    var mode: ScanMode = .upload
    var pastedText: String = ""
    var pickedFileURL: URL? = nil
    var state: ScanState = .idle
    var session: Session?
    var presentPaywall: Bool = false

    var canSubmit: Bool {
        if case .ready = state { return true }
        return false
    }

    func submit() async {
        guard let session else {
            state = .error("SESSION NOT READY")
            return
        }

        let fileURL: URL?
        let text: String?
        switch mode {
        case .upload, .scanPaper:
            fileURL = pickedFileURL
            text = nil
        case .paste:
            fileURL = nil
            text = pastedText
        }

        if fileURL == nil && (text?.isEmpty ?? true) {
            state = .error("NOTHING TO SCAN")
            return
        }

        state = .uploading

        let ownerId: String
        do {
            ownerId = try await session.currentUserId()
        } catch {
            state = .error("SESSION EXPIRED — SIGN IN AGAIN")
            await session.signOut()
            return
        }

        state = .reviewing

        do {
            let contractId = try await ScanService.shared.scan(
                fileURL: fileURL,
                pastedText: text,
                ownerId: ownerId
            )
            NotificationCenter.default.post(
                name: ContractRepository.contractsChanged,
                object: nil
            )
            state = .done(contractId: contractId)
        } catch let error as ScanServiceError {
            state = .error(error.description.uppercased())
        } catch {
            state = .error(error.localizedDescription.uppercased())
        }
    }
}

#if canImport(UIKit)
private struct DocScannerSheet: UIViewControllerRepresentable {
    var onComplete: (VNDocumentCameraScan) -> Void
    var onCancel: () -> Void
    var onError: (Error) -> Void

    func makeUIViewController(context: Context) -> VNDocumentCameraViewController {
        let vc = VNDocumentCameraViewController()
        vc.delegate = context.coordinator
        return vc
    }

    func updateUIViewController(_ uiViewController: VNDocumentCameraViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    final class Coordinator: NSObject, VNDocumentCameraViewControllerDelegate {
        let parent: DocScannerSheet
        init(_ parent: DocScannerSheet) { self.parent = parent }

        func documentCameraViewController(
            _ controller: VNDocumentCameraViewController,
            didFinishWith scan: VNDocumentCameraScan
        ) {
            controller.dismiss(animated: true)
            parent.onComplete(scan)
        }

        func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
            controller.dismiss(animated: true)
            parent.onCancel()
        }

        func documentCameraViewController(
            _ controller: VNDocumentCameraViewController,
            didFailWithError error: Error
        ) {
            controller.dismiss(animated: true)
            parent.onError(error)
        }
    }
}
#endif

#Preview {
    ScanView()
        .environment(Session())
}
