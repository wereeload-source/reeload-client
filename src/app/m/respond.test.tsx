import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiClient } from "@/lib/api-client";
import { Respond } from "./respond";

vi.mock("@/lib/api-client", async (orig) => {
  const real = await orig<typeof import("@/lib/api-client")>();
  return { ...real, apiClient: { post: vi.fn().mockResolvedValue({}) } };
});
// respond.tsx is imported by the shoot page too; signOut is a server action we never call here.
vi.mock("@/app/login/actions", () => ({ signOut: vi.fn(), signIn: vi.fn() }));

describe("reelmaker accept / decline", () => {
  it("accepts in one tap", async () => {
    render(<Respond jobId="j1" />);
    await userEvent.click(screen.getByRole("button", { name: "Accept" }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith("/me/shoots/j1/respond", { accept: true }));
  });

  it("asks for a reason before declining", async () => {
    render(<Respond jobId="j1" />);
    await userEvent.click(screen.getByRole("button", { name: "Decline" }));
    await userEvent.type(await screen.findByLabelText(/Why can.t you do it/), "Unwell today");
    await userEvent.click(screen.getAllByRole("button", { name: "Decline" }).at(-1)!);
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith("/me/shoots/j1/respond", { accept: false, reason: "Unwell today" }));
  });
});
