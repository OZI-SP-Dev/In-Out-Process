import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ctrRequest,
  civRequest,
  milRequest,
  remoteLocationDataset,
  remoteLocationOnlyDataset,
  fieldLabels,
  checkForInputToExist,
  isNotApplicable,
  checkForErrorMessage,
  lengthTest,
  checkForRadioGroupToBeDisabled,
  dutyPhoneTestValues,
} from "components/InRequest/__tests__/TestData";
import { InRequestEditPanel } from "components/InRequest/InRequestEditPanel";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IInRequest } from "api/RequestApi";
import { SAR_CODES } from "constants/SARCodes";
import { EMPTYPES } from "constants/EmpTypes";
import { OFFICES } from "constants/Offices";

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

/**
 * @remarks
 * This function seems to take an exceptionally long time to complete.
 * Recommend bumping timeout for any test that uses it to 20s
 *
 * @param fieldName - name of field to find
 * @param text - name of option to find
 * @param available - whether option should be available or not
 */
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

  await user.click(comboboxField);

  if (available) {
    // Use async call to ensure the element appears
    const comboboxOpt = await screen.findByRole("option", {
      name: text,
    });
    expect(comboboxOpt).toBeDefined();

    // User fierEvent per article on userEvent not working correctly -- causes large delay
    // https://stackoverflow.com/questions/62542988/how-to-test-fluent-ui-dropdown-with-react-testing-library
    fireEvent.click(comboboxOpt);

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
    isNotApplicable(fieldLabels.MPCN.formType, fieldLabels.MPCN.form);
  });

  const shortMPCN = /mpcn must be at least 7 characters/i;
  const nonNumericMPCN = /mpcn cannot contain non-numeric characters in the first 6 positions, unless it starts with 'RAND000-'/i;
  const paqMPCN = /mpcns starting with 'rand000-' must be followed by 6 digits/i
  const longMPCN = /mpcn cannot be more than 7 characters, unless it starts with 'rand000-'/i;
  const sevenCharMPCN = /mpcns that are 7 characters must either be 7 digits, or 6 digits followed by a letter/i;

  
  const validMPCN = ["1234567", "0000000", "RAND000-123456", "123456A"];

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
    await waitFor(() => expect(mpcnFld).toHaveValue(mpcn.toUpperCase()));

    // Ensure the error messages don't display
    const errText = screen.queryByText(
      new RegExp(
        "(" +
          shortMPCN.source +
          ")|(" +
          nonNumericMPCN.source +
          ")|(" +
          paqMPCN.source +
          ")|(" +
          longMPCN.source +
          ")|(" +
          sevenCharMPCN.source +
          ")",
        "i"
      )
    );
    expect(errText).not.toBeInTheDocument();
  });

  const invalidMPCN = [
    { mpcn: "123", err: shortMPCN }, // Cannot be less than 7 characters
    { mpcn: "12345678", err: longMPCN }, // Cannot be more than 7 characters
    { mpcn: "1ab2345", err: sevenCharMPCN }, // Cannot have alpha/special unless last of 7 or RAND000-
    { mpcn: "1@#345", err: nonNumericMPCN }, // Cannot have symbols
    { mpcn: "RAND000-", err: paqMPCN }, // Cannot be a negative number
    { mpcn: "1a23456789", err: longMPCN }, // Alphanumeric error supercedes max length error
    { mpcn: "1234", err: shortMPCN }, // Alphanumeric error supercedes min length error
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
      await waitFor(() => expect(mpcnFld).toHaveValue(mpcn.toUpperCase()));

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
    isNotApplicable(fieldLabels.SAR.formType, fieldLabels.SAR.form);
  });
});

