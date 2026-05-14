// Hand-written to match supabase/migrations/0001_init.sql.
// Regenerate with: supabase gen types typescript --project-id pwvtjuklkfelpxzxjmsi > lib/supabase/types.ts
// once the migration is applied and the CLI is logged in.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AccountType = "solo" | "freelancer" | "business";
export type ContractKind = "scanned" | "drafted";
export type ContractIndustry = "freelance" | "software" | "design" | "nda";
export type VerdictSeverity = "green" | "yellow" | "orange" | "red";
export type UsageEventKind = "scan" | "draft";

export type PlanId = "free" | "standard";
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "expired";
export type CreditSource = "payg_3usd" | "admin_grant";
export type PaymentProvider = "revolut" | "oxapay";
export type PaymentKind =
  | "subscription_initial"
  | "subscription_renewal"
  | "one_off"
  | "overage";
export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          account_type: AccountType | null;
          country_code: string | null;
          business_name: string | null;
          industries: string[];
          onboarded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          account_type?: AccountType | null;
          country_code?: string | null;
          business_name?: string | null;
          industries?: string[];
          onboarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          account_type?: AccountType | null;
          country_code?: string | null;
          business_name?: string | null;
          industries?: string[];
          onboarded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contracts: {
        Row: {
          id: string;
          owner_id: string;
          kind: ContractKind;
          industry: ContractIndustry | null;
          title: string | null;
          storage_path: string | null;
          verdict_severity: VerdictSeverity | null;
          created_at: string;
          retention_until: string | null;
          style: Json;
          business_profile_id: string | null;
          source_contract_id: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          kind: ContractKind;
          industry?: ContractIndustry | null;
          title?: string | null;
          storage_path?: string | null;
          verdict_severity?: VerdictSeverity | null;
          created_at?: string;
          retention_until?: string | null;
          style?: Json;
          business_profile_id?: string | null;
          source_contract_id?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          kind?: ContractKind;
          industry?: ContractIndustry | null;
          title?: string | null;
          storage_path?: string | null;
          verdict_severity?: VerdictSeverity | null;
          created_at?: string;
          retention_until?: string | null;
          style?: Json;
          business_profile_id?: string | null;
          source_contract_id?: string | null;
        };
        Relationships: [];
      };
      business_profiles: {
        Row: {
          id: string;
          owner_id: string;
          business_name: string | null;
          first_name: string | null;
          family_name: string | null;
          logo_path: string | null;
          is_default: boolean;
          label: string | null;
          created_at: string;
          // Columns owned by Phase 5 — typed as optional here so this branch
          // builds in isolation; Phase 5 will widen these to non-nullable
          // where appropriate at merge time.
          tax_id?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          country_code?: string | null;
          city?: string | null;
          street?: string | null;
          postal_code?: string | null;
        };
        Insert: {
          id?: string;
          owner_id: string;
          business_name?: string | null;
          first_name?: string | null;
          family_name?: string | null;
          logo_path?: string | null;
          is_default?: boolean;
          label?: string | null;
          created_at?: string;
          tax_id?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          country_code?: string | null;
          city?: string | null;
          street?: string | null;
          postal_code?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          business_name?: string | null;
          first_name?: string | null;
          family_name?: string | null;
          logo_path?: string | null;
          is_default?: boolean;
          label?: string | null;
          created_at?: string;
          tax_id?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          country_code?: string | null;
          city?: string | null;
          street?: string | null;
          postal_code?: string | null;
        };
        Relationships: [];
      };
      contract_versions: {
        Row: {
          id: string;
          contract_id: string;
          version: number;
          body_md: string | null;
          pdf_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          version: number;
          body_md?: string | null;
          pdf_path?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          version?: number;
          body_md?: string | null;
          pdf_path?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      scans: {
        Row: {
          id: string;
          contract_id: string;
          taxonomy: Json | null;
          verdict_md: string | null;
          redlines: Json | null;
          source_text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          contract_id: string;
          taxonomy?: Json | null;
          verdict_md?: string | null;
          redlines?: Json | null;
          source_text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          contract_id?: string;
          taxonomy?: Json | null;
          verdict_md?: string | null;
          redlines?: Json | null;
          source_text?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      usage_events: {
        Row: {
          id: number;
          user_id: string;
          kind: UsageEventKind;
          contract_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          kind: UsageEventKind;
          contract_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          kind?: UsageEventKind;
          contract_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      preview_events: {
        Row: {
          id: number;
          ip: string;
          severity: VerdictSeverity | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          ip: string;
          severity?: VerdictSeverity | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          ip?: string;
          severity?: VerdictSeverity | null;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          user_id: string;
          plan: PlanId;
          status: SubscriptionStatus;
          revolut_customer_id: string | null;
          revolut_payment_method_id: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          plan: PlanId;
          status: SubscriptionStatus;
          revolut_customer_id?: string | null;
          revolut_payment_method_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          plan?: PlanId;
          status?: SubscriptionStatus;
          revolut_customer_id?: string | null;
          revolut_payment_method_id?: string | null;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      credits: {
        Row: {
          id: string;
          user_id: string;
          contracts_remaining: number;
          expires_at: string;
          source: CreditSource;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          contracts_remaining?: number;
          expires_at: string;
          source: CreditSource;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contracts_remaining?: number;
          expires_at?: string;
          source?: CreditSource;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          revolut_order_id: string | null;
          kind: PaymentKind;
          plan: PlanId | null;
          amount_cents: number;
          currency: string;
          status: PaymentStatus;
          provider: PaymentProvider;
          oxapay_track_id: string | null;
          raw: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          revolut_order_id?: string | null;
          kind: PaymentKind;
          plan?: PlanId | null;
          amount_cents: number;
          currency?: string;
          status: PaymentStatus;
          provider?: PaymentProvider;
          oxapay_track_id?: string | null;
          raw?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          revolut_order_id?: string | null;
          kind?: PaymentKind;
          plan?: PlanId | null;
          amount_cents?: number;
          currency?: string;
          status?: PaymentStatus;
          provider?: PaymentProvider;
          oxapay_track_id?: string | null;
          raw?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          body_md: string;
          cover_image_url: string | null;
          author_name: string;
          tags: string[];
          reading_minutes: number | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description: string;
          body_md: string;
          cover_image_url?: string | null;
          author_name?: string;
          tags?: string[];
          reading_minutes?: number | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string;
          body_md?: string;
          cover_image_url?: string | null;
          author_name?: string;
          tags?: string[];
          reading_minutes?: number | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
