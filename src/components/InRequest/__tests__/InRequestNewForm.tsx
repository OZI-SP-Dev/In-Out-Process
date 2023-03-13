import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InRequestNewForm } from "components/InRequest/InRequestNewForm";
import { EMPTYPES } from "constants/EmpTypes";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";

const user = userEvent.setup();

const queryClient = new QueryClient();

// We're not testing useNavigate within this component -- so just mock it for now so the component will load
const mockedUsedNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockedUsedNavigate,
}));

/** Check that ensures the Position Sensitivty Code is properly disabled */
const notSelectablePSC = async (empType: EMPTYPES) => {
  render(
    <QueryClientProvider client={queryClient}>
      <InRequestNewForm />
    </QueryClientProvider>
  );

  // Click on the appropriate empType radio button
  const empTypeOpt = screen.getByRole("radio", { name: empType });
  await user.click(empTypeOpt);

  // Click on the PSC
  const psc = screen.getByRole("combobox", {
    name: /position sensitivity code/i,
  });
  await user.click(psc);

  //Ensure that it doesn't come up with an item to select
  const pscOpt = screen.queryByRole("option", {
    name: SENSITIVITY_CODES[0].text,
  });
  expect(pscOpt).not.toBeInTheDocument();
};

/** Check that ensures N/A is displayed properly when Position Sensitivity Code is N/A */
const isNotApplicablePSC = async (empType: EMPTYPES) => {
  render(
    <QueryClientProvider client={queryClient}>
      <InRequestNewForm />
    </QueryClientProvider>
  );

  // Click on the appropriate empType radio button
  const empTypeOpt = screen.getByRole("radio", { name: empType });
  await user.click(empTypeOpt);

  // Check placeholder is N/A
  const psc = screen.getByRole("combobox", {
    name: /position sensitivity code/i,
  });
  expect(psc).toHaveAttribute("placeholder", expect.stringMatching(/N\/A/));

  // Check that value is "" so it is displaying the placeholder
  expect(psc).toHaveValue("");
};

describe("Position Sensitivity Code", () => {
  it("is available for Civilian", async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InRequestNewForm />
      </QueryClientProvider>
    );

    // Click on the "Civilian" radio button
    const civType = screen.getByRole("radio", { name: EMPTYPES.Civilian });
    await user.click(civType);

    // Click on the PSC
    const psc = screen.getByRole("combobox", {
      name: /position sensitivity code/i,
    });
    await user.click(psc);

    //Ensure that it comes up with an item to select
    const pscOpt = screen.getByRole("option", {
      name: SENSITIVITY_CODES[0].text,
    });
    expect(pscOpt).toBeInTheDocument();
  });

  it("is not selectable for Contractor", async () => {
    await notSelectablePSC(EMPTYPES.Contractor);
  });

  it("displays N/A for Contractor", async () => {
    await isNotApplicablePSC(EMPTYPES.Contractor);
  });

  it("is not selectable for Miliary", async () => {
    await notSelectablePSC(EMPTYPES.Military);
  });

  it("displays N/A for Military", async () => {
    await isNotApplicablePSC(EMPTYPES.Military);
  });
});
