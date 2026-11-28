"use client";
import { endSession } from "@/app/login/actions";

/**
 * Signs out and loads the sign-in page fresh, so nothing from the last person's pages stays in
 * the browser tab (the app keeps recent pages in memory for fast back/forward).
 */
export async function signOutFully() {
  await endSession().catch(() => undefined);
  window.location.replace("/login");
}