// Currently this field should not be EDITABLE -- may eventually update so that it can be changed for CIV
describe("Position Sensitivity Code", () => {
  const employeeTypes = [
    { request: civRequest },
    { request: ctrRequest },
    { request: milRequest },
  ];
  it.each(employeeTypes)(
    "is not selectable for $request.empType",
    async ({ request }) => {
      renderEditPanelForRequest(request);
      await checkEnterableCombobox(
        fieldLabels.POSITION_SENSITIVITY_CODE.form,
        SENSITIVITY_CODES[0].text,
        false
      );
    }
  );

  it("displays N/A for Contractor", async () => {
    renderEditPanelForRequest(ctrRequest);
    isNotApplicable(
      fieldLabels.POSITION_SENSITIVITY_CODE.formType,
      fieldLabels.POSITION_SENSITIVITY_CODE.form
    );
  });

  it("displays N/A for Military", async () => {
    renderEditPanelForRequest(milRequest);
    isNotApplicable(
      fieldLabels.POSITION_SENSITIVITY_CODE.formType,
      fieldLabels.POSITION_SENSITIVITY_CODE.form
    );
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
    { request: civRequest },
    { request: ctrRequest },
    { request: milRequest },
  ];

  it.each(employeeTypes)(
    "is selectable for $request.empType",
    async ({ request }) => {
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
    "displays hint text for $request.empType",
    async ({ request }) => {
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

  it.each(lengthTest)(
    "cannot exceed 100 characters - $testString.length",
    async ({ testString }) => {
      // Civilian Request has the location set to Remote
      renderEditPanelForRequest(civRequest);

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

  // Should only be available to Contractors
  it.each(employeeTypes)(
    "is displayed for $request.empType - $available",
    async ({ request, available }) => {
      renderEditPanelForRequest(request);
      checkForInputToExist(fieldLabels.CONTRACT_NUMBER.form, available);
    }
  );

  it("is editable when Contractor", async () => {
    renderEditPanelForRequest(ctrRequest);
    await checkEnterableTextbox(
      fieldLabels.CONTRACT_NUMBER.form,
      ctrRequest.contractNumber
    );
  });

  it.each(lengthTest)(
    "cannot exceed 100 characters - $testString.length",
    async ({ testString }) => {
      renderEditPanelForRequest(ctrRequest);
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

  // Should only be available to Contractors
  it.each(employeeTypes)(
    "is displayed for $request.empType - $available",
    async ({ request, available }) => {
      renderEditPanelForRequest(request);
      checkForInputToExist(fieldLabels.CONTRACT_END_DATE.form, available);
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

describe("Employee Name", () => {
  it.each(lengthTest)(
    "cannot exceed 100 characters - $testString.length",
    async ({ testString }) => {
      // Clear out any defined employee -- so that the field is editable
      renderEditPanelForRequest({...civRequest, employee: undefined});
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
      // Civ Request has isNewCivMil set to 'no', so that Previous Org is available
      renderEditPanelForRequest(civRequest);
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
    { request: civRequest, available: true },
    { request: ctrRequest, available: false },
    { request: milRequest, available: true },
  ];

  it.each(employeeTypes)(
    "is available for $request.empType - $available",
    async ({ request, available }) => {
      renderEditPanelForRequest(request);
      await checkEnterableCombobox(
        fieldLabels.GRADE_RANK.form,
        request.empType === EMPTYPES.Civilian ? "GS-12" : "O-4",
        available
      );
    },
    20000
  );

  it("displays N/A for Contractor", async () => {
    renderEditPanelForRequest(ctrRequest);
    isNotApplicable(
      fieldLabels.GRADE_RANK.formType,
      fieldLabels.GRADE_RANK.form
    );
  }, 20000);
});

describe("Office", () => {
  const employeeTypes = [
    { request: civRequest, available: true },
    { request: ctrRequest, available: true },
    { request: milRequest, available: true },
  ];

  it.each(employeeTypes)(
    "is available for $request.empType - $available",
    async ({ request, available }) => {
      renderEditPanelForRequest(request);
      await checkEnterableCombobox(
        fieldLabels.OFFICE.form,
        OFFICES[0].text,
        available
      );
    },
    20000
  );
});

// Currently this field should not be EDITABLE -- may eventually update so that it can be changed for CIV
describe("Has DTS/GTC", () => {
  const employeeTypes = [
    { request: civRequest, available: true },
    { request: milRequest, available: true },
    { request: ctrRequest, available: false },
  ];
  const employeeTypesDisabled = [
    { request: civRequest },
    { request: milRequest },
  ];
  it.each(employeeTypesDisabled)(
    "is disabled for $request.empType",
    async ({ request }) => {
      renderEditPanelForRequest(request);
      checkForRadioGroupToBeDisabled(fieldLabels.IS_TRAVELER.form, true);
    }
  );

  it.each(employeeTypes)(
    "is available for $request.empType - $available",
    async ({ request, available }) => {
      renderEditPanelForRequest(request);
      checkForInputToExist(fieldLabels.IS_TRAVELER.form, available);
    }
  );
});

describe("Job/Duty Title", () => {
  const employeeTypes = [
    { request: civRequest },
    { request: milRequest },
    { request: ctrRequest },
  ];

  // Avaialable for all employee types
  it.each(employeeTypes)("is available for $empType", async ({ request }) => {
    renderEditPanelForRequest(request);
    await checkEnterableTextbox(fieldLabels.JOB_TITLE.form, "Developer");
  });

  // Cannot exceed 100 characters
  it.each(lengthTest)(
    "cannot exceed 100 characters - $testString.length",
    async ({ testString }) => {
      renderEditPanelForRequest(civRequest);
      await checkEnterableTextbox(fieldLabels.JOB_TITLE.form, testString);

      const jobTitleFld = screen.getByRole("textbox", {
        name: fieldLabels.JOB_TITLE.form,
      });

      checkForErrorMessage(
        jobTitleFld,
        fieldLabels.JOB_TITLE.lengthError,
        testString.length > 100
      );
    }
  );
});

describe("Duty Phone #", () => {
  const employeeTypes = [
    { request: civRequest },
    { request: milRequest },
    { request: ctrRequest },
  ];

  // Avaialable for all employee types
  it.each(employeeTypes)("is available for $request.empType", async ({ request }) => {
    renderEditPanelForRequest(request);
    await checkEnterableTextbox(fieldLabels.JOB_TITLE.form, "Developer");
  });

  // Must be a valid formatted phone upon entry
  it.each(dutyPhoneTestValues)(
    "check for valid input - $input",
    async ({ input, value, err }) => {
      renderEditPanelForRequest(civRequest);

      // Type in the Duty Phone input box
      const dutyPhoneFld = screen.getByLabelText(fieldLabels.DUTY_PHONE.form);

      // Clear the input, then type the passed in data
      await user.clear(dutyPhoneFld);
      await user.type(dutyPhoneFld, input);

      // Ensure value of SSN now matches what we expect
      await waitFor(() => expect(dutyPhoneFld).toHaveValue(value));

      // Check for expected error message -- if we don't expect one, check that there is none
      checkForErrorMessage(dutyPhoneFld, err ?? /^$/, true);
    }
  );
});
