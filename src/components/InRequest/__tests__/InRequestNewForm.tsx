import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InRequestNewForm from "components/InRequest/InRequestNewForm";
import { EMPTYPES } from "constants/EmpTypes";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";
import {
  civRequest,
  ctrRequest,
  fieldLabels,
  milRequest,
  remoteLocationDataset,
  remoteLocationOnlyDataset,
  checkForInputToExist,
  isNotApplicable,
  checkForErrorMessage,
  lengthTest,
} from "components/InRequest/__tests__/TestData";
import { SAR_CODES } from "constants/SARCodes";
import { OFFICES } from "constants/Offices";
import { vi } from "vitest";

const user = userEvent.setup();

const queryClient = new QueryClient();

vi.mock("react-router-dom");
vi.mock("api/EmailApi");

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

/** Check for working input */
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
};

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

describe("ManPower Control Number (MPCN)", () => {
  it("is available for Civilian", async () => {
    await renderThenSelectEmpType(EMPTYPES.Civilian);
    await checkEnterableTextbox(fieldLabels.MPCN.form, "1234567");
  });

  it("is available for Miliary", async () => {
    await renderThenSelectEmpType(EMPTYPES.Military);
    await checkEnterableTextbox(fieldLabels.MPCN.form, "1234567");
  });

  it("is not selectable for Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);

    // Type in the MPCN input box
    const mpcn = screen.getByRole("textbox", {
      name: fieldLabels.MPCN.form,
    });
    await user.type(mpcn, "1234567");

    // Ensure value of MPCN is still ""
    await waitFor(() => expect(mpcn).toHaveValue(""));
  });

  it("displays N/A for Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);
    isNotApplicable(fieldLabels.MPCN.formType, fieldLabels.MPCN.form);
  });

  const shortMPCN = /mpcn cannot be less than 7 digits/i;
  const longMPCN = /mpcn cannot be more than 7 digits/i;
  const characterMPCN = /mpcn can only consist of numbers/i;

  const validMPCN = ["1234567", "0000000"];

  it.each(validMPCN)("no error on valid values - %s", async (mpcn) => {
    await renderThenSelectEmpType(EMPTYPES.Civilian);

    // Type in the MPCN input box
    const mpcnFld = screen.getByRole("textbox", {
      name: fieldLabels.MPCN.form,
    });
    await user.type(mpcnFld, mpcn ? mpcn : "");

    // Ensure value of MPCN now matches what we typed
    await waitFor(() => expect(mpcnFld).toHaveValue(mpcn));

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
        name: fieldLabels.MPCN.form,
      });
      await user.type(mpcnFld, mpcn ? mpcn : "");
      await waitFor(() => expect(mpcnFld).toHaveValue(mpcn));

      // Ensure the correct error message is displayed
      const errText = screen.queryByText(err);
      expect(errText).toBeInTheDocument();
    }
  );
});

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

describe("Remote Location", () => {
  it.each(remoteLocationDataset)(
    "is displayed/hidden when remote/local respectively - $request.workLocation",
    async ({ request }) => {
      await renderThenSelectEmpType(request.empType);

      // Locate the RadioGroup for Local/Remote
      const localOrRemote = screen.getByRole("radiogroup", {
        name: fieldLabels.LOCAL_OR_REMOTE.form,
      });

      const localOrRemoteBttn = within(localOrRemote).getByRole("radio", {
        name: new RegExp(request.workLocation, "i"),
      });

      // Click "Local" or "Remote"
      await user.click(localOrRemoteBttn);

      if (request.workLocation === "local") {
        checkForInputToExist(fieldLabels.REMOTE_LOCATION.form, false);
      } else {
        checkForInputToExist(fieldLabels.REMOTE_LOCATION.form, true);
      }
    }
  );

  it.each(remoteLocationOnlyDataset)(
    "is editable when remote - $request.workLocationDetail",
    async ({ request }) => {
      await renderThenSelectEmpType(request.empType);

      // Locate the RadioGroup for Local/Remote
      const localOrRemote = screen.getByRole("radiogroup", {
        name: fieldLabels.LOCAL_OR_REMOTE.form,
      });

      const localOrRemoteBttn = within(localOrRemote).getByRole("radio", {
        name: new RegExp(request.workLocation, "i"),
      });

      // Click "Local" or "Remote"
      await user.click(localOrRemoteBttn);
      await checkEnterableTextbox(
        fieldLabels.REMOTE_LOCATION.form,
        request.workLocationDetail
      );
    }
  );

  it.each(lengthTest)(
    "cannot exceed 100 characters - $testString.length",
    async ({ testString }) => {
      await renderThenSelectEmpType(EMPTYPES.Civilian);

      // Locate the RadioGroup for Local/Remote and select Remote so Remote Location field appears
      const localOrRemote = screen.getByRole("radiogroup", {
        name: fieldLabels.LOCAL_OR_REMOTE.form,
      });
      const remoteBttn = within(localOrRemote).getByRole("radio", {
        name: /remote/i,
      });
      await user.click(remoteBttn);

      await checkEnterableTextbox(fieldLabels.REMOTE_LOCATION.form, testString);

      const remLocFld = screen.getByRole("textbox", {
        name: fieldLabels.REMOTE_LOCATION.form,
      });
      checkForErrorMessage(
        remLocFld,
        fieldLabels.REMOTE_LOCATION.lengthError,
        testString.length > 100
      );
    }
  );
});

