import { PageBar, Pane } from "@/components/page-bar";
import { requireProfile } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewJobForm } from "./form";

export default async function NewJob() {
  const { me } = await requireProfile();
  if (me.role !== "sales" && me.role !== "admin") redirect("/jobs");
  return (
    <>
      <PageBar title="New job" />
      <Pane><NewJobForm /></Pane>
    </>
  );
}
