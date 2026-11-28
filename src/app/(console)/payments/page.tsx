import { FileDown, Wallet } from "lucide-react";
import { Card } from "@heroui/react";
import { Cell, DataTable, Row } from "@/components/data-table";
import { LinkButton } from "@/components/link-button";
import { PageBar } from "@/components/page-bar";
import { Chip, Empty } from "@/components/ui";
import { day, inr, num } from "@/lib/format";
import { api, requirePage } from "@/lib/session";
import { METHOD_LABEL, type JobPayments, type Ledger } from "@/lib/types";
import { JobPicker, LedgerSearch } from "./picker";
import { RecordPayment } from "./record";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ q?: string; owing?: string; job?: string }> }) {
  const { me } = await requirePage("payments");
  const sp = await searchParams;
  const q = (sp.q ?? "").slice(0, 80);
  const owing = sp.owing === "1";
  const qs = new URLSearchParams({ limit: "500" });
  if (q) qs.set("q", q);
  if (owing) qs.set("outstanding", "true");
  const ledger = await api.get<Ledger>(`/ledger?${qs}`);
  const rows = ledger.items.filter((r) => r.agreed_amount !== null);
  const canRecord = me.role === "accounts" || me.role === "admin";
  const selectedId = rows.find((r) => r.id === sp.job)?.id ?? rows[0]?.id;
  const detail = selectedId ? await api.get<JobPayments>(`/jobs/${encodeURIComponent(selectedId)}/payments`) : null;

  return (
    <>
      <PageBar title="Payment ledger" note="UPI, bank transfer or cash. No online gateway.">
        {canRecord && (
          <LinkButton href={`/api/proxy/ledger.csv?${qs}`} variant="outline" size="sm" download>
            <FileDown aria-hidden className="size-4" /> Export CSV
          </LinkButton>
        )}
      </PageBar>

      <div className="flex flex-wrap items-start gap-5">
        <section aria-label="Jobs" className="flex max-w-[400px] min-w-[280px] flex-[1_1_320px] flex-col gap-3">
          <LedgerSearch q={q} owing={owing} />
          <Card className="p-3">
            {rows.length ? (
              <JobPicker
                selected={selectedId ?? null}
                jobs={rows.map((r) => {
                  const balance = num(r.balance);
                  return { id: r.id, client: r.client_name, code: r.code, balance: inr(Math.max(balance, 0)), paid: balance <= 0 };
                })}
              />
            ) : (
              <Empty icon={Wallet}>No jobs with an agreed amount match.</Empty>
            )}
          </Card>
        </section>

        {detail && (
          <section aria-label="Ledger" className="flex min-w-0 flex-[2_1_560px] flex-col gap-4">
            <Card className="gap-4 px-6 py-[22px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="m-0 text-[22px] font-semibold">
                  {detail.summary.client_name} <span className="font-mono text-sm font-normal text-mute">{detail.summary.code}</span>
                </h2>
                {num(detail.summary.balance) <= 0 ? <Chip tone="ok">Paid</Chip> : <Chip tone="warn">Balance due</Chip>}
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                {[
                  { label: "Total agreed", value: inr(detail.summary.agreed_amount), cls: "bg-sub text-ink" },
                  { label: "Approved changes", value: `${num(detail.summary.approved_changes) >= 0 ? "+" : ""}${inr(detail.summary.approved_changes ?? 0)}`, cls: "bg-sub text-ink" },
                  { label: "Received", value: inr(detail.summary.received), cls: "bg-oks text-ok" },
                  {
                    label: "Balance",
                    value: inr(Math.max(num(detail.summary.balance), 0)),
                    cls: num(detail.summary.balance) <= 0 ? "bg-oks text-ok" : "bg-warns text-warn",
                  },
                ].map((t) => (
                  <div key={t.label} className={`rounded-[10px] p-3.5 ${t.cls}`}>
                    <div className="text-xs font-semibold text-mute2">{t.label}</div>
                    <div className="mt-1 font-mono text-xl font-medium">{t.value}</div>
                  </div>
                ))}
              </div>
              <DataTable
                label="Payments"
                minWidth={480}
                isEmpty={!detail.payments.length}
                empty="No payments recorded yet."
                columns={[{ label: "Date" }, { label: "Type" }, { label: "Reference" }, { label: "Amount", align: "end" }, { label: "Receipt", hidden: true, align: "end" }]}
              >
                {detail.payments.map((p, i) => (
                  <Row key={p.id}>
                    <Cell className="font-mono text-[13px] whitespace-nowrap">{day(p.received_at)}</Cell>
                    <Cell>{p.is_advance ? "Advance" : i === detail.payments.length - 1 && num(detail.summary.balance) <= 0 ? "Balance" : "Part payment"} · {METHOD_LABEL[p.method]}</Cell>
                    <Cell className="font-mono text-[13px] text-mute2">{p.reference ?? "—"}</Cell>
                    <Cell className="text-right font-mono">{inr(p.amount)}</Cell>
                    <Cell className="text-right">
                      <LinkButton href={`/payments/receipt/${p.id}`} variant="ghost" size="sm" className="text-info">Print receipt</LinkButton>
                    </Cell>
                  </Row>
                ))}
              </DataTable>
            </Card>

            {canRecord && (
              <RecordPayment
                jobId={detail.summary.id}
                balance={Math.max(num(detail.summary.balance), 0)}
                owed={num(detail.summary.agreed_amount) + num(detail.summary.approved_changes)}
                canPay={!["lead", "draft", "cancelled"].includes(detail.summary.status)}
              />
            )}
          </section>
        )}
      </div>
    </>
  );
}
