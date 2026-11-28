import { redirect } from "next/navigation";
import { requirePage } from "@/lib/session";
import { NewJobForm } from "./form";

export default async function NewJob() {
  const { me } = await requirePage("jobs");
  if (me.role !== "sales" && me.role !== "admin") redirect("/jobs");
  return <NewJobForm />;
}
