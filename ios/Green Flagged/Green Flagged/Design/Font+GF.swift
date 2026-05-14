import SwiftUI

extension Font {
    enum gf {}
}

extension Font.gf {
    static let display = Font.custom("Inter-Bold",       size: 64)
    static let h1      = Font.custom("Inter-Bold",       size: 48)
    static let h2      = Font.custom("Inter-Bold",       size: 32)
    static let h3      = Font.custom("Inter-SemiBold",   size: 22)
    static let h4      = Font.custom("Inter-SemiBold",   size: 18)
    static let body    = Font.custom("Inter-Regular",    size: 16)
    static let bodySm  = Font.custom("Inter-Regular",    size: 14)

    static let label   = Font.custom("JetBrainsMono-Medium",  size: 11)
    static let mono    = Font.custom("JetBrainsMono-Regular", size: 14)
    static let monoSm  = Font.custom("JetBrainsMono-Regular", size: 12)
}
