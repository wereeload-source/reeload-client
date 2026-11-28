"use client";
import { Button } from "@heroui/react";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button size="sm" onPress={() => window.print()}>
      <Printer aria-hidden className="size-4" /> Print or save as PDF
    </Button>
  );
}
