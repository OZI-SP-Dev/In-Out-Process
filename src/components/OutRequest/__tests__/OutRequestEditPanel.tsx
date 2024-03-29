import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ctrRequest,
  civRequest,
  milRequest,
  fieldLabels,
  remoteLocationDataset,
  checkForInputToExist,
  remoteLocationOnlyDataset,
  checkForErrorMessage,
  lengthTest,
  checkForRadioGroupToBeDisabled,
} from "components/OutRequest/__tests__/TestData";
import { OutRequestEditPanel } from "components/OutRequest/OutRequestEditPanel";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IOutRequest } from "api/RequestApi";
import { OFFICES } from "constants/Offices";
import { OUT_PROCESS_REASONS } from "constants/OutProcessReasons";

const queryClient = new QueryClient();
const user = userEvent.setup();

/** Render an open OutRequestEditPanel within a QueryClientProvider */
const renderEditPanelForRequest = (request: IOutRequest) => {
  render(
    <QueryClientProvider client={queryClient}>
      <OutRequestEditPanel
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

describe("Out-processing Reason", () => {
  // Out-processing Reason is currently a disabled field in Edit mode
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
        fieldLabels.OUT_REASON.form,
        OUT_PROCESS_REASONS[0].items[0].text,
        available
      );
    }
  );
});

describe("Gaining Organization", () => {
  it.each(lengthTest)(
    "cannot exceed 100 characters - $testString.length",
    async ({ testString }) => {
      renderEditPanelForRequest({
        ...milRequest,
        outReason: "Move within AFMC organization", // Must select that Employee is a transfering Employee
      });

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
  // Currently field is not editable -- this may change as we explore updating tasks based on changes
  const requests = [civRequest, milRequest, ctrRequest];
  it.each(requests)(
    "is disabled for all requests = $request.empType",
    async (request) => {
      renderEditPanelForRequest(request);

      const sci = screen.getByRole("radiogroup", {
        name: fieldLabels.SPECIAL_ACCESS.form,
      });

      const yesBttn = within(sci).getByRole("radio", { name: /yes/i });
      const noBttn = within(sci).getByRole("radio", { name: /no/i });
      expect(yesBttn).toBeDisabled();
      expect(noBttn).toBeDisabled();
    }
  );
});

describe("Has SIPR", () => {
  // Currently field is not editable -- this may change as we explore updating tasks based on changes
  const requests = [civRequest, milRequest, ctrRequest];
  it.each(requests)(
    "is disabled for all requests = $request.empType",
    async (request) => {
      renderEditPanelForRequest(request);

      const hasSIPR = screen.getByRole("radiogroup", {
        name: fieldLabels.HAS_SIPR.form,
      });

      const yesBttn = within(hasSIPR).getByRole("radio", { name: /yes/i });
      const noBttn = within(hasSIPR).getByRole("radio", { name: /no/i });
      expect(yesBttn).toBeDisabled();
      expect(noBttn).toBeDisabled();
    }
  );
});