describe("Contract Number", () => {
  const employeeTypes = [
    { request: civRequest, available: false },
    { request: ctrRequest, available: true },
    { request: milRequest, available: false },
  ];

  it.each(employeeTypes)(
    "is displayed for $request.empType - $available",
    async ({ request, available }) => {
      await renderThenSelectEmpType(request.empType);
      checkForInputToExist(fieldLabels.CONTRACT_NUMBER.form, available);
    }
  );

  it("is editable when Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);
    await checkEnterableTextbox(
      fieldLabels.CONTRACT_NUMBER.form,
      ctrRequest.contractNumber
    );
  });

  it.each(lengthTest)(
    "cannot exceed 100 characters - $testString.length",
    async ({ testString }) => {
      await renderThenSelectEmpType(EMPTYPES.Contractor);
      await checkEnterableTextbox(fieldLabels.CONTRACT_NUMBER.form, testString);

      const ctrNumberFld = screen.getByRole("textbox", {
        name: fieldLabels.CONTRACT_NUMBER.form,
      });
      checkForErrorMessage(
        ctrNumberFld,
        fieldLabels.CONTRACT_NUMBER.lengthError,
        testString.length > 100
      );
    }
  );
});

describe("Contract End Date", () => {
  const employeeTypes = [
    { request: civRequest, available: false },
    { request: ctrRequest, available: true },
    { request: milRequest, available: false },
  ];

  it.each(employeeTypes)(
    "is displayed for $request.empType - $available",
    async ({ request, available }) => {
      await renderThenSelectEmpType(request.empType);
      checkForInputToExist(fieldLabels.CONTRACT_END_DATE.form, available);
    }
  );
  // TODO: Build out testing for Date Picker selection
});

