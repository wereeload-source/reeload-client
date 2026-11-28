"use client";
import { Form, SearchField, Tabs } from "@heroui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** HeroUI Tabs for a status filter plus a search box; both live in the URL so a view can be shared. */
export function FilterBar({ filters, current, param = "s", q, placeholder }: {
  filters: { id: string; label: string }[]; current: string; param?: string; q?: string; placeholder?: string;
}) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const go = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`${path}?${next}`);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Tabs selectedKey={current} onSelectionChange={(k) => go({ [param]: String(k) })} className="min-w-0 max-w-full overflow-x-auto">
        <Tabs.ListContainer>
          <Tabs.List aria-label="Filter by status">
            {filters.map((f) => (
              <Tabs.Tab key={f.id} id={f.id} className="whitespace-nowrap">
                {f.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
      {placeholder !== undefined && (
        <Form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            go({ q: String(new FormData(e.currentTarget).get("q") ?? "").trim() });
          }}
        >
          <SearchField name="q" defaultValue={q} aria-label="Search" onClear={() => go({ q: "" })}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder={placeholder} maxLength={80} className="w-64" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </Form>
      )}
    </div>
  );
}
