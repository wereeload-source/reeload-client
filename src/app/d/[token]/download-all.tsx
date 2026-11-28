"use client";
import { Button } from "@heroui/react";
import { useState } from "react";

/**
 * "Download everything": starts each file's download one after another. Each link is already a
 * short-lived signed address that downloads as an attachment. The browser may ask once to allow
 * several downloads.
 */
export function DownloadAll({ urls }: { urls: string[] }) {
  const [busy, setBusy] = useState(false);
  async function all() {
    setBusy(true);
    for (const url of urls) {
      const a = document.createElement("a");
      a.href = url;
      a.rel = "noopener noreferrer";
      a.download = "";
      document.body.appendChild(a);
      a.click();
      a.remove();
      await new Promise((r) => setTimeout(r, 900));
    }
    setBusy(false);
  }
  return (
    <Button fullWidth size="lg" className="min-h-14 text-[17px] font-bold" isPending={busy} onPress={all}>
      Download everything
    </Button>
  );
}
