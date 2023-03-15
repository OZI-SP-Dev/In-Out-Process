import { render, screen } from "@testing-library/react";

import { InRequestViewCompact } from "components/InRequest/InRequestViewCompact";
import {
  ctrRequest,
  civRequest,
  milRequest,
} from "components/InRequest/__tests__/TestData";

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
