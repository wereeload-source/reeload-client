import { requireProfile } from "@/lib/supabase/server";
import { PageBar, Pane } from "@/components/page-bar";
import { StatusChip, Empty } from "@/components/ui";
import { day, hoursSince } from "@/lib/format";
import type { Job } from "@/lib/types";
import { ReviewActions } from "./actions";

export default async function ReviewPage() {
  const { supabase, me } = await requireProfile();
  const { data: jobs } = await supabase.from("jobs").select("*, clients(name)").in("status", ["reached", "uploaded", "released", "paid", "delivered"]).order("starts_at", { ascending: false });
  const ids = (jobs ?? []).map((j) => j.id);
  const { data: files } = ids.length
    ? await supabase.from("uploads").select("job_id, kind, status").in("job_id", ids).eq("status", "complete")
    : { data: [] };
  const count = (id: string, kind: string) => (files ?? []).filter((f) => f.job_id === id && f.kind === kind).length;

  return (
    <>
      <PageBar title="Review & delivery" />
      <Pane>
        <div className="card px-2 py-1.5">
          {(jobs ?? []).length ? (
            <table className="tbl">
              <thead><tr><th>Job</th><th>Shot</th><th>Status</th><th className="num">Raw</th><th className="num">Edited</th><th>Files due</th><th /></tr></thead>
              <tbody>
                {((jobs ?? []) as Job[]).map((j) => {
                  const h = hoursSince(j.starts_at);
                  const raw = count(j.id, "raw"), edited = count(j.id, "edited");
                  const overdue = (raw === 0 && h > 24) || (edited === 0 && h > 72);
                  return (
                    <tr key={j.id}>
                      <td><b>{j.clients?.name}</b><div className="text-[13px] text-mute">{j.code}</div></td>
                      <td>{day(j.starts_at)}</td>
                      <td><StatusChip status={j.status} /></td>
                      <td className="num">{raw}</td><td className="num">{edited}</td>
                      <td>{overdue && ["reached", "uploaded"].includes(j.status) ? <span className="text-[13px] font-semibold text-rec">Overdue</span> : <span className="text-mute">On time</span>}</td>
                      <td className="num"><ReviewActions jobId={j.id} status={j.status} isAdmin={me.role === "admin"} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : <Empty>No work waiting for review.</Empty>}
        </div>
      </Pane>
    </>
  );
}
