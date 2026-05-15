// ═══════════════════════════════════════════════════════════════
// Clinch — Database TypeScript Types
// Mirrors the Supabase schema. Keep in sync with migrations.
// ═══════════════════════════════════════════════════════════════

import type { SectionDataMap, SectionsConfig } from '@/templates/types';

// ── Enums ───────────────────────────────────────────────────────

export type SubscriptionTier = 'free' | 'pro';
export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'won' | 'lost';
export type InvoiceStatus = 'unpaid' | 'payment_claimed' | 'paid' | 'cancelled';
export type PaymentMethod = 'manual' | 'stripe';

// ── Profiles ────────────────────────────────────────────────────

export interface Profile {
  id: string; // uuid
  full_name: string | null;
  bio: string | null;
  services: string[];
  hourly_rate: number | null; // cents
  logo_url: string | null;
  brand_color: string;
  professional_title: string | null;
  onboarding_completed: boolean;
  stripe_customer_id: string | null;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarded: boolean;
  subscription_tier: SubscriptionTier;
  subscription_status: string;
  proposals_this_month: number;
  proposals_month_reset: string | null; // date
  default_payment_instructions: string | null;
  created_at: string; // timestamptz
  updated_at: string;
}

// ── Clients ─────────────────────────────────────────────────────

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  company: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Proposals (updated for hosted proposal system) ──────────────

export interface Proposal {
  id: string;
  user_id: string;
  client_id: string | null;
  client_name: string;
  client_email: string | null;
  project_title: string;
  project_type: string | null;
  tone: 'formal' | 'friendly' | 'bold';

  // Original AI input
  input_job_description: string | null;
  input_deliverables: string[];
  input_budget: number | null; // cents
  input_timeline: string | null;

  // ── NEW: Structured content (10-section shape) ──
  content_json: SectionDataMap | null;
  edited_content_json: SectionDataMap | null;
  sections_config: SectionsConfig;

  // ── NEW: Template & theme ──
  template_id: string;
  theme_id: string;

  // ── NEW: Hosted page token ──
  hosted_token: string; // uuid, unique

  // Core fields
  status: ProposalStatus;
  amount: number | null; // cents
  currency: string;
  expires_at: string | null; // timestamptz — proposal expiry date
  signature_data: string | null; // base64 PNG of client signature
  signer_name: string | null;
  signed_at: string | null; // timestamptz
  current_version: number;
  client_seen_version: number | null;
  created_at: string;
  updated_at: string;
}

/** Insertable proposal (omit server-generated fields) */
export type ProposalInsert = Omit<Proposal,
  | 'id'
  | 'hosted_token'
  | 'created_at'
  | 'updated_at'
  | 'sections_config'
> & {
  sections_config?: SectionsConfig;
};

/** Updatable proposal (partial, no immutable fields) */
export type ProposalUpdate = Partial<Omit<Proposal,
  | 'id'
  | 'user_id'
  | 'hosted_token'
  | 'created_at'
>>;

// ── Proposal Views ──────────────────────────────────────────────

export interface ProposalView {
  id: string;
  proposal_id: string;
  viewed_at: string;
  ip_hash: string | null;
  user_agent_hash: string | null;
  is_owner_view: boolean;
  time_on_page_seconds: number | null;
  created_at: string;
}

export type ProposalViewInsert = Omit<ProposalView, 'id' | 'created_at' | 'viewed_at'> & {
  viewed_at?: string;
};

// ── Proposal Events ─────────────────────────────────────────────

export type ProposalEventType =
  | 'section_view'
  | 'accept_click'
  | 'deposit_click'
  | 'time_on_page';

export interface ProposalEvent {
  id: string;
  proposal_id: string;
  event_type: ProposalEventType;
  section_key: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ProposalEventInsert = Omit<ProposalEvent, 'id' | 'created_at'>;

// ── Proposal Comments ───────────────────────────────────────────

export interface ProposalComment {
  id: string;
  proposal_id: string;
  section_key: string | null; // null = general question
  author_name: string;
  author_email: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export type ProposalCommentInsert = Omit<ProposalComment, 'id' | 'created_at' | 'is_read'>;

// ── Proposal Versions ───────────────────────────────────────────

export interface ProposalVersion {
  id: string;
  proposal_id: string;
  version_number: number;
  content_snapshot: Record<string, unknown>;
  sections_config_snapshot: Record<string, unknown>;
  change_summary: string;
  changed_sections: string[];
  created_at: string;
}

// ── Invoice Line Item ───────────────────────────────────────────

export interface InvoiceLineItem {
  label: string;
  amount_cents: number;
}

// ── Invoices ────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  user_id: string;
  proposal_id: string | null;
  invoice_number: string;
  client_name: string;
  client_email: string;
  line_items: InvoiceLineItem[];
  total_cents: number;
  currency: string;
  note: string | null;
  due_date: string | null; // date
  status: InvoiceStatus;
  hosted_token: string; // uuid, unique
  payment_method: PaymentMethod;
  payment_instructions: string | null;
  stripe_payment_link: string | null;
  paid_at: string | null; // timestamptz
  payment_claimed_at: string | null; // timestamptz — set when client clicks "I've Made Payment"
  created_at: string;
  updated_at: string;
}

export type InvoiceInsert = Omit<Invoice,
  | 'id'
  | 'hosted_token'
  | 'created_at'
  | 'updated_at'
  | 'paid_at'
  | 'invoice_number'
> & {
  invoice_number?: string;
  paid_at?: string | null;
};

export type InvoiceUpdate = Partial<Omit<Invoice,
  | 'id'
  | 'user_id'
  | 'hosted_token'
  | 'created_at'
  | 'invoice_number'
>>;

// ── Supabase Database Type Map ──────────────────────────────────
// Use this as the generic parameter for createClient<Database>()

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Omit<Profile, 'id'>>;
      };
      clients: {
        Row: Client;
        Insert: Omit<Client, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Client, 'id' | 'user_id'>>;
      };
      proposals: {
        Row: Proposal;
        Insert: ProposalInsert;
        Update: ProposalUpdate;
      };
      proposal_views: {
        Row: ProposalView;
        Insert: ProposalViewInsert;
        Update: Partial<Omit<ProposalView, 'id'>>;
      };
      proposal_events: {
        Row: ProposalEvent;
        Insert: ProposalEventInsert;
        Update: Partial<Omit<ProposalEvent, 'id'>>;
      };
      invoices: {
        Row: Invoice;
        Insert: InvoiceInsert;
        Update: InvoiceUpdate;
      };
    };
    Functions: {
      check_and_increment_proposal_count: {
        Args: { p_user_id: string; p_limit: number };
        Returns: { allowed: boolean; current_count: number }[];
      };
      generate_invoice_number: {
        Args: { user_uuid: string };
        Returns: string;
      };
    };
  };
}
