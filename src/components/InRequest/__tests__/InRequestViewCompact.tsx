import { render, screen } from "@testing-library/react";

import { InRequestViewCompact } from "components/InRequest/InRequestViewCompact";
import {
  ctrRequest,
  civRequest,
  milRequest,
} from "components/InRequest/__tests__/TestData";
describe("Position Sensitivity Code", () => {
  it("is displayed for Civilian", () => {
    render(<InRequestViewCompact formData={civRequest} />);
    const psc = screen.queryByText(/position sensitivity code/i);
    expect(psc).toBeInTheDocument();
  });

  it("is not displayed for Contractor", () => {
    render(<InRequestViewCompact formData={ctrRequest} />);
    const psc = screen.queryByText(/position sensitivity code/i);
    expect(psc).not.toBeInTheDocument();
  });

  it("is not displayed for Military", () => {
    render(<InRequestViewCompact formData={milRequest} />);
    const psc = screen.queryByText(/position sensitivity code/i);
    expect(psc).not.toBeInTheDocument();
  });
});
