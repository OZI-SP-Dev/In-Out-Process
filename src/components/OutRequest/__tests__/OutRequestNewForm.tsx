import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OutRequestNewForm from "components/OutRequest/OutRequestNewForm";
import { EMPTYPES } from "constants/EmpTypes";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";
import {
  fieldLabels,
  checkForInputToExist,
  isNotApplicable,
} from "components/OutRequest/__tests__/TestData";
import { SAR_CODES } from "constants/SARCodes";
import { vi } from "vitest";

const user = userEvent.setup();

const queryClient = new QueryClient();

vi.mock("react-router-dom");
vi.mock("api/EmailApi");

/** Render a OutRequestNewForm within a QueryClientProvider, then click on desired Employee Type Radio Button */
const renderThenSelectEmpType = async (empType: EMPTYPES) => {
  render(
    <QueryClientProvider client={queryClient}>
      <OutRequestNewForm />
    </QueryClientProvider>
  );

  // Click on the appropriate empType radio button
  const empTypeOpt = screen.getByRole("radio", { name: empType });
  await user.click(empTypeOpt);
};

/** Check for working input */
/* TODO - Hold as possible Out Processing --
const checkEnterableTextbox = async (
  fieldName: RegExp,
  text: string | undefined
) => {
  // Type in the input box
  const textboxField = screen.getByRole("textbox", {
    name: fieldName,
  });

  // We have to allow the parameter to be undefined, but we need to throw error if it was
  expect(text).not.toBeUndefined();

  await user.type(textboxField, text ? text : "");

  // Ensure value now matches what we typed
  await waitFor(() => expect(textboxField).toHaveValue(text));
};*/

const checkEnterableCombobox = async (
  fieldName: RegExp,
  text: string | undefined,
  available: boolean
) => {
  // Type in the input box
  const comboboxField = screen.getByRole("combobox", {
    name: fieldName,
  });

  // We have to allow the parameter to be undefined, but we need to throw error if it was
  expect(text).not.toBeUndefined();

  // Typing is causing some Jest errors -- test by clicking the combobox which should make the options appear if enabled
  await user.click(comboboxField);

  if (available) {
    // Use async call to ensure the element appears
    const comboboxOpt = await screen.findByRole("option", {
      name: text,
    });

    await user.click(comboboxOpt);

    // Ensure value now matches what we selected
    await waitFor(() => expect(comboboxField).toHaveValue(text));
  } else {
    const comboboxOpt = screen.queryByRole("option", {
      name: text,
    });
    // Ensure the combobox option list doesn't appear since it is disabled
    expect(comboboxOpt).not.toBeInTheDocument();
  }
};

describe("SAR", () => {
  const employeeTypes = [
    { empType: EMPTYPES.Civilian, available: true },
    { empType: EMPTYPES.Contractor, available: false },
    { empType: EMPTYPES.Military, available: true },
  ];
  const requiredSAR = /sar is required/i;
  it.each(employeeTypes)(
    "is available for $empType ($available)",
    async ({ empType, available }) => {
      await renderThenSelectEmpType(empType);
      await checkEnterableCombobox(
        fieldLabels.SAR.form,
        SAR_CODES[0].text,
        available
      );
    }
  );

  it("displays N/A for Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);
    isNotApplicable(fieldLabels.SAR.formType, fieldLabels.SAR.form);
  });

  const validSAR = SAR_CODES.map((code) => code.text);

  it.each(validSAR)("no error on valid values - %s", async (sar) => {
    await renderThenSelectEmpType(EMPTYPES.Civilian);
    await checkEnterableCombobox(fieldLabels.SAR.form, sar, true);

    const sarFld = screen.getByRole("combobox", {
      name: fieldLabels.SAR.form,
    });

    // No error text is displayed
    const errText = within(sarFld).queryByText(requiredSAR);
    expect(errText).not.toBeInTheDocument();
  });

  const invalidSAR = [
    "3", // Cannot be a number not in SAR code
    "#", // Cannot be a symbol
    "a", // Cannot have alphanumeric
  ];

  // TODO: Re-write how to test this and renable, as you can't really "select" an invalid entry from the popup
  it.skip.each(invalidSAR)(
    "shows error on invalid values - %s",
    async (sar) => {
      await renderThenSelectEmpType(EMPTYPES.Civilian);
      await checkEnterableCombobox(fieldLabels.SAR.form, sar, false);

      const sarFld = screen.getByRole("combobox", {
        name: fieldLabels.SAR.form,
      });

      // Error text is displayed
      expect(sarFld).toHaveAccessibleDescription(requiredSAR);
    }
  );
});