describe("Requires SCI", () => {
  const validSAR = SAR_CODES.map((code) => code.key);
  const validSARWithout5 = validSAR.filter((code) => code !== 5);

  it("is selectable for Military with SAR of 5", async () => {
    await renderThenSelectEmpType(EMPTYPES.Military);

    // Locate the SAR combobox
    const sar = screen.getByRole("combobox", {
      name: fieldLabels.SAR.form,
    });

    await user.click(sar);

    const opt5 = await screen.findByRole("option", { name: "5" });

    await user.click(opt5);

    const sci = screen.getByRole("radiogroup", {
      name: fieldLabels.REQUIRES_SCI.form,
    });

    const yesBttn = within(sci).getByLabelText(/yes/i);
    const noBttn = within(sci).getByLabelText(/no/i);

    // Click "Yes" and ensure it reflects checked and that "No" is not
    await user.click(yesBttn);
    expect(yesBttn).toBeChecked();
    expect(noBttn).not.toBeChecked();

    // Click "No" and ensure it reflects checked and that "Yes" is not
    await user.click(noBttn);
    expect(noBttn).toBeChecked();
    expect(yesBttn).not.toBeChecked();
  });

  it.each(validSARWithout5)(
    "is not selectable for Military with SAR of %s",
    async (sar) => {
      await renderThenSelectEmpType(EMPTYPES.Military);

      // Locate the SAR combobox
      const sarFld = screen.getByRole("combobox", {
        name: fieldLabels.SAR.form,
      });

      await user.click(sarFld);

      const opt = await screen.findByRole("option", { name: sar.toString() });

      await user.click(opt);

      const sci = screen.queryByRole("radiogroup", {
        name: fieldLabels.REQUIRES_SCI.form,
      });
      expect(sci).not.toBeInTheDocument();
    }
  );

  it("is not selectable for Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);

    const sci = screen.queryByRole("radiogroup", {
      name: fieldLabels.REQUIRES_SCI.form,
    });
    expect(sci).not.toBeInTheDocument();
  });

  it.each(validSAR)(
    "is not selectable for Civilian with SAR of %s",
    async (sar) => {
      await renderThenSelectEmpType(EMPTYPES.Civilian);

      // Locate the SAR combobox
      const sarFld = screen.getByRole("combobox", {
        name: fieldLabels.SAR.form,
      });

      await user.click(sarFld);

      const opt = await screen.findByRole("option", { name: sar.toString() });

      await user.click(opt);

      const sci = screen.queryByRole("radiogroup", {
        name: fieldLabels.REQUIRES_SCI.form,
      });
      expect(sci).not.toBeInTheDocument();
    }
  );
});

describe("Employee Name", () => {
  it.each(lengthTest)(
    "cannot exceed 100 characters - $testString.length",
    async ({ testString }) => {
      await renderThenSelectEmpType(EMPTYPES.Civilian);
      await checkEnterableTextbox(fieldLabels.EMPLOYEE_NAME.form, testString);

      const empNameFld = screen.getByRole("textbox", {
        name: fieldLabels.EMPLOYEE_NAME.form,
      });
      checkForErrorMessage(
        empNameFld,
        fieldLabels.EMPLOYEE_NAME.lengthError,
        testString.length > 100
      );
    }
  );
});

describe("Previous Org", () => {
  it.each(lengthTest)(
    "cannot exceed 100 characters - $testString.length",
    async ({ testString }) => {
      await renderThenSelectEmpType(EMPTYPES.Civilian);

      // Must select that Employee is not a new Civilian for the Previous Org to appear
      const newCiv = screen.getByRole("radiogroup", {
        name: fieldLabels.NEW_CIVMIL.form,
      });
      const noBttn = within(newCiv).getByLabelText(/no/i);
      await user.click(noBttn);

      await checkEnterableTextbox(fieldLabels.PREVIOUS_ORG.form, testString);

      const prevOrgFld = screen.getByRole("textbox", {
        name: fieldLabels.PREVIOUS_ORG.form,
      });

      checkForErrorMessage(
        prevOrgFld,
        fieldLabels.PREVIOUS_ORG.lengthError,
        testString.length > 100
      );
    }
  );
});

describe("Grade/Rank", () => {
  const employeeTypes = [
    { empType: EMPTYPES.Civilian, available: true },
    { empType: EMPTYPES.Contractor, available: false },
    { empType: EMPTYPES.Military, available: true },
  ];

  it.each(employeeTypes)(
    "is available for $empType ($available)",
    async ({ empType, available }) => {
      await renderThenSelectEmpType(empType);
      await checkEnterableCombobox(
        fieldLabels.GRADE_RANK.form,
        empType === EMPTYPES.Civilian ? "GS-12" : "O-4",
        available
      );
    }
  );

  it("displays N/A for Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);
    isNotApplicable(
      fieldLabels.GRADE_RANK.formType,
      fieldLabels.GRADE_RANK.form
    );
  });
});

describe("Office", () => {
  const employeeTypes = [
    { empType: EMPTYPES.Civilian, available: true },
    { empType: EMPTYPES.Contractor, available: true },
    { empType: EMPTYPES.Military, available: true },
  ];

  // Avaialable for all employee types
  it.each(employeeTypes)(
    "is available for $empType - $available",
    async ({ empType, available }) => {
      await renderThenSelectEmpType(empType);
      await checkEnterableCombobox(
        fieldLabels.OFFICE.form,
        OFFICES[0].text,
        available
      );
    }
  );
});
