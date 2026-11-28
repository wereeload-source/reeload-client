import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiClient } from "@/lib/api-client";
import { RecordPayment } from "./record";

vi.mock("@/lib/api-client", async (orig) => {
  const real = await orig<typeof import("@/lib/api-client")>();
  return { ...real, apiClient: { post: vi.fn().mockResolvedValue({}) } };
});

describe("RecordPayment (Accounts mockup)", () => {
  it("needs a reference for UPI, warns above the balance, and records the payment", async () => {
    const user = userEvent.setup();
    render(<RecordPayment jobId="j1" balance={12600} owed={18000} canPay />);
    const record = screen.getByRole("button", { name: "Record payment" });

    await user.type(screen.getByRole("textbox", { name: /Amount/ }), "20000");
    expect(screen.getByRole("status")).toHaveTextContent("more than the balance of ₹12,600");
    await user.clear(screen.getByRole("textbox", { name: /Amount/ }));
    await user.type(screen.getByRole("textbox", { name: /Amount/ }), "12600");
    expect(record).toBeDisabled(); // UPI needs its transaction ID

    await user.type(screen.getByRole("textbox", { name: /Reference/ }), "UPI 556677");
    expect(record).toBeEnabled();
    await user.click(record);
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith("/jobs/j1/payments", { amount: 12600, method: "upi", reference: "UPI 556677" }));
  });

  it("does not ask for a reference for cash", async () => {
    const user = userEvent.setup();
    render(<RecordPayment jobId="j1" balance={500} owed={500} canPay />);
    await user.type(screen.getByRole("textbox", { name: /Amount/ }), "500");
    await user.click(screen.getByRole("radio", { name: "Cash" })); // single-choice toggle group
    expect(screen.getByRole("button", { name: "Record payment" })).toBeEnabled();
  });

  it("says Paid and blocks recording when nothing is owed", () => {
    render(<RecordPayment jobId="j1" balance={0} owed={500} canPay />);
    expect(screen.getByRole("status")).toHaveTextContent("This job is Paid");
    expect(screen.getByRole("button", { name: "Record payment" })).toBeDisabled();
  });
});
