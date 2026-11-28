import { Cell, DataTable, Row, type Column } from "@/components/data-table";
import { DateJump } from "@/components/date-jump";
import { PageBar } from "@/components/page-bar";
import { Chip, Kpi, Kpis, Panel, type Tone } from "@/components/ui";
import { istDate, longDay, time } from "@/lib/format";
import { api, requirePage } from "@/lib/session";
import { OUTCOME_LABEL, type ContactOutcome, type Contacts } from "@/lib/types";
import { LogCall } from "./log-call";

const TONE: Record<ContactOutcome, Tone> = { approved: "ok", rejected: "bad", follow_up: "info", spoken: "neutral" };

export default async function ContactsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { me } = await requirePage("contacts");
  const { date: raw } = await searchParams;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : istDate();
  const data = await api.get<Contacts>(`/contacts?date=${date}`);
  const rows = data.items;
  const n = (o: ContactOutcome) => rows.filter((r) => r.outcome === o).length;
  const admin = me.role === "admin";
  const columns: Column[] = [{ label: "Time" }, { label: "Client" }, { label: "Phone" }, { label: "Outcome" }, { label: "Note" }];
  if (admin) columns.push({ label: "By" });

  return (
    <>
      <PageBar title="Contact log" note="Every call, approved or not, so the day's numbers add up.">
        <LogCall />
      </PageBar>
      <DateJump action="/contacts" name="date" label="Day" type="date" value={date} after={longDay(`${date}T12:00:00+05:30`)} />
      <Kpis>
        <Kpi label="Spoken" value={rows.length} />
        <Kpi label="Approved" value={n("approved")} tone="ok" note="Ready to become jobs" />
        <Kpi label="Rejected" value={n("rejected")} tone="bad" />
        <Kpi label="Follow-ups" value={n("follow_up")} tone="info" />
      </Kpis>
      {admin && data.counts.length > 1 && (
        <Panel title="By salesperson">
          <DataTable
            label="Calls by salesperson"
            columns={[{ label: "Person" }, { label: "Spoken", align: "end" }, { label: "Approved", align: "end" }, { label: "Rejected", align: "end" }, { label: "Follow-ups", align: "end" }]}
          >
            {data.counts.map((c) => (
              <Row key={c.salesperson_id}>
                <Cell className="font-medium">{c.full_name}</Cell>
                <Cell className="text-right font-mono">{c.spoken}</Cell>
                <Cell className="text-right font-mono text-ok">{c.approved}</Cell>
                <Cell className="text-right font-mono text-bad">{c.rejected}</Cell>
                <Cell className="text-right font-mono">{c.follow_ups}</Cell>
              </Row>
            ))}
          </DataTable>
        </Panel>
      )}
      <Panel title="Calls">
        <DataTable label="Calls" minWidth={640} isEmpty={!rows.length} empty="No calls logged on this day." columns={columns}>
          {rows.map((r) => (
            <Row key={r.id}>
              <Cell className="font-mono text-[13px] text-mute">{time(r.created_at)}</Cell>
              <Cell className="font-semibold">{r.client_name}</Cell>
              <Cell className="font-mono text-[13px]">{r.phone}</Cell>
              <Cell><Chip tone={TONE[r.outcome]}>{OUTCOME_LABEL[r.outcome]}</Chip></Cell>
              <Cell className="text-mute">{r.note}</Cell>
              {admin ? <Cell>{r.salesperson_name}</Cell> : null}
            </Row>
          ))}
        </DataTable>
      </Panel>
    </>
  );
}
