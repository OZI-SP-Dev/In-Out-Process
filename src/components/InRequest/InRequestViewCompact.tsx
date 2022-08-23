import { FunctionComponent } from "react";
import { EMPTYPES } from "../../constants/EmpTypes";
import { makeStyles, Label, Text } from "@fluentui/react-components";
import { IInForm } from "../../api/RequestApi";

/* FluentUI Styling */
const useStyles = makeStyles({
  compactContainer: {
    display: "grid",
    paddingLeft: "1em",
    paddingRight: "1em",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))",
    gridAutoRows: "minmax(50px, auto)",
  },
});

export interface IInRequestViewCompact {
  formData: IInForm;
}

export const InRequestViewCompact: FunctionComponent<IInRequestViewCompact> = (
  props
) => {
  const classes = useStyles();
  const formData: IInForm = props.formData;

  // Function used to display the Employee Type in a shortened format.
  // If it is a Civilian add New/Existing after depending on the selection
  const displayEmpType = (): string => {
    let displayValue = "";
    switch (formData.empType) {
      case EMPTYPES.CIV:
        displayValue =
          "Civilian - " + (formData.isNewCivMil === "yes" ? "New" : "Existing");
        break;
      case EMPTYPES.MIL:
        displayValue =
          "Military" + +(formData.isNewCivMil === "yes" ? "New" : "Existing");
        break;
      case EMPTYPES.CTR:
        displayValue = "Contractor";
        break;
    }
    return displayValue;
  };

  return (
    <>
      <div id="inReqCompact" className={classes.compactContainer}>
        <div>
          <Label weight="semibold" htmlFor="empNameId">
            Employee Name:
          </Label>
          <br />
          <Text id="empNameCCVId">{formData.empName}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="empTypeId">
            Employee Type
          </Label>
          <br />
          <Text id="empTypeCVId">{displayEmpType}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="gradeRankId">
            Grade/Rank
          </Label>
          <br />
          <Text id="gradeRankCVId">{formData.gradeRank}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="workLocationId">
            Local or Remote?
          </Label>
          <br />
          <Text id="workLocationCVId">{formData.workLocation}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="arrivalDateId">
            Select estimated on-boarding date
          </Label>
          <br />
          <Text id="arrivalDateCVId">{formData.eta?.toLocaleDateString()}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="officeId">
            Office
          </Label>
          <br />
          <Text id="officeCVId">{formData.office}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="supGovLeadId">
            Supervisor/Government Lead
          </Label>
          <br />
          <Text id="supGovLeadCVId">{formData.supGovLead?.text}</Text>
        </div>
        {formData.empType === EMPTYPES.CIV && formData.isNewCivMil === "no" && (
          <div>
            <Label weight="semibold" htmlFor="prevOrgId">
              Previous Organization
            </Label>
            <br />
            <Text>{formData.prevOrg}</Text>
          </div>
        )}
      </div>
    </>
  );
};