describe("Position Sensitivity Code", () => {
  const employeeTypes = [
    { empType: EMPTYPES.Civilian, available: true },
    { empType: EMPTYPES.Contractor, available: false },
    { empType: EMPTYPES.Military, available: false },
  ];

  // Avaialable only to Civilian
  it.each(employeeTypes)(
    "is available for $empType - $available",
    async ({ empType, available }) => {
      await renderThenSelectEmpType(empType);
      await checkEnterableCombobox(
        fieldLabels.POSITION_SENSITIVITY_CODE.form,
        SENSITIVITY_CODES[0].text,
        available
      );
    }
  );

  it("displays N/A for Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);
    isNotApplicable(
      fieldLabels.POSITION_SENSITIVITY_CODE.formType,
      fieldLabels.POSITION_SENSITIVITY_CODE.form
    );
  });

  it("displays N/A for Military", async () => {
    await renderThenSelectEmpType(EMPTYPES.Military);
    isNotApplicable(
      fieldLabels.POSITION_SENSITIVITY_CODE.formType,
      fieldLabels.POSITION_SENSITIVITY_CODE.form
    );
  });
});

describe("Has Existing Contractor CAC", () => {
  it("is selectable for Contractors", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);

    // Locate the RadioGroup for Existing CAC
    const hasCAC = screen.getByRole("radiogroup", {
      name: fieldLabels.EXISTING_CAC.form,
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
    checkForInputToExist(fieldLabels.EXISTING_CAC.form, false);
  });

  it("is not available for Civilians", async () => {
    await renderThenSelectEmpType(EMPTYPES.Civilian);
    checkForInputToExist(fieldLabels.EXISTING_CAC.form, false);
  });
});

describe("Local Or Remote", () => {
  const employeeTypes = [
    { empType: EMPTYPES.Civilian },
    { empType: EMPTYPES.Contractor },
    { empType: EMPTYPES.Military },
  ];

  it.each(employeeTypes)("is selectable for $empType", async ({ empType }) => {
    await renderThenSelectEmpType(empType);

    // Locate the RadioGroup for Local/Remote
    const localOrRemote = screen.getByRole("radiogroup", {
      name: fieldLabels.LOCAL_OR_REMOTE.form,
    });

    const localBttn = within(localOrRemote).getByLabelText(/local/i);
    const remoteBttn = within(localOrRemote).getByLabelText(/remote/i);

    // Click "Local" and ensure it reflects checked and that "Remote" is not
    await user.click(localBttn);
    expect(localBttn).toBeChecked();
    expect(remoteBttn).not.toBeChecked();

    // Click "Remote" and ensure it reflects checked and that "Local" is not
    await user.click(remoteBttn);
    expect(remoteBttn).toBeChecked();
    expect(localBttn).not.toBeChecked();
  });

  it.each(employeeTypes)(
    "displays hint text for $empType",
    async ({ empType }) => {
      await renderThenSelectEmpType(empType);

      // Locate the RadioGroup for Local/Remote
      const localOrRemote = screen.getByRole("radiogroup", {
        name: fieldLabels.LOCAL_OR_REMOTE.form,
      });

      expect(localOrRemote).toHaveAccessibleDescription(
        /greater than 50 miles qualifies as remote/i
      );
    }
  );
});
