import { render, screen, within } from "@testing-library/react";
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

/** Render an open InRequestEditPanel within a QueryClientProvider */
const renderEditPanelForRequest = (request: IInRequest) => {
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
};

/** Search for an Input by it's Label, and ensure it is not present */
const checkForInputNotToExist = (labelText: RegExp) => {
  const field = screen.queryByLabelText(labelText);
  expect(field).not.toBeInTheDocument();
};

/** Check that ensures the Position Sensitivty Code is properly disabled */
const notSelectablePSC = async (request: IInRequest) => {
  await renderEditPanelForRequest(request);

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
  renderEditPanelForRequest(request);

  // Check placeholder is N/A
  const psc = screen.getByRole("combobox", {
    name: /position sensitivity code/i,
  });
  expect(psc).toHaveAttribute("placeholder", expect.stringMatching(/N\/A/));

  // Check that value is "" so it is displaying the placeholder
  expect(psc).toHaveValue("");
};

/** Check that ensures the ManPower Control Number (MPCN) is properly enabled */
const isEnterableMPCN = async (request: IInRequest) => {
  renderEditPanelForRequest(request);

  // Type in the MPCN input box
  const mpcn = screen.getByRole("textbox", {
    name: /mpcn/i,
  });

  // Clear the input, then type the passed in data
  await user.clear(mpcn);
  await user.type(mpcn, "1234567");

  // Ensure value of MPCN now matches what we typed
  expect(mpcn).toHaveValue("1234567");
};

describe("ManPower Control Number (MPCN)", () => {
  it("is available for Civilian", async () => {
    await isEnterableMPCN(civRequest);
  });

  it("is available for Miliary", async () => {
    await isEnterableMPCN(milRequest);
  });

  it("is not selectable for Contractor", async () => {
    renderEditPanelForRequest(ctrRequest);

    // Type in the MPCN input box
    const mpcn = screen.getByRole("textbox", {
      name: /mpcn/i,
    });
    await user.type(mpcn, "1234567");
    // Ensure value of MPCN is still ""
    expect(mpcn).toHaveValue("");
  });

  it("displays N/A for Contractor", async () => {
    renderEditPanelForRequest(ctrRequest);

    // Check placeholder is N/A
    const psc = screen.getByRole("textbox", {
      name: /mpcn/i,
    });
    expect(psc).toHaveAttribute("placeholder", expect.stringMatching(/N\/A/));

    // Check that value is "" so it is displaying the placeholder
    expect(psc).toHaveValue("");
  });

  const shortMPCN = /mpcn cannot be less than 7 digits/i;
  const longMPCN = /mpcn cannot be more than 7 digits/i;
  const characterMPCN = /mpcn can only consist of numbers/i;

  const validMPCN = ["1234567", "0000000"];

  it.each(validMPCN)("no error on valid values - %s", async (mpcn) => {
    render(
      <QueryClientProvider client={queryClient}>
        <InRequestEditPanel
          onEditCancel={() => {}}
          isEditPanelOpen={true}
          onEditSave={() => {}}
          data={milRequest}
        />
      </QueryClientProvider>
    );

    // Clear the input, then type the passed in data
    const mpcnFld = screen.getByRole("textbox", {
      name: /mpcn/i,
    });
    await user.clear(mpcnFld);
    await user.type(mpcnFld, mpcn ? mpcn : "");

    // Ensure the error messages don't display
    const errText = screen.queryByText(shortMPCN || longMPCN || characterMPCN);
    expect(errText).not.toBeInTheDocument();
  });

  const invalidMPCN = [
    { mpcn: "123", err: shortMPCN }, // Cannot be less than 7 characters
    { mpcn: "12345678", err: longMPCN }, // Cannot be more than 7 characters
    { mpcn: "1ab2345", err: characterMPCN }, // Cannot have alphanumeric
    { mpcn: "1@#3456", err: characterMPCN }, // Cannot have symbols
    { mpcn: "-1234567", err: characterMPCN }, // Cannot be a negative number
    { mpcn: "1a23456789", err: characterMPCN }, // Alphanumeric error supercedes max length error
    { mpcn: "1a2", err: characterMPCN }, // Alphanumeric error supercedes min length error
  ];

  it.each(invalidMPCN)(
    "shows error on invalid values  - $mpcn",
    async ({ mpcn, err }) => {
      render(
        <QueryClientProvider client={queryClient}>
          <InRequestEditPanel
            onEditCancel={() => {}}
            isEditPanelOpen={true}
            onEditSave={() => {}}
            data={milRequest}
          />
        </QueryClientProvider>
      );

      // Clear the input, then type the passed in data
      const mpcnFld = screen.getByRole("textbox", {
        name: /mpcn/i,
      });
      await user.clear(mpcnFld);
      await user.type(mpcnFld, mpcn ? mpcn : "");

      // Ensure the appropriate error displays
      const errText = screen.queryByText(err);
      expect(errText).toBeInTheDocument();
    }
  );
});

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

describe("Has Existing Contractor CAC", () => {
  const hasExistingCACLabel =
    /does the support contractor have an existing contractor cac\?/i;
  it("is selectable for Contractors", async () => {
    renderEditPanelForRequest(ctrRequest);

    // Locate the RadioGroup for Existing CAC
    const hasCAC = screen.getByRole("radiogroup", {
      name: hasExistingCACLabel,
    });

    const yesBttn = within(hasCAC).getByLabelText(/yes/i);
    const noBttn = within(hasCAC).getByLabelText(/no/i);

    // Click "Yes" and ensure it reflects checked and that "No" is not
    await user.click(yesBttn);
    expect(yesBttn).toBeChecked();
    expect(noBttn).not.toBeChecked();

    // Click "No" and ensure it reflects checked and that "Yes" is not
    await user.click(noBttn);
    expect(noBttn).toBeChecked();
    expect(yesBttn).not.toBeChecked();
  });

  it("is not available for Miliary", async () => {
    renderEditPanelForRequest(milRequest);
    checkForInputNotToExist(hasExistingCACLabel);
  });

  it("is not available for Civilians", async () => {
    renderEditPanelForRequest(civRequest);
    checkForInputNotToExist(hasExistingCACLabel);
  });
});
