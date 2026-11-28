"use client";
import { Form, SearchField } from "@heroui/react";
import { useRouter } from "next/navigation";

/** Header search: finds jobs by client, phone, city or code (RL-1001) from any page. */
export function JobSearch() {
  const router = useRouter();
  return (
    <Form
      role="search"
      className="w-full max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        router.push(q ? `/jobs?q=${encodeURIComponent(q)}` : "/jobs");
      }}
    >
      <SearchField name="q" aria-label="Search jobs" className="w-full">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Search jobs: client, phone, city or RL-1001" maxLength={80} />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
    </Form>
  );
}
