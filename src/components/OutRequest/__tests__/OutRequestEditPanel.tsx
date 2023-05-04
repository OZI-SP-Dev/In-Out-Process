import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ctrRequest,
  civRequest,
  milRequest,
  fieldLabels,
  checkForInputToExist,
  isNotApplicable,
} from "components/OutRequest/__tests__/TestData";
import { OutRequestEditPanel } from "components/OutRequest/OutRequestEditPanel";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IOutRequest } from "api/RequestApi";
import { SAR_CODES } from "constants/SARCodes";

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
/* TODO - Hold as possible Out Processing --
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
*/

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
