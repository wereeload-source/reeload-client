import { requireProfile } from "@/lib/supabase/server";
import { PageBar, Pane } from "@/components/page-bar";
import { Chip } from "@/components/ui";
import { hoursSince } from "@/lib/format";
import type { Job } from "@/lib/types";
import { AssignBoard } from "./board";

export default async function AssignPage() {
  const { supabase } = await requireProfile();
  const [{ data: jobs }, { data: rms }, { data: booked }, { data: leave }] = await Promise.all([
    supabase.from("jobs").select("*, clients(name)").eq("status", "confirmed").order("confirmed_at"),
    supabase.from("profiles").select("id, full_name, reelmakers(kind, base_city)").eq("role", "reelmaker").eq("active", true).order("full_name"),
    supabase.from("assignments").select("reelmaker_id, time_range").in("status", ["pending", "accepted"]),
    supabase.from("availability").select("reelmaker_id, time_range"),
  ]);
  const late = ((jobs ?? []) as Job[]).filter((j) => hoursSince(j.confirmed_at) > 48).length;
  return (
    <>
      <PageBar title="Assign shoots">{late > 0 && <Chip tone="rec">{late} over 48 hours</Chip>}</PageBar>
      <Pane>
        <AssignBoard
          jobs={(jobs ?? []) as Job[]}
          reelmakers={(rms ?? []).map((r) => ({ id: r.id, name: r.full_name, kind: (r.reelmakers as unknown as { kind: string } | null)?.kind ?? "" }))}
          booked={booked ?? []}
          leave={leave ?? []}
        />
      </Pane>
    </>
  );
}
