/**
 * Shapes the Reeload API sends (snake_case on the wire). Money arrives as strings like "15000.00"
 * and is only present for Admin, Sales and Accounts.
 */
export type Role = "admin" | "sales" | "ops" | "reelmaker" | "accounts";

export type JobStatus =
  | "lead" | "draft" | "confirmed" | "assigned" | "accepted" | "reached"
  | "uploaded" | "released" | "paid" | "delivered" | "closed" | "cancelled";

export type PaymentMethod = "upi" | "bank_transfer" | "cash";
export type ContactOutcome = "spoken" | "follow_up" | "approved" | "rejected";
export type Money = string | number | null;

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string;
  role: Role;
  active: boolean;
}

export interface UserRow extends Profile {
  created_at: string;
  kind: "full_time" | "freelance" | null;
  base_city: string | null;
}

export interface Assignment {
  id: string;
  reelmaker_id: string;
  status: "pending" | "accepted" | "declined" | "cancelled";
  full_name: string;
}

export interface Job {
  id: string;
  code: string;
  status: JobStatus;
  city: string;
  address: string | null;
  maps_url: string | null;
  starts_at: string | null;
  duration_minutes: number | null;
  onsite_contact_name: string | null;
  onsite_contact_phone: string | null;
  brief: string | null;
  consent: boolean;
  confirmed_at: string | null;
  created_at: string;
  client_name: string;
  client_phone: string;
  agreed_amount?: Money;
  assignments: Assignment[];
}

export interface Paged<T> {
  items: T[];
  total: number;
}

export interface QueueJob extends Job {
  flagged: boolean;
  hours_to_start: number | null;
  last_release: { reelmaker: string; status: string; reason: string | null; at: string } | null;
}

export interface AssignQueue {
  unassigned: QueueJob[];
  flagged: number;
  awaiting_reply: { id: string; code: string; city: string; starts_at: string | null; client_name: string; assignment_id: string; reelmaker: string; assigned_at: string }[];
}

export interface Candidate {
  id: string;
  full_name: string;
  phone: string | null;
  kind: "full_time" | "freelance";
  base_city: string;
  same_city: boolean;
  availability: "free" | "busy" | "leave";
  shoots_next7_days: number;
}

export interface Reelmaker {
  id: string;
  full_name: string;
  phone: string | null;
  active: boolean;
  kind: "full_time" | "freelance";
  base_city: string;
}

export interface LeaveRow {
  id: string;
  reelmaker_id: string;
  reelmaker_name?: string;
  starts_at: string;
  ends_at: string;
  note: string | null;
}

export interface Shoot {
  assignment_id: string;
  assignment_status: Assignment["status"];
  reason: string | null;
  job_id: string;
  code: string;
  status: JobStatus;
  city: string;
  address: string | null;
  maps_url: string | null;
  starts_at: string | null;
  duration_minutes: number | null;
  onsite_contact_name: string | null;
  onsite_contact_phone: string | null;
  brief: string | null;
  client_name: string;
  extra_minutes: number;
}

export interface CheckinState {
  step: "not_started" | "code_sent" | "photos" | "done";
  sends_left: number;
  resend_in_seconds: number;
  attempts_left?: number;
}

export interface CheckinPending {
  checkin_id: string;
  job_id: string;
  code: string;
  city: string;
  starts_at: string | null;
  reelmaker: string;
  requested_at: string;
  otp_sends: number;
  otp_attempts: number;
  release_in_seconds: number;
}

export interface UploadRow {
  id: string;
  kind: "raw" | "edited" | "proof";
  file_name: string;
  content_type: string | null;
  size_bytes: number;
  status: "uploading" | "complete" | "aborted" | "deleted";
  created_at: string;
  uploaded_by_name: string;
  on_behalf_of_name: string | null;
}

export interface ReviewRow {
  id: string;
  code: string;
  status: JobStatus;
  city: string;
  starts_at: string;
  client_name: string;
  ends_at: string;
  raw_due: string;
  edited_due: string;
  raw_files: number;
  edited_files: number;
  reelmaker: string | null;
  raw_overdue: boolean;
  edited_overdue: boolean;
}

export interface LedgerRow {
  id: string;
  code: string;
  status: JobStatus;
  starts_at: string | null;
  city: string;
  client_name: string;
  agreed_amount: Money;
  approved_changes: Money;
  advance: Money;
  received: Money;
  balance: Money;
}

