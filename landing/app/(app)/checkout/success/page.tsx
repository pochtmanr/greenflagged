import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutSuccessClient } from "@/components/settings/checkout-success-client";

export const metadata: Metadata = {
  title: "Confirming payment",
  description: "Confirming your Green Flagged payment.",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{
  provider?: string;
  order_id?: string;
  quantity?: string;
}>;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const provider = params.provider === "oxapay" ? "oxapay" : "revolut";
  const orderId = params.order_id ?? null;
  const quantity = (() => {
    const n = Number.parseInt(params.quantity ?? "1", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();

  // Revolut redirects land at /settings/billing?from=checkout today — preserve
  // that flow. We only poll for OxaPay (crypto needs blockchain confirmation
  // before the webhook fires). For any other provider, fall back to billing.
  if (provider !== "oxapay") {
    redirect("/settings/billing?from=checkout");
  }

  return (
    <CheckoutSuccessClient
      provider={provider}
      orderId={orderId}
      quantity={quantity}
    />
  );
}
