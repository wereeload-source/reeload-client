"use client";
import { useState, useTransition } from "react";
import { setActive } from "./actions";

export function ToggleUser({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <>
      <button className="btn" disabled={pending} onClick={() => start(async () => setError((await setActive(id, !active)).error ?? null))}>
        {active ? "Disable" : "Enable"}
      </button>
      {error && <div className="text-[12.5px] text-rec">{error}</div>}
    </>
  );
}
