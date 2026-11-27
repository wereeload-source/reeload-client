import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireProfile, createClient } from "@/lib/supabase/server";
import { PageBar, Pane } from "@/components/page-bar";

async function saveRetention(f: FormData) {
  "use server";
  const supabase = await createClient();
  await supabase.from("settings").update({ value: Number(f.get("edited")) }).eq("key", "edited_retention_days");
  revalidatePath("/settings");
}

export default async function SettingsPage() {
  const { supabase, me } = await requireProfile();
  if (me.role !== "admin") redirect("/");
  const { data } = await supabase.from("settings").select("key, value");
  const v = (k: string) => data?.find((s) => s.key === k)?.value;
  return (
    <>
      <PageBar title="Settings" />
      <Pane>
        <form action={saveRetention} className="card max-w-lg">
          <h3>File retention</h3>
          <p className="text-sm">Raw files are deleted {String(v("raw_retention_days"))} days after the shoot.</p>
          <label className="label mt-3">Edited reels: deleted after (15–20 days)
            <input className="input" type="number" name="edited" min={15} max={20} defaultValue={Number(v("edited_retention_days"))} />
          </label>
          <h3 className="mt-4">Client download links</h3>
          <p className="text-sm">Valid for {String(v("share_link_days"))} days · raw files {v("share_include_raw") ? "included" : "not included"}.</p>
          <button className="btn btn-pri mt-3">Save</button>
        </form>
      </Pane>
    </>
  );
}
