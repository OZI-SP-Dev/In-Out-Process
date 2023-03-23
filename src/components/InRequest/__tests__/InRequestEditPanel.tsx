import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ctrRequest,
  civRequest,
  milRequest,
  remoteLocationDataset,
  remoteLocationOnlyDataset,
  fieldLabels,
} from "components/InRequest/__tests__/TestData";
import { InRequestEditPanel } from "components/InRequest/InRequestEditPanel";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IInRequest } from "api/RequestApi";
import { EMPTYPES } from "constants/EmpTypes";
import { SAR_CODES } from "constants/SARCodes";

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
  text?: string | undefined
) => {
  // Type in the input box
  const textboxField = screen.getByRole("textbox", {
    name: fieldName,
  });

  // We have to allow the parameter to be undefined, but we need to throw error if it was
  expect(text).not.toBeUndefined();

  // Clear the input, then type the passed in data
  await user.clear(textboxField);
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
const notSelectablePSC = async (request: IInRequest) => {
  renderEditPanelForRequest(request);

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
const isNotApplicablePSC = async (request: IInRequest) => {
  renderEditPanelForRequest(request);

  // Check placeholder is N/A
  const psc = screen.getByRole("combobox", {
    name: fieldLabels.POSITION_SENSITIVITY_CODE.form,
  });
  expect(psc).toHaveAttribute("placeholder", expect.stringMatching(/N\/A/));

  // Check that value is "" so it is displaying the placeholder
  expect(psc).toHaveValue("");
};

describe("ManPower Control Number (MPCN)", () => {
  it("is available for Civilian", async () => {
    renderEditPanelForRequest(civRequest);
    await checkEnterableTextbox(
      fieldLabels.MPCN.form,
      civRequest.MPCN?.toString()
    );
  });

  it("is available for Miliary", async () => {
    renderEditPanelForRequest(milRequest);
    await checkEnterableTextbox(
      fieldLabels.MPCN.form,
      milRequest.MPCN?.toString()
    );
  });

  it("is not selectable for Contractor", async () => {
    renderEditPanelForRequest(ctrRequest);

    // Type in the MPCN input box
    const mpcn = screen.getByRole("textbox", {
      name: fieldLabels.MPCN.form,
    });
    await user.type(mpcn, "1234567");
    // Ensure value of MPCN is still ""
    await waitFor(() => expect(mpcn).toHaveValue(""));
  });

  it("displays N/A for Contractor", async () => {
    renderEditPanelForRequest(ctrRequest);

    // Check placeholder is N/A
    const mpcnFld = screen.getByRole("textbox", {
      name: fieldLabels.MPCN.form,
    });
    expect(mpcnFld).toHaveAttribute(
      "placeholder",
      expect.stringMatching(/N\/A/)
    );

    // Check that value is "" so it is displaying the placeholder
    expect(mpcnFld).toHaveValue("");
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
      name: fieldLabels.MPCN.form,
    });
    await user.clear(mpcnFld);
    await user.type(mpcnFld, mpcn ? mpcn : "");
    await waitFor(() => expect(mpcnFld).toHaveValue(mpcn));

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
        name: fieldLabels.MPCN.form,
      });
      await user.clear(mpcnFld);
      await user.type(mpcnFld, mpcn ? mpcn : "");
      await waitFor(() => expect(mpcnFld).toHaveValue(mpcn));

      // Ensure the appropriate error displays
      const errText = screen.queryByText(err);
      expect(errText).toBeInTheDocument();
    }
  );
});

describe("SAR", () => {
  // SAR is currently a disabled field in Edit mode
  const employeeTypes = [
    { request: civRequest, available: false },
    { request: ctrRequest, available: false },
    { request: milRequest, available: false },
  ];

  it.each(employeeTypes)(
    "is available for $request.empType - $available",
    async ({ request, available }) => {
      renderEditPanelForRequest(request);
      await checkEnterableCombobox(
        fieldLabels.SAR.form,
        SAR_CODES[0].text,
        available
      );
    }
  );

  it("displays N/A for Contractor", async () => {
    renderEditPanelForRequest(ctrRequest);

    // Check placeholder is N/A
    const sar = screen.getByRole("combobox", {
      name: fieldLabels.SAR.form,
    });
    expect(sar).toHaveAttribute("placeholder", expect.stringMatching(/N\/A/));

    // Check that value is "" so it is displaying the placeholder
    expect(sar).toHaveValue("");
  });
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
  it("is selectable for Contractors", async () => {
    renderEditPanelForRequest(ctrRequest);

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
    renderEditPanelForRequest(milRequest);
    checkForInputToExist(fieldLabels.EXISTING_CAC.form, false);
  });

  it("is not available for Civilians", async () => {
    renderEditPanelForRequest(civRequest);
    checkForInputToExist(fieldLabels.EXISTING_CAC.form, false);
  });
});

