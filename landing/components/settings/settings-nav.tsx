import Link from "next/link";

export type SettingsTab = "profile" | "business" | "clients" | "billing";

type Item = {
  id: SettingsTab;
  label: string;
  href: string;
};

const ITEMS: Item[] = [
  { id: "profile", label: "Profile", href: "/settings" },
  { id: "business", label: "Business", href: "/settings/business" },
  { id: "clients", label: "Clients", href: "/settings/clients" },
  { id: "billing", label: "Billing", href: "/settings/billing" },
];

export function SettingsNav({ current }: { current: SettingsTab }) {
  return (
    <nav
      aria-label="Settings sections"
      className="settings__nav"
      style={{
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        borderBottom: "1px solid var(--rule)",
        paddingBottom: 4,
        marginBottom: 8,
      }}
    >
      {ITEMS.map((item) => {
        const active = item.id === current;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? "page" : undefined}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "10px 14px",
              color: active ? "var(--fg-1)" : "var(--fg-3)",
              borderBottom: active
                ? "2px solid var(--fg-1)"
                : "2px solid transparent",
              marginBottom: -1,
              transition: "color 120ms ease, border-color 120ms ease",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
