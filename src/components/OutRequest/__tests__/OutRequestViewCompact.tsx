import { render, screen } from "@testing-library/react";

import { OutRequestViewCompact } from "components/OutRequest/OutRequestViewCompact";
import {
  ctrRequest,
  civRequest,
  milRequest,
  fieldLabels,
  remoteLocationDataset,
} from "components/OutRequest/__tests__/TestData";

/** Check if there is a text element matching the desired text
 * @param text The text we are looking for
 * @param expected Whether or not we expect it in the document or expect it NOT in the document
 */
const expectTextToBeInTheDocument = (text: RegExp, expected: boolean) => {
  const textElement = screen.queryByText(text);
  if (expected) {
    expect(textElement).toBeInTheDocument();
  } else {
    expect(textElement).not.toBeInTheDocument();
  }
};

const fieldsByEmployeeType = [
  {
    field: fieldLabels.POSITION_SENSITIVITY_CODE.view,
    rules: [
      // Only for Civilian
      { request: civRequest, expected: true },
      { request: ctrRequest, expected: false },
      { request: milRequest, expected: false },
    ],
  },
  {
    field: fieldLabels.SAR.view,
    rules: [
      // Only for Civilian and Military
      { request: civRequest, expected: true },
      { request: ctrRequest, expected: false },
      { request: milRequest, expected: true },
    ],
  },
  {
    field: fieldLabels.LOCAL_OR_REMOTE.view,
    rules: [
      // Available to all
      { request: civRequest, expected: true },
      { request: ctrRequest, expected: true },
      { request: milRequest, expected: true },
    ],
  },
  {
    field: fieldLabels.OFFICE.view,
    rules: [
      // All Employee Types
      { request: civRequest, expected: true },
      { request: ctrRequest, expected: true },
      { request: milRequest, expected: true },
    ],
  },
  {
    field: fieldLabels.IS_TRAVELER.view,
    rules: [
      // Civilian/Military Only
      { request: civRequest, expected: true },
      { request: ctrRequest, expected: false },
      { request: milRequest, expected: true },
    ],
  },
  {
    field: fieldLabels.OUT_REASON.view,
    rules: [
      // All Employee Types
      { request: civRequest, expected: true },
      { request: ctrRequest, expected: true },
      { request: milRequest, expected: true },
    ],
  },
];

describe.each(fieldsByEmployeeType)(
  "Fields available based on Employee Type - $field",
  ({ field, rules }) => {
    it.each(rules)(
      "is displayed for $request.empType - $expected",
      ({ request, expected }) => {
        render(<OutRequestViewCompact formData={request} />);
        expectTextToBeInTheDocument(field, expected);
      }
    );
  }
);

// Remote location is displayed under the 'Local or Remote' header
describe("Local or Remote", () => {
  it.each(remoteLocationDataset)(
    "has value of 'local' or remote location - $request.workLocation",
    ({ request }) => {
      render(<OutRequestViewCompact formData={request} />);
      const textElement = screen.queryByText(fieldLabels.LOCAL_OR_REMOTE.view);

      const expectedValue =
        request.workLocation === "local"
          ? "local"
          : request.workLocationDetail
          ? request.workLocationDetail
          : "";
      expect(textElement).toHaveAccessibleDescription(
        new RegExp(expectedValue, "i")
      );
    }
  );
});
