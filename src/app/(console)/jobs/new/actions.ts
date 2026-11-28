"use server";
import { redirect } from "next/navigation";
import { buildJob } from "@/lib/job-form";
import { api, attempt } from "@/lib/session";
import type { Job } from "@/lib/types";

export async function createJob(_: unknown, f: FormData) {
  const body = buildJob(f);
  if (!body.client.name || !body.client.phone || !body.job.city) return { error: "Enter the client's name, phone and city" };
  const r = await attempt(() => api.post<Job>("/jobs", body));
  if (r.error !== undefined || !r.data) return { error: r.error ?? "The job could not be saved" };
  redirect(`/jobs/${r.data.id}`);
}
