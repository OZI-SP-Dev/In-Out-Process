import { render, screen } from "@testing-library/react";

import { InRequestViewCompact } from "components/InRequest/InRequestViewCompact";
import {
  ctrRequest,
  civRequest,
  milRequest,
  remoteLocationDataset,
  fieldLabels,
} from "components/InRequest/__tests__/TestData";
import { SAR_CODES } from "constants/SARCodes";

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
    field: fieldLabels.MPCN.view,
    rules: [
      // Only for Civilian and Military
      { request: civRequest, expected: true },
      { request: ctrRequest, expected: false },
      { request: milRequest, expected: true },
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
    field: fieldLabels.CAC_EXPIRATION.view,
    rules: [
      // Only for Contractors
      { request: civRequest, expected: false },
      { request: ctrRequest, expected: true },
      { request: milRequest, expected: false },
    ],
  },
  {
    field: fieldLabels.CONTRACT_NUMBER.view,
    rules:
      // Only for Contractors
      [
        { request: civRequest, expected: false },
        { request: ctrRequest, expected: true },
        { request: milRequest, expected: false },
      ],
  },
  {
    field: fieldLabels.CONTRACT_END_DATE.view,
    rules:
      // Only for Contractors
      [
        { request: civRequest, expected: false },
        { request: ctrRequest, expected: true },
        { request: milRequest, expected: false },
      ],
  },
  {
    field: fieldLabels.LOCAL_OR_REMOTE.view,
    rules:
      // All Employee Types
      [
        { request: civRequest, expected: true },
        { request: ctrRequest, expected: true },
        { request: milRequest, expected: true },
      ],
  },
  {
    field: fieldLabels.GRADE_RANK.view,
    rules:
      // Doesn't show for Contractors
      [
        { request: civRequest, expected: true },
        { request: ctrRequest, expected: false },
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
];

describe.each(fieldsByEmployeeType)(
  "Fields available based on Employee Type - $field",
  ({ field, rules }) => {
    it.each(rules)(
      "is displayed for $request.empType - $expected",
      ({ request, expected }) => {
        render(<InRequestViewCompact formData={request} />);
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
      render(<InRequestViewCompact formData={request} />);
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

describe("Contract Number", () => {
  it("has correct value displayed for Contractors", () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    const textElement = screen.queryByText(fieldLabels.CONTRACT_NUMBER.view);

    expect(textElement).toHaveAccessibleDescription(ctrRequest.contractNumber);
  });
});

describe("Contract End Date", () => {
  it("has correct value displayed for Contractors", () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    const textElement = screen.queryByText(fieldLabels.CONTRACT_END_DATE.view);

    expect(textElement).toHaveAccessibleDescription(
      ctrRequest.contractEndDate?.toLocaleDateString()
    );
  });
});

describe("Requires SCI", () => {
  const validSAR = SAR_CODES.map((code) => code.key);
  const validSARWithout5 = validSAR.filter((code) => code !== 5);

  it("is displayed for Military with SAR of 5", async () => {
    render(<InRequestViewCompact formData={milRequest} />);
    expectTextToBeInTheDocument(fieldLabels.REQUIRES_SCI.view, true);
  });

  it.each(validSARWithout5)(
    "is not displayed for Military with SAR of %s",
    async (sar) => {
      const milRequestSAR = { ...milRequest, SAR: sar };
      render(<InRequestViewCompact formData={milRequestSAR} />);
      expectTextToBeInTheDocument(fieldLabels.REQUIRES_SCI.view, false);
    }
  );

  it.each(validSAR)(
    "is not displayed for Civilian with SAR of %s",
    async (sar) => {
      const civRequestSAR = { ...civRequest, SAR: sar };
      render(<InRequestViewCompact formData={civRequestSAR} />);
      expectTextToBeInTheDocument(fieldLabels.REQUIRES_SCI.view, false);
    }
  );

  it("is not displayed for Contractors", async () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    expectTextToBeInTheDocument(fieldLabels.REQUIRES_SCI.view, false);
  });

  it.each(["yes", "no"])(
    "has correct value displayed for Military with SAR of 5 - %s",
    (isSCI) => {
      const milRequestSCI = {
        ...milRequest,
        isSCI: isSCI as "yes" | "no" | "",
      };
      render(<InRequestViewCompact formData={milRequestSCI} />);
      const textElement = screen.queryByText(fieldLabels.REQUIRES_SCI.view);

      expect(textElement).toHaveAccessibleDescription(new RegExp(isSCI, "i"));
    }
  );
});
