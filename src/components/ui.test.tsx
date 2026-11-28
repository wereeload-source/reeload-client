import { render, screen } from "@testing-library/react";
import { Avatar, Empty, Kpi, StatusChip } from "./ui";

describe("small UI pieces", () => {
  it("labels job statuses in plain words, as in the mockup", () => {
    render(<><StatusChip status="uploaded" /><StatusChip status="assigned" /></>);
    expect(screen.getByText("Uploaded")).toBeInTheDocument();
    expect(screen.getByText("Awaiting accept")).toBeInTheDocument();
  });
  it("shows initials in avatars without exposing them to screen readers", () => {
    const { container } = render(<Avatar name="Sana Sales" />);
    expect(container.textContent).toBe("SS");
    expect(container.firstChild).toHaveAttribute("aria-hidden");
  });
  it("renders KPIs and empty states", () => {
    render(<><Kpi label="Outstanding" value="₹5,000" note="across 2 jobs" tone="warn" /><Empty>No jobs</Empty></>);
    expect(screen.getByText("₹5,000")).toBeInTheDocument();
    expect(screen.getByText("across 2 jobs")).toHaveClass("text-warn");
    expect(screen.getByText("No jobs")).toBeInTheDocument();
  });
});
