import { IOutRequest } from "api/RequestApi";
import { IPerson } from "api/UserApi";
import { EMPTYPES } from "constants/EmpTypes";
import { ByRoleMatcher, screen } from "@testing-library/react";

test("Load Test Data file", () => {});

export const testUsers: IPerson[] = [
  {
    Id: 1,
    Title: "Barb Akew (All)",
    EMail: "Barb Akew@localhost",
  },
  {
    Id: 2,
    Title: "Chris P. Bacon (IT)",
    EMail: "Chris P. Bacon@localhost",
  },
];

/* Incoming military example */
/* With Local/Remote = local */
/* With SAR = 5 and isSCI = "yes" */
export const milRequest: IOutRequest = {
  reqType: "Out",
  Id: 1,
  empName: testUsers[1].Title,
  empType: EMPTYPES.Military,
  SAR: 5,
  lastDay: new Date("2023-03-13T04:00:00.000Z"),
  beginDate: new Date("2023-04-10T04:00:00.000Z"),
  supGovLead: { ...testUsers[0] },
  employee: { ...testUsers[1] },
  status: "Active",
};

/* Incoming civilian example */
/* With Local/Remote = 'remote' */
/* With isNewCivMil = 'no' */
export const civRequest: IOutRequest = {
  reqType: "Out",
  Id: 2,
  empName: testUsers[1].Title,
  empType: EMPTYPES.Civilian,
  SAR: 5,
  sensitivityCode: 4,
  lastDay: new Date("2023-03-13T04:00:00.000Z"),
  beginDate: new Date("2023-04-10T04:00:00.000Z"),
  supGovLead: { ...testUsers[0] },
  employee: { ...testUsers[1] },
  status: "Active",
};

/* Incoming contractor example */
export const ctrRequest: IOutRequest = {
  reqType: "Out",
  Id: 3,
  empName: testUsers[1].Title,
  empType: EMPTYPES.Contractor,
  lastDay: new Date("2023-03-13T04:00:00.000Z"),
  beginDate: new Date("2023-04-10T04:00:00.000Z"),
  supGovLead: { ...testUsers[0] },
  employee: { ...testUsers[1] },
  status: "Active",
};

/** Test data used by Local/Remote and Remote Location */
export const remoteLocationDataset = [
  { request: milRequest },
  { request: civRequest },
];

export const fieldLabels = {
  EMPLOYEE_NAME: {
    form: /employee name/i,
    lengthError: /name cannot be longer than 100 characters/i,
  },
  GRADE_RANK: {
    form: /grade\/rank/i,
    view: /grade\/rank/i,
    formType: "combobox",
  },
  POSITION_SENSITIVITY_CODE: {
    form: /position sensitivity code/i,
    formType: "combobox",
    view: /position sensitivity code/i,
  },
  MPCN: {
    form: /mpcn/i,
    formType: "textbox",
    view: /mpcn/i,
  },
  SAR: {
    form: /sar/i,
    formType: "combobox",
    view: /sar/i,
  },
  OFFICE: {
    form: /office/i,
    view: /office/i,
  },
  EXISTING_CAC: {
    form: /does the support contractor have an existing contractor cac\?/i,
  },
  CAC_EXPIRATION: {
    form: /cac expiration/i,
    view: /cac expiration/i,
  },
  LOCAL_OR_REMOTE: {
    form: /local or remote\?/i,
    view: /local or remote\?/i,
  },
  REMOTE_LOCATION: {
    form: /remote location/i,
    lengthError: /remote location cannot be longer than 100 characters/i,
  },
  CONTRACT_NUMBER: {
    form: /contract number/i,
    view: /contract number/i,
    lengthError: /contract number cannot be longer than 100 characters/i,
  },
  CONTRACT_END_DATE: {
    form: /contract end date/i,
    view: /contract end date/i,
  },
  REQUIRES_SCI: {
    form: /does employee require sci access\?/i,
    view: /requires sci\?/i,
  },
  NEW_CIVMIL: {
    form: /is employee a new air force (civilian|military)\?/i,
  },
  PREVIOUS_ORG: {
    form: /previous organization/i,
    lengthError: /previous organization cannot be longer than 100 characters/i,
  },
};

/** Check if there is an input field matching the desired label
 * @param labelText The text we are looking for
 * @param expected Whether or not we expect it in the document or expect it NOT in the document
 */
export const checkForInputToExist = (labelText: RegExp, expected: boolean) => {
  const field = screen.queryByLabelText(labelText);

  if (expected) {
    expect(field).toBeInTheDocument();
  } else {
    expect(field).not.toBeInTheDocument();
  }
};

/** Check that ensures N/A is displayed properly */
export const isNotApplicable = (
  fieldType: ByRoleMatcher,
  fieldName: RegExp
) => {
  // Check placeholder is N/A
  const naFld = screen.getByRole(fieldType, { name: fieldName });
  expect(naFld).toHaveAttribute("placeholder", expect.stringMatching(/N\/A/));

  // Check that value is "" so it is displaying the placeholder
  expect(naFld).toHaveValue("");
};

/** Check that ensures error message is displayed if expected
 * @param field The field obtained by Jest
 * @param errMessage The error message we are checking for
 * @param expected Whether we expect the error to be in the Document or not
 */
export const checkForErrorMessage = (
  field: HTMLElement,
  errMessage: RegExp,
  expected: boolean
) => {
  if (expected) {
    expect(field).toHaveAccessibleDescription(errMessage);
  } else {
    expect(field).not.toHaveAccessibleDescription(errMessage);
  }
};

// Used internally to genrate strings of various length
const lorem =
  "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sunt facilis provident omnis voluptates beatae ipsam earum porro maiores amet sed, libero laborum quasi delectus esse magni harum, et, impedit placeat.";

/** Array of testStrings used to test length */
export const lengthTest = [
  { testString: lorem.substring(0, 200) },
  { testString: lorem.substring(0, 150) },
  { testString: lorem.substring(0, 101) },
  { testString: lorem.substring(0, 100) },
  { testString: lorem.substring(0, 99) },
  { testString: lorem.substring(0, 50) },
  { testString: lorem.substring(0, 2) },
];
