import { Clapperboard, Plus, Search } from "lucide-react";
import Link from "next/link";
import { LinkButton } from "@/components/link-button";
import { PageBar, Pane } from "@/components/page-bar";
import { Empty, Panel, StatusChip } from "@/components/ui";
import { day, inr, time } from "@/lib/format";
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

  return (
    <>
      <PageBar title="Jobs">
        {money && (
          <LinkButton href="/jobs/new">
            <Plus aria-hidden className="size-4" /> New job
          </LinkButton>
        )}
      </PageBar>
      <Pane>
        <form className="box flex flex-wrap items-center gap-1.5" role="search">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={`/jobs?s=${f}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              aria-current={s === f ? "true" : undefined}
              className={`rounded-full border px-3 py-1 text-[13px] font-semibold capitalize ${s === f ? "border-ink bg-ink text-paper" : "border-line bg-paper text-mute"}`}
            >
              {f}
            </Link>
          ))}
          <span className="flex-1" />
          <input type="hidden" name="s" value={s} />
          <label className="relative">
            <span className="sr-only">Search jobs</span>
            <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-mute" />
            <input name="q" defaultValue={q} placeholder="Client, phone, city or RL-1001" maxLength={80} className="field w-64 pl-8" />
          </label>
        </form>
        <Panel flush>
          {jobs.length ? (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Job</th><th>Client</th><th>City</th><th>Shoot</th><th>Reelmaker</th><th>Status</th>
                  {money && <th className="num">Agreed</th>}
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-sub">
                    <td className="whitespace-nowrap"><Link href={`/jobs/${j.id}`} className="font-semibold text-rec hover:underline">{j.code}</Link></td>
                    <td><b>{j.client_name}</b><div className="font-mono text-[12.5px] text-mute">{j.client_phone}</div></td>
                    <td>{j.city}</td>
                    <td className="whitespace-nowrap">{j.starts_at ? `${day(j.starts_at)} · ${time(j.starts_at)}` : <span className="text-mute">Not set</span>}</td>
                    <td>{liveAssignment(j)?.full_name ?? <span className="text-mute">—</span>}</td>
                    <td><StatusChip status={j.status} /></td>
                    {money && <td className="num">{inr(j.agreed_amount)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty icon={Clapperboard}>No jobs match.</Empty>
          )}
          {total > jobs.length && <p className="px-2 py-2 text-[13px] text-mute">Showing {jobs.length} of {total}. Narrow the search to see the rest.</p>}
        </Panel>
      </Pane>
    </>
  );
}
