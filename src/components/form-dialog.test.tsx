import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { router } from "@/test/setup";
import { TextInput } from "./fields";
import { FormDialog } from "./form-dialog";

function setup(onSubmit: (f: FormData) => Promise<unknown>) {
  render(
    <FormDialog trigger="Log call" title="Log a call" onSubmit={onSubmit}>
      <TextInput name="name" label="Client" isRequired />
    </FormDialog>,
  );
}

describe("FormDialog", () => {
  it("opens, sends the typed values and closes on success", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    setup(onSubmit);
    await userEvent.click(screen.getByRole("button", { name: "Log call" }));
    await userEvent.type(await screen.findByLabelText(/Client/), "Asha Films");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect((onSubmit.mock.calls[0][0] as FormData).get("name")).toBe("Asha Films");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(router.refresh).toHaveBeenCalled();
  });

  it("keeps the dialog open and shows the error when saving fails", async () => {
    setup(() => Promise.reject(new Error("Enter the client phone number")));
    await userEvent.click(screen.getByRole("button", { name: "Log call" }));
    await userEvent.type(await screen.findByLabelText(/Client/), "X");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Enter the client phone number")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(router.refresh).not.toHaveBeenCalled();
  });
});
