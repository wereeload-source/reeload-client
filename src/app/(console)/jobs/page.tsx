import { Plus } from "lucide-react";
import { Cell, DataTable, Row, type Column } from "@/components/data-table";
import { FilterBar } from "@/components/filter-bar";
import { LinkButton } from "@/components/link-button";
import { PageBar } from "@/components/page-bar";
import { Panel, StatusChip } from "@/components/ui";
import { dayTime, inr, statusLabel } from "@/lib/format";
import { api, requirePage } from "@/lib/session";
import { liveAssignment, type Job, type Paged } from "@/lib/types";

const FILTERS = ["all", "draft", "confirmed", "assigned", "accepted", "reached", "uploaded", "released", "paid", "cancelled"];

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ s?: string; q?: string }> }) {
  const { me } = await requirePage("jobs");
  const sp = await searchParams;
  const s = FILTERS.includes(sp.s ?? "") ? sp.s! : "all";
  const q = (sp.q ?? "").slice(0, 80);
  const qs = new URLSearchParams({ limit: "200" });
  if (s !== "all") qs.set("status", s);
  if (q) qs.set("q", q);
  const { items: jobs, total } = await api.get<Paged<Job>>(`/jobs?${qs}`);
  const money = me.role === "admin" || me.role === "sales";

  const columns: Column[] = [{ label: "Job" }, { label: "Client" }, { label: "City" }, { label: "Shoot" }, { label: "Reelmaker" }, { label: "Status" }];
  if (money) columns.push({ label: "Agreed", align: "end" });

  return (
    <>
      <PageBar title="Jobs" note={money ? undefined : "Prices are hidden for Operations."}>
        {money && (
          <LinkButton href="/jobs/new">
            <Plus aria-hidden className="size-4" /> New job
          </LinkButton>
        )}
      </PageBar>
      <FilterBar
        filters={FILTERS.map((f) => ({ id: f, label: f === "all" ? "All" : statusLabel(f) }))}
        current={s}
        q={q}
        placeholder="Client, phone, city or RL-1001"
      />
      <Panel>
        <DataTable label="Jobs" minWidth={760} isEmpty={!jobs.length} empty="No jobs match." columns={columns}>
          {jobs.map((j) => (
            <Row key={j.id} href={`/jobs/${j.id}`}>
              <Cell className="font-mono text-[13px] font-medium whitespace-nowrap text-rec">{j.code}</Cell>
              <Cell>
                <div className="font-semibold">{j.client_name}</div>
                <div className="font-mono text-xs text-mute">{j.client_phone}</div>
              </Cell>
              <Cell>{j.city}</Cell>
              <Cell className="whitespace-nowrap">{j.starts_at ? dayTime(j.starts_at) : <span className="text-mute">Not set</span>}</Cell>
              <Cell>{liveAssignment(j)?.full_name ?? <span className="text-mute">—</span>}</Cell>
              <Cell><StatusChip status={j.status} /></Cell>
              {money ? <Cell className="text-right font-mono">{inr(j.agreed_amount)}</Cell> : null}
            </Row>
          ))}
        </DataTable>
        {total > jobs.length && <p className="m-0 text-[13px] text-mute">Showing {jobs.length} of {total}. Narrow the search to see the rest.</p>}
      </Panel>
    </>
  );
}
