import { render, screen } from "@testing-library/react";

import { OutRequestViewCompact } from "components/OutRequest/OutRequestViewCompact";
import {
  ctrRequest,
  civRequest,
  milRequest,
  fieldLabels,
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
