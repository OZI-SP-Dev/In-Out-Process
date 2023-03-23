import { render, screen } from "@testing-library/react";

import { InRequestViewCompact } from "components/InRequest/InRequestViewCompact";
import {
  ctrRequest,
  civRequest,
  milRequest,
  remoteLocationDataset,
} from "components/InRequest/__tests__/TestData";
import { EMPTYPES } from "constants/EmpTypes";

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

describe("Position Sensitivity Code", () => {
  const pscLabelText = /position sensitivity code/i;
  it("is displayed for Civilian", () => {
    render(<InRequestViewCompact formData={civRequest} />);
    expectTextToBeInTheDocument(pscLabelText, true);
  });

  it("is not displayed for Contractor", () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    expectTextToBeInTheDocument(pscLabelText, false);
  });

  it("is not displayed for Military", () => {
    render(<InRequestViewCompact formData={milRequest} />);
    expectTextToBeInTheDocument(pscLabelText, false);
  });
});

describe("ManPower Control Number (MPCN)", () => {
  const mpcnLabelText = /mpcn/i;
  it("is displayed for Civilian", () => {
    render(<InRequestViewCompact formData={civRequest} />);
    expectTextToBeInTheDocument(mpcnLabelText, true);
  });

  it("is not displayed for Contractor", () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    expectTextToBeInTheDocument(mpcnLabelText, false);
  });

  it("is displayed for Military", () => {
    render(<InRequestViewCompact formData={milRequest} />);
    expectTextToBeInTheDocument(mpcnLabelText, true);
  });
});

describe("SAR", () => {
  const sarLabelText = /sar/i;
  it("is displayed for Civilian", () => {
    render(<InRequestViewCompact formData={civRequest} />);
    expectTextToBeInTheDocument(sarLabelText, true);
  });

  it("is not displayed for Contractor", () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    expectTextToBeInTheDocument(sarLabelText, false);
  });

  it("is displayed for Military", () => {
    render(<InRequestViewCompact formData={milRequest} />);
    expectTextToBeInTheDocument(sarLabelText, true);
  });
});

describe("CAC Expiration", () => {
  const cacLabelText = /cac expiration/i;
  it("is displayed for Contractors", async () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    expectTextToBeInTheDocument(cacLabelText, true);
  });

  it("is not displayed for Miliary", async () => {
    render(<InRequestViewCompact formData={milRequest} />);
    expectTextToBeInTheDocument(cacLabelText, false);
  });

  it("is not displayed for Civilians", async () => {
    render(<InRequestViewCompact formData={civRequest} />);
    expectTextToBeInTheDocument(cacLabelText, false);
  });
});

// Remote location is displayed under the 'Local or Remote' header
describe("Local or Remote", () => {
  const localOrRemoteLabelText = /local or remote\?/i;

  const employeeTypes = [
    { request: civRequest },
    { request: ctrRequest },
    { request: milRequest },
  ];

  it.each(employeeTypes)(
    "is displayed for $request.empType",
    async ({ request }) => {
      render(<InRequestViewCompact formData={request} />);
      expectTextToBeInTheDocument(localOrRemoteLabelText, true);
    }
  );

  it.each(remoteLocationDataset)(
    "has value of 'local' or remote location - $request.workLocation",
    ({ request }) => {
      render(<InRequestViewCompact formData={request} />);
      const textElement = screen.queryByText(/local or remote\?/i);

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
  const contractNumberLabelText = /contract number/i;

  const employeeTypes = [
    { request: civRequest },
    { request: ctrRequest },
    { request: milRequest },
  ];

  it.each(employeeTypes)(
    "is displayed only for Contrator - $request.empType",
    async ({ request }) => {
      render(<InRequestViewCompact formData={request} />);
      if (request.empType === EMPTYPES.Contractor) {
        expectTextToBeInTheDocument(contractNumberLabelText, true);
      } else {
        expectTextToBeInTheDocument(contractNumberLabelText, false);
      }
    }
  );

  it("has correct value displayed for Contractors", () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    const textElement = screen.queryByText(contractNumberLabelText);

    expect(textElement).toHaveAccessibleDescription(ctrRequest.contractNumber);
  });
});

describe("Contract End Date", () => {
  const contractEndDateLabelText = /contract end date/i;

  const employeeTypes = [
    { request: civRequest },
    { request: ctrRequest },
    { request: milRequest },
  ];

  it.each(employeeTypes)(
    "is displayed only for Contrator - $request.empType",
    async ({ request }) => {
      render(<InRequestViewCompact formData={request} />);
      if (request.empType === EMPTYPES.Contractor) {
        expectTextToBeInTheDocument(contractEndDateLabelText, true);
      } else {
        expectTextToBeInTheDocument(contractEndDateLabelText, false);
      }
    }
  );

  it("has correct value displayed for Contractors", () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    const textElement = screen.queryByText(contractEndDateLabelText);

    expect(textElement).toHaveAccessibleDescription(
      ctrRequest.contractEndDate?.toLocaleDateString()
    );
  });
});
