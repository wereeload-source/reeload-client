import { Card, Separator } from "@heroui/react";
import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";
import { LinkButton } from "@/components/link-button";
import { inr, longDay } from "@/lib/format";
import { api, attempt, requirePage } from "@/lib/session";
import { METHOD_LABEL, type Receipt } from "@/lib/types";
import { PrintButton } from "./print";

/** A payment receipt to print or save as PDF (the ledger's "Print receipt"). */
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("payments");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const r = await attempt(() => api.get<Receipt>(`/payments/${encodeURIComponent(id)}/receipt`));
  if (!r.data) notFound();
  const rc = r.data;
  const p = rc.payment;
  const line = (label: string, value: React.ReactNode, strong?: boolean) => (
    <div className={`flex justify-between gap-4 text-sm ${strong ? "font-semibold" : ""}`}>
      <span className={strong ? "" : "text-mute"}>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4">
      <div className="flex justify-between gap-2 print:hidden">
        <LinkButton href="/payments" variant="ghost" size="sm">Back to the ledger</LinkButton>
        <PrintButton />
      </div>
      <Card className="gap-5 p-8 print:border-0">
        <div className="flex items-start justify-between gap-4">
          <Brand small onLight />
          <div className="text-right">
            <div className="font-display text-lg font-bold">Payment receipt</div>
            <div className="font-mono text-xs text-mute">{rc.receipt_no}</div>
          </div>
        </div>
        <div className="text-sm">
          <div className="font-semibold">{rc.client_name}</div>
          <div className="text-mute">Job {rc.job_code} · {rc.city}</div>
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          {line("Received on", longDay(p.received_at))}
          {line("Paid by", METHOD_LABEL[p.method])}
          {p.reference && line("Reference", p.reference)}
          {line(p.is_advance ? "Advance" : "Payment", inr(p.amount), true)}
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          {line("Agreed amount", inr(rc.job_totals.agreed_amount))}
          {line("Approved changes", inr(rc.job_totals.approved_changes ?? 0))}
          {line("Received so far", inr(rc.job_totals.received))}
          {line("Balance", inr(rc.job_totals.balance), true)}
        </div>
        <p className="m-0 text-xs text-mute">
          Issued {longDay(rc.issued_at)}{p.received_by ? ` · recorded by ${p.received_by}` : ""}. Thank you for your payment.
        </p>
      </Card>
    </div>
  );
}
