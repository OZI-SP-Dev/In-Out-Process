import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ctrRequest,
  civRequest,
  milRequest,
} from "components/InRequest/__tests__/TestData";
import { InRequestEditPanel } from "components/InRequest/InRequestEditPanel";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IInRequest } from "api/RequestApi";

const queryClient = new QueryClient();
const user = userEvent.setup();

/** Check that ensures the Position Sensitivty Code is properly disabled */
const notSelectablePSC = async (request: IInRequest) => {
  render(
    <QueryClientProvider client={queryClient}>
      <InRequestEditPanel
        onEditCancel={() => {}}
        isEditPanelOpen={true}
        onEditSave={() => {}}
        data={request}
      />
    </QueryClientProvider>
  );

  // Click on the PSC
  const psc = screen.getByRole("combobox", {
    name: /position sensitivity code/i,
  });
  await user.click(psc);

  //Ensure that it doesn't come up with an item to select
  const pscOpt = screen.queryByRole("option", {
    name: SENSITIVITY_CODES[0].text,
  });
  expect(pscOpt).not.toBeInTheDocument();
};

/** Check that ensures N/A is displayed properly when Position Sensitivity Code is N/A */
const isNotApplicablePSC = async (request: IInRequest) => {
  render(
    <QueryClientProvider client={queryClient}>
      <InRequestEditPanel
        onEditCancel={() => {}}
        isEditPanelOpen={true}
        onEditSave={() => {}}
        data={ctrRequest}
      />
    </QueryClientProvider>
  );

  // Check placeholder is N/A
  const psc = screen.getByRole("combobox", {
    name: /position sensitivity code/i,
  });
  expect(psc).toHaveAttribute("placeholder", expect.stringMatching(/N\/A/));

  // Check that value is "" so it is displaying the placeholder
  expect(psc).toHaveValue("");
};

// Currently this field should not be EDITABLE -- may eventually update so that it can be changed for CIV
describe("Position Sensitivity Code", () => {
  it("is not selectable for Civilian", async () => {
    await notSelectablePSC(civRequest);
  });

  it("is not selectable for Contractor", async () => {
    await notSelectablePSC(ctrRequest);
  });

  it("displays N/A for Contractor", async () => {
    await isNotApplicablePSC(ctrRequest);
  });

  it("is not selectable for Military", async () => {
    await notSelectablePSC(milRequest);
  });

  it("displays N/A for Military", async () => {
    await isNotApplicablePSC(milRequest);
  });
});
