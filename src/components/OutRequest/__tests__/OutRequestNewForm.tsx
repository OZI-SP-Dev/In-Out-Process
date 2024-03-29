import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OutRequestNewForm from "components/OutRequest/OutRequestNewForm";
import { EMPTYPES } from "constants/EmpTypes";
import {
  checkForErrorMessage,
  checkForInputToExist,
  fieldLabels,
  lengthTest,
  remoteLocationDataset,
  remoteLocationOnlyDataset,
} from "components/OutRequest/__tests__/TestData";
import { vi } from "vitest";
import { OFFICES } from "constants/Offices";
import { OUT_PROCESS_REASONS } from "constants/OutProcessReasons";

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

describe("Has DTS/GTC", () => {
  it("is selectable for Military", async () => {
    await renderThenSelectEmpType(EMPTYPES.Military);

    // Locate the RadioGroup for Existing CAC
    const hasGTCDTS = screen.getByRole("radiogroup", {
      name: fieldLabels.IS_TRAVELER.form,
    });

    const yesBttn = within(hasGTCDTS).getByLabelText(/yes/i);
    const noBttn = within(hasGTCDTS).getByLabelText(/no/i);

    // Click "Yes" and ensure it reflects checked and that "No" is not
    await user.click(yesBttn);
    expect(yesBttn).toBeChecked();
    expect(noBttn).not.toBeChecked();

    // Click "No" and ensure it reflects checked and that "Yes" is not
    await user.click(noBttn);
    expect(noBttn).toBeChecked();
    expect(yesBttn).not.toBeChecked();
  });

  it("is selectable for Civilian", async () => {
    await renderThenSelectEmpType(EMPTYPES.Civilian);

    // Locate the RadioGroup for Existing CAC
    const hasGTCDTS = screen.getByRole("radiogroup", {
      name: fieldLabels.IS_TRAVELER.form,
    });

    const yesBttn = within(hasGTCDTS).getByLabelText(/yes/i);
    const noBttn = within(hasGTCDTS).getByLabelText(/no/i);

    // Click "Yes" and ensure it reflects checked and that "No" is not
    await user.click(yesBttn);
    expect(yesBttn).toBeChecked();
    expect(noBttn).not.toBeChecked();

    // Click "No" and ensure it reflects checked and that "Yes" is not
    await user.click(noBttn);
    expect(noBttn).toBeChecked();
    expect(yesBttn).not.toBeChecked();
  });

  it("is not available for Contractor", async () => {
    await renderThenSelectEmpType(EMPTYPES.Contractor);
    checkForInputToExist(fieldLabels.IS_TRAVELER.form, false);
  });
});

describe("Out-processing Reason", () => {
  const employeeTypes = [
    { empType: EMPTYPES.Civilian, available: true },
    { empType: EMPTYPES.Contractor, available: true },
    { empType: EMPTYPES.Military, available: true },
  ];
  const requiredOutReason = /a reason is required/i;
  const validOutReasons = OUT_PROCESS_REASONS.map((reasonGroup) =>
    reasonGroup.items.map((reason) => reason.text)
  );
  const validOutReasonsFlattened = validOutReasons.flat(1);
  it.each(employeeTypes)(
    "is available for $empType ($available)",
    async ({ empType, available }) => {
      await renderThenSelectEmpType(empType);
      await checkEnterableCombobox(
        fieldLabels.OUT_REASON.form,
        validOutReasonsFlattened[0],
        available
      );
    }
  );

  it.each(validOutReasonsFlattened)(
    "no error on valid values - %s",
    async (outReason) => {
      await renderThenSelectEmpType(EMPTYPES.Civilian);
      await checkEnterableCombobox(
        fieldLabels.OUT_REASON.form,
        outReason,
        true
      );

      const outReasonFld = screen.getByRole("combobox", {
        name: fieldLabels.OUT_REASON.form,
      });

      // No error text is displayed
      const errText = within(outReasonFld).queryByText(requiredOutReason);
      expect(errText).not.toBeInTheDocument();
    }
  );
});

describe("Gaining Organization", () => {
  it.each(lengthTest)(
    "cannot exceed 100 characters - $testString.length",
    async ({ testString }) => {
      await renderThenSelectEmpType(EMPTYPES.Civilian);

      await checkEnterableCombobox(
        fieldLabels.OUT_REASON.form,
        "Move within AFMC organization", // One of the Transferring reasons
        true
      );

      await checkEnterableTextbox(fieldLabels.GAINING_ORG.form, testString);

      const gainingOrgFld = screen.getByRole("textbox", {
        name: fieldLabels.GAINING_ORG.form,
      });

      checkForErrorMessage(
        gainingOrgFld,
        fieldLabels.GAINING_ORG.lengthError,
        testString.length > 100
      );
    }
  );
});

describe("Special clearance accesses (i.e., SCI, SAP, etc)?", () => {
  const empTypes = [EMPTYPES.Civilian, EMPTYPES.Contractor, EMPTYPES.Military];
  it.each(empTypes)(
    "is selectable for all employee types - $empType",
    async (empType) => {
      await renderThenSelectEmpType(empType);

      const sci = screen.getByRole("radiogroup", {
        name: fieldLabels.SPECIAL_ACCESS.form,
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
    }
  );
});

describe("Has SIPR", () => {
  const empTypes = [EMPTYPES.Civilian, EMPTYPES.Contractor, EMPTYPES.Military];
  it.each(empTypes)(
    "is selectable for all employee types - $empType",
    async (empType) => {
      await renderThenSelectEmpType(empType);

      const hasSIPR = screen.getByRole("radiogroup", {
        name: fieldLabels.HAS_SIPR.form,
      });

      const yesBttn = within(hasSIPR).getByLabelText(/yes/i);
      const noBttn = within(hasSIPR).getByLabelText(/no/i);

      // Click "Yes" and ensure it reflects checked and that "No" is not
      await user.click(yesBttn);
      expect(yesBttn).toBeChecked();
      expect(noBttn).not.toBeChecked();

      // Click "No" and ensure it reflects checked and that "Yes" is not
      await user.click(noBttn);
      expect(noBttn).toBeChecked();
      expect(yesBttn).not.toBeChecked();
    }
  );
});
