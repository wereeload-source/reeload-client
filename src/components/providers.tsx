"use client";
import { Toast } from "@heroui/react";

/** App-wide client pieces: the toast stack used for success and error messages. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toast.Provider placement="bottom end" />
    </>
  );
}
