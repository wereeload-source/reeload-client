import { toast } from "@heroui/react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { router } from "@/test/setup";
import { ActionButton } from "./action-button";

vi.mock("@heroui/react", async (orig) => {
  const real = await orig<typeof import("@heroui/react")>();
  return { ...real, toast: Object.assign(vi.fn(), { success: vi.fn(), danger: vi.fn() }) };
});

describe("ActionButton", () => {
  it("runs the call, confirms with a toast and reloads the page data", async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    render(<ActionButton run={run} success="Done">Approve</ActionButton>);
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(run).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith("Done");
  });

  it("shows the server's message and does not reload when the call fails", async () => {
    render(<ActionButton run={() => Promise.reject(new Error("That is more than the balance"))}>Save</ActionButton>);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(toast.danger).toHaveBeenCalledWith("That is more than the balance"));
    expect(router.refresh).not.toHaveBeenCalled();
  });

  it("does nothing when the user cancels the confirmation", async () => {
    const run = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<ActionButton run={run} confirm="Sure?">Revoke</ActionButton>);
    await userEvent.click(screen.getByRole("button", { name: "Revoke" }));
    expect(run).not.toHaveBeenCalled();
  });
});
