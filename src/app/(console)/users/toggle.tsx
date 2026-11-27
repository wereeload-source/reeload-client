"use client";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ToggleUser({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  return (
    <button className="btn" onClick={async () => {
      const { error } = await createClient().from("profiles").update({ active: !active }).eq("id", id);
      if (error) alert(error.message);
      router.refresh();
    }}>{active ? "Disable" : "Enable"}</button>
  );
}
