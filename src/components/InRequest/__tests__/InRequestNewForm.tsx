import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InRequestNewForm } from "components/InRequest/InRequestNewForm";
import { EMPTYPES } from "constants/EmpTypes";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";
import {
  civRequest,
  ctrRequest,
  fieldLabels,
  milRequest,
  remoteLocationDataset,
  remoteLocationOnlyDataset,
} from "components/InRequest/__tests__/TestData";
import { SAR_CODES } from "constants/SARCodes";

const user = userEvent.setup();

const queryClient = new QueryClient();

// We're not testing useNavigate within this component -- so just mock it for now so the component will load
const mockedUsedNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockedUsedNavigate,
}));

// We're not testing sendInRequestSubmitEmail within this component -- so just mock it for now so the component will load
const mockedUseSendInRequestSubmitEmail = jest.fn();

jest.mock("api/EmailApi", () => ({
  ...(jest.requireActual("api/EmailApi") as any),
  useSendInRequestSubmitEmail: () => mockedUseSendInRequestSubmitEmail,
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

/** Check if there is an input field matching the desired label
 * @param labelText The text we are looking for
 * @param expected Whether or not we expect it in the document or expect it NOT in the document
 */
const checkForInputToExist = (labelText: RegExp, expected: boolean) => {
  const field = screen.queryByLabelText(labelText);

  if (expected) {
    expect(field).toBeInTheDocument();
  } else {
    expect(field).not.toBeInTheDocument();
  }
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

  await user.type(comboboxField, text ? text : "");

  if (available) {
    const comboboxOpt = screen.getByRole("option", {
      name: text,
    });

    await user.click(comboboxOpt);

    // Ensure value now matches what we typed
    await waitFor(() => expect(comboboxField).toHaveValue(text));
  } else {
    const comboboxOpt = screen.queryByRole("option", {
      name: text,
    });
    // Ensure value now matches what we typed
    expect(comboboxOpt).not.toBeInTheDocument();
  }
};

/** Check that ensures the Position Sensitivty Code is properly disabled */
const notSelectablePSC = async (empType: EMPTYPES) => {
  await renderThenSelectEmpType(empType);

  // Click on the PSC
  const psc = screen.getByRole("combobox", {
    name: fieldLabels.POSITION_SENSITIVITY_CODE.form,
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
    name: fieldLabels.POSITION_SENSITIVITY_CODE.form,
  });
  expect(psc).toHaveAttribute("placeholder", expect.stringMatching(/N\/A/));

  // Check that value is "" so it is displaying the placeholder
  expect(psc).toHaveValue("");
};

describe("ManPower Control Number (MPCN)", () => {
  const mpcnLabel = /mpcn/i;
  it("is available for Civilian", async () => {
    await renderThenSelectEmpType(EMPTYPES.Civilian);
    await checkEnterableTextbox(mpcnLabel, "1234567");
  });

  it("is available for Miliary", async () => {
    await renderThenSelectEmpType(EMPTYPES.Military);
    await checkEnterableTextbox(mpcnLabel, "1234567");
  });

  it("is not selectable for Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);

    // Type in the MPCN input box
    const mpcn = screen.getByRole("textbox", {
      name: mpcnLabel,
    });
    await user.type(mpcn, "1234567");

    // Ensure value of MPCN is still ""
    await waitFor(() => expect(mpcn).toHaveValue(""));
  });

  it("displays N/A for Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);

    // Check placeholder is N/A
    const mpcn = screen.getByRole("textbox", {
      name: mpcnLabel,
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
        name: /mpcn/i,
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
  const sarLabel = /sar/i;
  const requiredSAR = /sar is required/i;
  it.each(employeeTypes)(
    "is available for $empType ($available)",
    async ({ empType, available }) => {
      await renderThenSelectEmpType(empType);
      await checkEnterableCombobox(sarLabel, SAR_CODES[0].text, available);
    }
  );

  it("displays N/A for Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);

    // Check placeholder is N/A
    const sar = screen.getByRole("combobox", {
      name: sarLabel,
    });
    expect(sar).toHaveAttribute("placeholder", expect.stringMatching(/N\/A/));

    // Check that value is "" so it is displaying the placeholder
    expect(sar).toHaveValue("");
  });

  const validSAR = SAR_CODES.map((code) => code.text);

  it.each(validSAR)("no error on valid values - %s", async (sar) => {
    await renderThenSelectEmpType(EMPTYPES.Civilian);
    await checkEnterableCombobox(sarLabel, sar, true);

    // Check placeholder is N/A
    const sarFld = screen.getByRole("combobox", {
      name: sarLabel,
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

  it.each(invalidSAR)("shows error on invalid values - %s", async (sar) => {
    await renderThenSelectEmpType(EMPTYPES.Civilian);
    await checkEnterableCombobox(sarLabel, sar, false);

    // Check placeholder is N/A
    const sarFld = screen.getByRole("combobox", {
      name: sarLabel,
    });

    // Error text is displayed
    expect(sarFld).toHaveAccessibleDescription(requiredSAR);
  });
});

describe("Position Sensitivity Code", () => {
  it("is available for Civilian", async () => {
    await renderThenSelectEmpType(EMPTYPES.Civilian);

    // Click on the PSC
    const psc = screen.getByRole("combobox", {
      name: fieldLabels.POSITION_SENSITIVITY_CODE.form,
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
    checkForInputToExist(hasExistingCACLabel, false);
  });

  it("is not available for Civilians", async () => {
    await renderThenSelectEmpType(EMPTYPES.Civilian);
    checkForInputToExist(hasExistingCACLabel, false);
  });
});

describe("Local Or Remote", () => {
  const localOrRemoteLabel = /local or remote\?/i;

  const employeeTypes = [
    { empType: EMPTYPES.Civilian },
    { empType: EMPTYPES.Contractor },
    { empType: EMPTYPES.Military },
  ];

  it.each(employeeTypes)("is selectable for $empType", async ({ empType }) => {
    await renderThenSelectEmpType(empType);

    // Locate the RadioGroup for Local/Remote
    const localOrRemote = screen.getByRole("radiogroup", {
      name: localOrRemoteLabel,
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
        name: localOrRemoteLabel,
      });

      expect(localOrRemote).toHaveAccessibleDescription(
        /greater than 50 miles qualifies as remote/i
      );
    }
  );
});

describe("Remote Location", () => {
  const localOrRemoteLabel = /local or remote\?/i;
  const remoteLocationLabel = /remote location/i;

  it.each(remoteLocationDataset)(
    "is displayed/hidden when remote/local respectively - $request.workLocation",
    async ({ request }) => {
      await renderThenSelectEmpType(request.empType);

      // Locate the RadioGroup for Local/Remote
      const localOrRemote = screen.getByRole("radiogroup", {
        name: localOrRemoteLabel,
      });

      const localOrRemoteBttn = within(localOrRemote).getByRole("radio", {
        name: new RegExp(request.workLocation, "i"),
      });

      // Click "Local" or "Remote"
      await user.click(localOrRemoteBttn);

      if (request.workLocation === "local") {
        checkForInputToExist(remoteLocationLabel, false);
      } else {
        checkForInputToExist(remoteLocationLabel, true);
      }
    }
  );

  it.each(remoteLocationOnlyDataset)(
    "is editable when remote - $request.workLocationDetail",
    async ({ request }) => {
      await renderThenSelectEmpType(request.empType);

      // Locate the RadioGroup for Local/Remote
      const localOrRemote = screen.getByRole("radiogroup", {
        name: localOrRemoteLabel,
      });

      const localOrRemoteBttn = within(localOrRemote).getByRole("radio", {
        name: new RegExp(request.workLocation, "i"),
      });

      // Click "Local" or "Remote"
      await user.click(localOrRemoteBttn);
      await checkEnterableTextbox(
        remoteLocationLabel,
        request.workLocationDetail
      );
    }
  );
});

describe("Contract Number", () => {
  const contractNumberLabel = /contract number/i;

  const employeeTypes = [
    { request: civRequest },
    { request: ctrRequest },
    { request: milRequest },
  ];

  it.each(employeeTypes)(
    "is displayed only for Contractors - $request.empType",
    async ({ request }) => {
      await renderThenSelectEmpType(request.empType);

      if (request.empType === EMPTYPES.Contractor) {
        checkForInputToExist(contractNumberLabel, true);
      } else {
        checkForInputToExist(contractNumberLabel, false);
      }
    }
  );

  it("is editable when Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);
    await checkEnterableTextbox(contractNumberLabel, ctrRequest.contractNumber);
  });
});

describe("Contract End Date", () => {
  const contractEndDateLabel = /contract end date/i;

  const employeeTypes = [
    { request: civRequest },
    { request: ctrRequest },
    { request: milRequest },
  ];

  it.each(employeeTypes)(
    "is displayed only for Contractors - $request.empType",
    async ({ request }) => {
      await renderThenSelectEmpType(request.empType);

      if (request.empType === EMPTYPES.Contractor) {
        checkForInputToExist(contractEndDateLabel, true);
      } else {
        checkForInputToExist(contractEndDateLabel, false);
      }
    }
  );
  // TODO: Build out testing for Date Picker selection
});

describe("Requires SCI", () => {
  const requiresSCILabel = /does employee require sci access\?/i;
  const validSAR = SAR_CODES.map((code) => code.key);
  const validSARWithout5 = validSAR.filter((code) => code !== 5);

  it("is selectable for Military with SAR of 5", async () => {
    await renderThenSelectEmpType(EMPTYPES.Military);

    // Locate the SAR combobox
    const sar = screen.getByRole("combobox", {
      name: /sar/i,
    });

    await user.click(sar);

    const opt5 = await screen.findByRole("option", { name: "5" });

    await user.click(opt5);

    const sci = screen.getByRole("radiogroup", { name: requiresSCILabel });

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
        name: /sar/i,
      });

      await user.click(sarFld);

      const opt = await screen.findByRole("option", { name: sar.toString() });

      await user.click(opt);

      const sci = screen.queryByRole("radiogroup", { name: requiresSCILabel });
      expect(sci).not.toBeInTheDocument();
    }
  );

  it("is not selectable for Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);

    const sci = screen.queryByRole("radiogroup", { name: requiresSCILabel });
    expect(sci).not.toBeInTheDocument();
  });

  it.each(validSAR)(
    "is not selectable for Civilian with SAR of %s",
    async (sar) => {
      await renderThenSelectEmpType(EMPTYPES.Civilian);

      // Locate the SAR combobox
      const sarFld = screen.getByRole("combobox", {
        name: /sar/i,
      });

      await user.click(sarFld);

      const opt = await screen.findByRole("option", { name: sar.toString() });

      await user.click(opt);

      const sci = screen.queryByRole("radiogroup", { name: requiresSCILabel });
      expect(sci).not.toBeInTheDocument();
    }
  );
});
