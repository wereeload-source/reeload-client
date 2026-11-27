import { requireProfile } from "@/lib/supabase/server";
import { PageBar, Pane } from "@/components/page-bar";
import { Avatar, Chip } from "@/components/ui";

// Hours only: the system does not calculate pay (section 7).
export default async function TeamPage() {
  const { supabase } = await requireProfile();
  const month = new Date(); month.setDate(1);
  const [{ data: rms }, { data: hours }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, phone, active, reelmakers(kind, base_city)").eq("role", "reelmaker").order("full_name"),
    supabase.from("reelmaker_hours").select("*").eq("month", month.toISOString().slice(0, 10)),
  ]);
  return (
    <>
      <PageBar title="Reelmakers" />
      <Pane>
        <div className="card px-2 py-1.5">
          <table className="tbl">
            <thead><tr><th>Reelmaker</th><th>Type</th><th>Phone</th><th className="num">Shoots</th><th className="num">Hours</th></tr></thead>
            <tbody>
              {(rms ?? []).map((r) => {
                const h = (hours ?? []).find((x) => x.reelmaker_id === r.id);
                const rm = r.reelmakers as unknown as { kind: string; base_city: string } | null;
                return (
                  <tr key={r.id}>
                    <td><div className="flex items-center gap-2.5"><Avatar name={r.full_name} /><div><b>{r.full_name}</b><div className="text-[12.5px] text-mute">{rm?.base_city}</div></div></div></td>
                    <td className="capitalize">{rm?.kind.replace("_", "-")} {!r.active && <Chip>Inactive</Chip>}</td>
                    <td className="font-mono">{r.phone}</td>
                    <td className="num">{h?.shoots ?? 0}</td>
                    <td className="num">{h ? Number(h.booked_hours) + Number(h.extra_hours) : 0}h{Number(h?.extra_hours) > 0 && <span className="text-mute"> +{h?.extra_hours}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Pane>
    </>
  );
}
