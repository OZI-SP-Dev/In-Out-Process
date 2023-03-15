import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InRequestNewForm } from "components/InRequest/InRequestNewForm";
import { EMPTYPES } from "constants/EmpTypes";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";

const user = userEvent.setup();

const queryClient = new QueryClient();

// We're not testing useNavigate within this component -- so just mock it for now so the component will load
const mockedUsedNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockedUsedNavigate,
}));

/** Render a InRequestNewForm within a QueryClientProvider, then click on desired Employee Type Radio Button */
const renderThenSelectEmpType = async (empType: EMPTYPES) => {
  render(
    <QueryClientProvider client={queryClient}>
      <InRequestNewForm />
    </QueryClientProvider>
  );

  // Click on the appropriate empType radio button
  const empTypeOpt = screen.getByRole("radio", { name: empType });
  await user.click(empTypeOpt);
};

/** Search for an Input by it's Label, and ensure it is not present */
const checkForInputNotToExist = (labelText: RegExp) => {
  const field = screen.queryByLabelText(labelText);
  expect(field).not.toBeInTheDocument();
};

/** Check that ensures the Position Sensitivty Code is properly disabled */
const notSelectablePSC = async (empType: EMPTYPES) => {
  await renderThenSelectEmpType(empType);

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
const isNotApplicablePSC = async (empType: EMPTYPES) => {
  await renderThenSelectEmpType(empType);

  // Check placeholder is N/A
  const psc = screen.getByRole("combobox", {
    name: /position sensitivity code/i,
  });
  expect(psc).toHaveAttribute("placeholder", expect.stringMatching(/N\/A/));

  // Check that value is "" so it is displaying the placeholder
  expect(psc).toHaveValue("");
};

/** Check that ensures the ManPower Control Number (MPCN) is properly enabled */
const isEnterableMPCN = async (empType: EMPTYPES) => {
  await renderThenSelectEmpType(empType);
  // Type in the MPCN input box
  const mpcn = screen.getByRole("textbox", {
    name: /mpcn/i,
  });
  await user.type(mpcn, "1234567");

  // Ensure value of MPCN now matches what we typed
  expect(mpcn).toHaveValue("1234567");
};

describe("ManPower Control Number (MPCN)", () => {
  it("is available for Civilian", async () => {
    await isEnterableMPCN(EMPTYPES.Civilian);
  });

  it("is available for Miliary", async () => {
    await isEnterableMPCN(EMPTYPES.Military);
  });

  it("is not selectable for Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);

    // Type in the MPCN input box
    const mpcn = screen.getByRole("textbox", {
      name: /mpcn/i,
    });
    await user.type(mpcn, "1234567");

    // Ensure value of MPCN is still ""
    expect(mpcn).toHaveValue("");
  });

  it("displays N/A for Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);

    // Check placeholder is N/A
    const mpcn = screen.getByRole("textbox", {
      name: /mpcn/i,
    });
    expect(mpcn).toHaveAttribute("placeholder", expect.stringMatching(/N\/A/));

    // Check that value is "" so it is displaying the placeholder
    expect(mpcn).toHaveValue("");
  });

  const shortMPCN = /mpcn cannot be less than 7 digits/i;
  const longMPCN = /mpcn cannot be more than 7 digits/i;
  const characterMPCN = /mpcn can only consist of numbers/i;

  const validMPCN = ["1234567", "0000000"];

  it.each(validMPCN)("no error on valid values - %s", async (mpcn) => {
    await renderThenSelectEmpType(EMPTYPES.Civilian);

    // Type in the MPCN input box
    const mpcnFld = screen.getByRole("textbox", {
      name: /mpcn/i,
    });
    await user.type(mpcnFld, mpcn ? mpcn : "");

    // Ensure value of MPCN now matches what we typed
    expect(mpcnFld).toHaveValue(mpcn);

    // Ensure the element is Invalid or Valid depending on what we are expecting
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
    "shows error on invalid values - $mpcn",
    async ({ mpcn, err }) => {
      await renderThenSelectEmpType(EMPTYPES.Civilian);

      // Type in the MPCN input box
      const mpcnFld = screen.getByRole("textbox", {
        name: /mpcn/i,
      });
      await user.type(mpcnFld, mpcn ? mpcn : "");

      // Ensure the correct error message is displayed
      const errText = screen.queryByText(err);
      expect(errText).toBeInTheDocument();
    }
  );
});

describe("Position Sensitivity Code", () => {
  it("is available for Civilian", async () => {
    await renderThenSelectEmpType(EMPTYPES.Civilian);

    // Click on the PSC
    const psc = screen.getByRole("combobox", {
      name: /position sensitivity code/i,
    });
    await user.click(psc);

    //Ensure that it comes up with an item to select
    const pscOpt = screen.getByRole("option", {
      name: SENSITIVITY_CODES[0].text,
    });
    expect(pscOpt).toBeInTheDocument();
  });

  it("is not selectable for Contractor", async () => {
    await notSelectablePSC(EMPTYPES.Contractor);
  });

  it("displays N/A for Contractor", async () => {
    await isNotApplicablePSC(EMPTYPES.Contractor);
  });

  it("is not selectable for Miliary", async () => {
    await notSelectablePSC(EMPTYPES.Military);
  });

  it("displays N/A for Military", async () => {
    await isNotApplicablePSC(EMPTYPES.Military);
  });
});

describe("Has Existing Contractor CAC", () => {
  const hasExistingCACLabel =
    /does the support contractor have an existing contractor cac\?/i;
  it("is selectable for Contractors", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);

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
    await renderThenSelectEmpType(EMPTYPES.Military);
    await checkForInputNotToExist(hasExistingCACLabel);
  });

  it("is not available for Civilians", async () => {
    await renderThenSelectEmpType(EMPTYPES.Civilian);
    await checkForInputNotToExist(hasExistingCACLabel);
  });
});
