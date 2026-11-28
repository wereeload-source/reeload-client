import { Table } from "@heroui/react";
import { Empty } from "@/components/ui";

export type Column = { label: React.ReactNode; align?: "start" | "end"; hidden?: boolean };

/**
 * HeroUI Table as the mockup draws it: uppercase grey headers, thin row lines, sideways scroll
 * inside the card on narrow screens. The first column is the row header for screen readers.
 */
export function DataTable({ label, columns, children, minWidth = 520, empty, isEmpty }: {
  label: string; columns: Column[]; children: React.ReactNode; minWidth?: number; empty?: React.ReactNode; isEmpty?: boolean;
}) {
  if (isEmpty) return <Empty>{empty ?? "Nothing here yet."}</Empty>;
  return (
    <Table variant="secondary" className="bg-transparent p-0">
      <Table.ScrollContainer>
        <Table.Content aria-label={label} style={{ minWidth }}>
          <Table.Header>
            {columns.map((c, i) => (
              <Table.Column key={i} isRowHeader={i === 0} className={c.align === "end" ? "text-right" : ""}>
                {c.hidden ? <span className="sr-only">{c.label}</span> : c.label}
              </Table.Column>
            ))}
          </Table.Header>
          <Table.Body>{children}</Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

export const Row = Table.Row;
export const Cell = Table.Cell;
