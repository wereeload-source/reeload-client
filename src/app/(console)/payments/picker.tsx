"use client";
import { Button, Checkbox, Form, Radio, RadioGroup, SearchField } from "@heroui/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Chip } from "@/components/ui";

type PickJob = { id: string; client: string; code: string; balance: string; paid: boolean };

const pickCard =
  "flex w-full flex-col items-stretch gap-1.5 text-left rounded-[10px] border-2 border-line bg-paper p-3.5 transition-colors data-[selected=true]:border-rec data-[selected=true]:bg-recs data-[focus-visible=true]:border-rec";

/** The ledger's job list (left column of the Accounts mockup). Picking one shows its payments. */
export function JobPicker({ jobs, selected }: { jobs: PickJob[]; selected: string | null }) {
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();
  const open = (id: string) => {
    const next = new URLSearchParams(params);
    next.set("job", id);
    router.replace(`${path}?${next}`, { scroll: false });
  };
  return (
    <RadioGroup aria-label="Jobs" value={selected} onChange={open} className="gap-2">
      {jobs.map((j) => (
        <Radio key={j.id} value={j.id} className="w-full">
          <Radio.Content className={pickCard}>
            <span className="flex items-center justify-between gap-2.5">
              <span className="text-[15px] font-semibold text-ink">{j.client}</span>
              {j.paid ? <Chip tone="ok">Paid</Chip> : <Chip tone="warn">Balance due</Chip>}
            </span>
            <span className="font-mono text-xs text-mute2">{j.code} · Balance {j.balance}</span>
          </Radio.Content>
        </Radio>
      ))}
    </RadioGroup>
  );
}

/** Search box and "only jobs that owe money", sent as a normal GET so the URL can be shared. */
export function LedgerSearch({ q, owing }: { q: string; owing: boolean }) {
  return (
    <Form action="/payments" className="flex flex-wrap items-center gap-2" role="search">
      <SearchField name="q" defaultValue={q} aria-label="Search jobs" className="min-w-0 flex-1">
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Client, city or RL-1001" maxLength={80} />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
      <Checkbox name="owing" value="1" defaultSelected={owing}>
        <Checkbox.Content>
          <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
          Owes money
        </Checkbox.Content>
      </Checkbox>
      <Button type="submit" variant="outline" size="sm">Apply</Button>
    </Form>
  );
}
