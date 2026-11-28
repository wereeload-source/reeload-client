import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewJobForm } from "./form";

vi.mock("./actions", () => ({ createJob: vi.fn(async () => null) }));

describe("NewJobForm (Sales mockup rule)", () => {
  it("keeps Confirm off until amount, advance, consent, date and time are in, and explains why", async () => {
    const user = userEvent.setup();
    render(<NewJobForm />);
    const confirm = screen.getByRole("button", { name: "Confirm job" });
    expect(confirm).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Enter the advance received");

    await user.type(screen.getByRole("textbox", { name: /Agreed amount/ }), "18000");
    await user.click(screen.getByRole("button", { name: "30%" }));
    expect(screen.getByRole("textbox", { name: /Advance received/ })).toHaveValue("5400");
    expect(screen.getByText("₹12,600")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Tick the client consent box first");

    await user.click(screen.getByRole("checkbox", { name: /Client agrees/ }));
    expect(screen.getByRole("status")).toHaveTextContent("Set the shoot date and start time");
    expect(confirm).toBeDisabled();
    // Saving a draft never needs the advance.
    expect(screen.getByRole("button", { name: "Save as draft" })).toBeEnabled();
  });
});
