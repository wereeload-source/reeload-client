import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiClient } from "@/lib/api-client";
import type { Candidate, QueueJob } from "@/lib/types";
import { AssignBoard } from "./board";

vi.mock("@/lib/api-client", async (orig) => {
  const real = await orig<typeof import("@/lib/api-client")>();
  return { ...real, apiClient: { get: vi.fn(), post: vi.fn() } };
});

const job = (id: string, code: string, client: string): QueueJob => ({
  id, code, client_name: client, client_phone: "1", status: "confirmed", city: "Hyderabad", address: null, maps_url: null,
  starts_at: "2026-12-03T04:30:00.000Z", duration_minutes: 120, onsite_contact_name: null, onsite_contact_phone: null,
  brief: "Two reels", consent: true, confirmed_at: null, created_at: "", assignments: [], flagged: id === "j1", hours_to_start: 10, last_release: null,
});
const cand = (id: string, name: string, availability: Candidate["availability"]): Candidate => ({
  id, full_name: name, phone: null, kind: "full_time", base_city: "Hyderabad", same_city: true, availability, shoots_next7_days: 1,
});

describe("AssignBoard", () => {
  it("loads reelmakers for the picked job, blocks busy ones, and assigns the chosen one", async () => {
    vi.mocked(apiClient.get).mockResolvedValue([cand("r1", "Ravi", "free"), cand("r2", "Meera", "busy")]);
    vi.mocked(apiClient.post).mockResolvedValue({});
    render(<AssignBoard jobs={[job("j1", "RL-1001", "Asha Films")]} />);

    expect(screen.getByText("in 10 h")).toBeInTheDocument();
    expect(screen.getByText("Inside 48 hours")).toBeInTheDocument();
    const list = await screen.findByRole("radiogroup", { name: "Choose a reelmaker" });
    expect(apiClient.get).toHaveBeenCalledWith("/jobs/j1/candidates");
    expect(within(list).getByRole("radio", { name: /Meera/ })).toBeDisabled();

    expect(screen.getByRole("button", { name: "Assign" })).toBeDisabled();
    await userEvent.click(within(list).getByRole("radio", { name: /Ravi/ }));
    expect(screen.getByRole("status")).toHaveTextContent("No conflict found for Ravi");
    await userEvent.click(screen.getByRole("button", { name: "Assign Ravi" }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith("/jobs/j1/assign", { reelmaker_id: "r1" }));
  });

  it("shows the API's refusal instead of failing silently", async () => {
    vi.mocked(apiClient.get).mockResolvedValue([cand("r1", "Ravi", "free")]);
    vi.mocked(apiClient.post).mockRejectedValue(new Error("Ravi already has a shoot at that time"));
    render(<AssignBoard jobs={[job("j1", "RL-1001", "Asha Films")]} />);
    await userEvent.click(await screen.findByRole("radio", { name: /Ravi/ }));
    await userEvent.click(screen.getByRole("button", { name: "Assign Ravi" }));
    expect(await screen.findByText("Ravi already has a shoot at that time")).toBeInTheDocument();
  });

  it("says so when there is nothing to assign", () => {
    render(<AssignBoard jobs={[]} />);
    expect(screen.getByText("Every confirmed job has a reelmaker.")).toBeInTheDocument();
  });
});
