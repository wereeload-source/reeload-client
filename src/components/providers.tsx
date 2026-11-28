"use client";
import { Toast } from "@heroui/react";
import { useRouter } from "next/navigation";
import { RouterProvider } from "react-aria-components";

/** App-wide client pieces: HeroUI links navigate with the Next router, and the toast stack. */
export function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <RouterProvider navigate={(href) => router.push(href)}>
      {children}
      <Toast.Provider placement="bottom end" />
    </RouterProvider>
  );
}