describe("Local Or Remote", () => {
  const employeeTypes = [
    { empType: EMPTYPES.Civilian, request: civRequest },
    { empType: EMPTYPES.Contractor, request: ctrRequest },
    { empType: EMPTYPES.Military, request: milRequest },
  ];

  it.each(employeeTypes)(
    "is selectable for $empType",
    async ({ empType, request }) => {
      renderEditPanelForRequest(request);

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
    }
  );

  it.each(employeeTypes)(
    "displays hint text for $empType",
    async ({ empType, request }) => {
      renderEditPanelForRequest(request);

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
      renderEditPanelForRequest(request);

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
      renderEditPanelForRequest(request);

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
});

describe("Contract Number", () => {
  const employeeTypes = [
    { request: civRequest },
    { request: ctrRequest },
    { request: milRequest },
  ];

  it.each(employeeTypes)(
    "is displayed only for Contractors - $request.empType",
    async ({ request }) => {
      renderEditPanelForRequest(request);

      if (request.empType === EMPTYPES.Contractor) {
        checkForInputToExist(fieldLabels.CONTRACT_NUMBER.form, true);
      } else {
        checkForInputToExist(fieldLabels.CONTRACT_NUMBER.form, false);
      }
    }
  );

  it("is editable when Contractor", async () => {
    renderEditPanelForRequest(ctrRequest);
    await checkEnterableTextbox(
      fieldLabels.CONTRACT_NUMBER.form,
      ctrRequest.contractNumber
    );
  });
});

describe("Contract End Date", () => {
  const employeeTypes = [
    { request: civRequest },
    { request: ctrRequest },
    { request: milRequest },
  ];

  it.each(employeeTypes)(
    "is displayed only for Contractors - $request.empType",
    async ({ request }) => {
      renderEditPanelForRequest(request);

      if (request.empType === EMPTYPES.Contractor) {
        checkForInputToExist(fieldLabels.CONTRACT_END_DATE.form, true);
      } else {
        checkForInputToExist(fieldLabels.CONTRACT_END_DATE.form, false);
      }
    }
  );
  // TODO: Build out testing for Date Picker selection
});

describe("Requires SCI", () => {
  const validSAR = SAR_CODES.map((code) => code.key);
  const validSARWithout5 = validSAR.filter((code) => code !== 5);

  // Currently field is not editable -- this may change as we explore updating tasks based on changes
  it("is disabled for Military with SAR of 5", async () => {
    renderEditPanelForRequest(milRequest);

    const sci = screen.getByRole("radiogroup", {
      name: fieldLabels.REQUIRES_SCI.form,
    });

    const yesBttn = within(sci).getByRole("radio", { name: /yes/i });
    const noBttn = within(sci).getByRole("radio", { name: /no/i });
    expect(yesBttn).toBeDisabled();
    expect(noBttn).toBeDisabled();
  });

  // Should not be available to Military if the SAR is a value other than 5
  it.each(validSARWithout5)(
    "is unavailable for Military with SAR of %s",
    async (sar) => {
      const milRequestSAR = { ...milRequest, SAR: sar };
      renderEditPanelForRequest(milRequestSAR);

      const sci = screen.queryByRole("radiogroup", {
        name: fieldLabels.REQUIRES_SCI.form,
      });
      expect(sci).not.toBeInTheDocument();
    }
  );

  it("is unavailable for Contractor", async () => {
    renderEditPanelForRequest(ctrRequest);

    const sci = screen.queryByRole("radiogroup", {
      name: fieldLabels.REQUIRES_SCI.form,
    });
    expect(sci).not.toBeInTheDocument();
  });

  it.each(validSAR)(
    "is unavailable for Civilian regardless of SAR - %s",
    async (sar) => {
      const civRequestSAR = { ...civRequest, SAR: sar };
      renderEditPanelForRequest(civRequestSAR);

      const sci = screen.queryByRole("radiogroup", {
        name: fieldLabels.REQUIRES_SCI.form,
      });
      expect(sci).not.toBeInTheDocument();
    }
  );
});
