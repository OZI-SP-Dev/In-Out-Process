import { render, screen } from "@testing-library/react";

import { InRequestViewCompact } from "components/InRequest/InRequestViewCompact";
import {
  ctrRequest,
  civRequest,
  milRequest,
  remoteLocationDataset,
  fieldLabels,
} from "components/InRequest/__tests__/TestData";
import { EMPTYPES } from "constants/EmpTypes";
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

describe("Position Sensitivity Code", () => {
  it("is displayed for Civilian", () => {
    render(<InRequestViewCompact formData={civRequest} />);
    expectTextToBeInTheDocument(
      fieldLabels.POSITION_SENSITIVITY_CODE.view,
      true
    );
  });

  it("is not displayed for Contractor", () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    expectTextToBeInTheDocument(
      fieldLabels.POSITION_SENSITIVITY_CODE.view,
      false
    );
  });

  it("is not displayed for Military", () => {
    render(<InRequestViewCompact formData={milRequest} />);
    expectTextToBeInTheDocument(
      fieldLabels.POSITION_SENSITIVITY_CODE.view,
      false
    );
  });
});

describe("ManPower Control Number (MPCN)", () => {
  it("is displayed for Civilian", () => {
    render(<InRequestViewCompact formData={civRequest} />);
    expectTextToBeInTheDocument(fieldLabels.MPCN.view, true);
  });

  it("is not displayed for Contractor", () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    expectTextToBeInTheDocument(fieldLabels.MPCN.view, false);
  });

  it("is displayed for Military", () => {
    render(<InRequestViewCompact formData={milRequest} />);
    expectTextToBeInTheDocument(fieldLabels.MPCN.view, true);
  });
});

describe("SAR", () => {
  it("is displayed for Civilian", () => {
    render(<InRequestViewCompact formData={civRequest} />);
    expectTextToBeInTheDocument(fieldLabels.SAR.view, true);
  });

  it("is not displayed for Contractor", () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    expectTextToBeInTheDocument(fieldLabels.SAR.view, false);
  });

  it("is displayed for Military", () => {
    render(<InRequestViewCompact formData={milRequest} />);
    expectTextToBeInTheDocument(fieldLabels.SAR.view, true);
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

describe("Requires SCI", () => {
  const requiresSCILabelText = /requires sci\?/i;
  const validSAR = SAR_CODES.map((code) => code.key);
  const validSARWithout5 = validSAR.filter((code) => code !== 5);

  it("is displayed for Military with SAR of 5", async () => {
    render(<InRequestViewCompact formData={milRequest} />);
    expectTextToBeInTheDocument(requiresSCILabelText, true);
  });

  it.each(validSARWithout5)(
    "is not displayed for Military with SAR of %s",
    async (sar) => {
      const milRequestSAR = { ...milRequest, SAR: sar };
      render(<InRequestViewCompact formData={milRequestSAR} />);
      expectTextToBeInTheDocument(requiresSCILabelText, false);
    }
  );

  it.each(validSAR)(
    "is not displayed for Civilian with SAR of %s",
    async (sar) => {
      const civRequestSAR = { ...civRequest, SAR: sar };
      render(<InRequestViewCompact formData={civRequestSAR} />);
      expectTextToBeInTheDocument(requiresSCILabelText, false);
    }
  );

  it("is not displayed for Contractors", async () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    expectTextToBeInTheDocument(requiresSCILabelText, false);
  });

  it.each(["yes", "no"])(
    "has correct value displayed for Military with SAR of 5 - %s",
    (isSCI) => {
      const milRequestSCI = {
        ...milRequest,
        isSCI: isSCI as "yes" | "no" | "",
      };
      render(<InRequestViewCompact formData={milRequestSCI} />);
      const textElement = screen.queryByText(requiresSCILabelText);

      expect(textElement).toHaveAccessibleDescription(new RegExp(isSCI, "i"));
    }
  );
});