export interface PaymentRow {
  id: string;
  amount: Money;
  method: PaymentMethod;
  reference: string | null;
  is_advance: boolean;
  received_at: string;
  recorded_by_name: string | null;
}

export interface JobPayments {
  summary: LedgerRow;
  payments: PaymentRow[];
}

export interface Receipt {
  receipt_no: string;
  issued_at: string;
  client_name: string;
  job_code: string;
  city: string;
  payment: { amount: Money; method: PaymentMethod; reference: string | null; is_advance: boolean; received_at: string; received_by: string | null };
  job_totals: { agreed_amount: Money; approved_changes: Money; received: Money; balance: Money };
}

export interface Ledger extends Paged<LedgerRow> {
  totals: { jobs: number; total: number; advance: number; received: number; balance: number; outstanding: number };
}

export interface PriceChange {
  id: string;
  job_id: string;
  code: string;
  client_name: string;
  delta: Money;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requested_by_name: string | null;
  created_at: string;
}

export interface ExtraTimeRow {
  id: string;
  job_id: string;
  code: string;
  city: string;
  client_name: string;
  minutes: number;
  note: string | null;
  decision: "pending" | "charge" | "no_charge";
  created_at: string;
  added_by_name: string | null;
  decided_by_name: string | null;
}

export interface ContactRow {
  id: string;
  client_name: string;
  phone: string | null;
  outcome: ContactOutcome;
  note: string | null;
  created_at: string;
  salesperson_name: string;
}

export interface Contacts {
  date: string;
  counts: { salesperson_id: string; full_name: string; spoken: number; approved: number; rejected: number; follow_ups: number }[];
  items: ContactRow[];
}

export interface HoursRow {
  reelmaker_id: string;
  full_name: string;
  month: string;
  shoots: number;
  booked_hours: number;
  extra_hours: number;
  total_hours: number;
}

export interface AuditRow {
  id: number;
  at: string;
  action: string;
  entity: string;
  entity_id: string | null;
  actor_name: string | null;
}

export interface Dashboard {
  jobs_by_status: Partial<Record<JobStatus, number>>;
  today: { shoots: number; reached: number };
  needs_attention: {
    unassigned: { total: number; flagged: number };
    checkins_waiting: number;
    uploads_overdue: number;
    approvals: { price_changes: number; extra_time: number };
  };
  money: { outstanding: Money; jobs_owing: number; received_this_month: Money };
  sales_today: { spoken: number; approved: number; rejected: number; follow_ups: number };
  recent_activity: AuditRow[];
}

export interface CalendarDay {
  date: string;
  jobs: {
    id: string;
    code: string;
    status: JobStatus;
    city: string;
    starts_at: string;
    duration_minutes: number | null;
    client_name: string;
    reelmaker: { id: string; full_name: string; status: string } | null;
  }[];
}

export interface Setting {
  key: string;
  value: number | boolean;
  updated_at: string | null;
}

export interface ShareLink {
  id: string;
  state: "active" | "expired" | "revoked";
  created_by_name: string | null;
  include_raw: boolean;
  expires_at: string;
  created_at: string;
}

export interface PublicShare {
  client: string;
  job: string;
  shot_on: string | null;
  expires_at: string;
  files: { name: string; kind: "raw" | "edited"; size_bytes: number; url: string }[];
}

export interface Notifications {
  unread: number;
  items: { id: string; title: string; body: string | null; link: string | null; read_at: string | null; created_at: string }[];
}

export const PIPELINE: JobStatus[] = [
  "lead", "draft", "confirmed", "assigned", "accepted", "reached", "uploaded", "released", "paid", "delivered", "closed",
];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin", sales: "Sales", ops: "Operations", reelmaker: "Reelmaker", accounts: "Accounts",
};

export const METHOD_LABEL: Record<PaymentMethod, string> = { upi: "UPI", bank_transfer: "Bank transfer", cash: "Cash" };

export const OUTCOME_LABEL: Record<ContactOutcome, string> = {
  spoken: "Spoken", follow_up: "Follow up", approved: "Approved", rejected: "Rejected",
};

/** The reelmaker currently on a job (asked or accepted). */
export const liveAssignment = (j: Pick<Job, "assignments">) =>
  j.assignments?.find((a) => a.status === "pending" || a.status === "accepted");
