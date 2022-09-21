import { FunctionComponent } from "react";
import { EMPTYPES } from "constants/EmpTypes";
import { makeStyles, Label, Text } from "@fluentui/react-components";
import { IInRequest } from "api/RequestApi";

/* FluentUI Styling */
const useStyles = makeStyles({
  compactContainer: {
    display: "grid",
    paddingLeft: "1em",
    paddingRight: "1em",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))",
    gridAutoRows: "minmax(50px, auto)",
  },
  capitalize: { textTransform: "capitalize" },
});

export interface IInRequestViewCompact {
  formData: IInRequest;
}

export const InRequestViewCompact: FunctionComponent<IInRequestViewCompact> = (
  props
) => {
  const classes = useStyles();
  const formData: IInRequest = props.formData;

  // Function used to display the Employee Type in a shortened format.
  // If it is a Civilian add New/Existing after depending on the selection
  const displayEmpType = (): string => {
    let displayValue = "";
    switch (formData.empType) {
      case EMPTYPES.Civilian:
        displayValue =
          "Civilian - " + (formData.isNewCivMil ? "New" : "Existing");
        break;
      case EMPTYPES.Military:
        displayValue =
          "Military - " + (formData.isNewCivMil ? "New" : "Existing");
        break;
      case EMPTYPES.Contractor:
        displayValue = "Contractor";
        break;
    }
    return displayValue;
  };

  return (
    <>
      <div id="inReqCompact" className={classes.compactContainer}>
        <div>
          <Label weight="semibold" htmlFor="empNameCVId">
            Employee Name:
          </Label>
          <br />
          <Text id="empNameCVId">{formData.empName}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="empTypeCVId">
            Employee Type
          </Label>
          <br />
          <Text id="empTypeCVId">{displayEmpType}</Text>
        </div>
        {(formData.empType === EMPTYPES.Civilian ||
          formData.empType === EMPTYPES.Military) && (
          <div>
            <Label weight="semibold" htmlFor="gradeRankCVId">
              Grade/Rank
            </Label>
            <br />
            <Text id="gradeRankCVId">{formData.gradeRank}</Text>
          </div>
        )}
        {formData.empType === EMPTYPES.Contractor && (
          <div>
            <Label weight="semibold" htmlFor="cacExpirationCVId">
              CAC Expiration
            </Label>
            <br />
            <Text id="cacExpirationCVId" className={classes.capitalize}>
              {formData.hasExistingCAC
                ? formData.CACExpiration?.toLocaleDateString()
                : "No CAC"}
            </Text>
          </div>
        )}
        <div>
          <Label weight="semibold" htmlFor="workLocationCVId">
            Local or Remote?
          </Label>
          <br />
          <Text id="workLocationCVId" className={classes.capitalize}>
            {formData.workLocation}
          </Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="MPCNCVId">
            MPCN
          </Label>
          <br />
          <Text id="MPCNCVId">{formData.MPCN}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="SARCVId">
            SAR
          </Label>
          <br />
          <Text id="SARCVId">{formData.SAR}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="arrivalDateCVId">
            Estimated on-boarding date
          </Label>
          <br />
          <Text id="arrivalDateCVId">{formData.eta?.toLocaleDateString()}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="completionDateCVId">
            Target completion date
          </Label>
          <br />
          <Text id="completionDateCVId">
            {formData.completionDate?.toLocaleDateString()}
          </Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="officeCVId">
            Office
          </Label>
          <br />
          <Text id="officeCVId">{formData.office}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="supGovLeadCVId">
            Supervisor/Government Lead
          </Label>
          <br />
          <Text id="supGovLeadCVId">{formData.supGovLead?.text}</Text>
        </div>
        {(formData.empType === EMPTYPES.Civilian ||
          formData.empType === EMPTYPES.Military) &&
          !formData.isNewCivMil && (
            <div>
              <Label weight="semibold" htmlFor="prevOrgCVId">
                Previous Organization
              </Label>
              <br />
              <Text id="prevOrgCVId">{formData.prevOrg}</Text>
            </div>
          )}
        {(formData.empType === EMPTYPES.Civilian ||
          formData.empType === EMPTYPES.Military) && (
          <div>
            <Label weight="semibold" htmlFor="newToBaseAndCenterCVId">
              Is New to WPAFB and AFLCMC?
            </Label>
            <br />
            <Text id="newToBaseAndCenterCVId" className={classes.capitalize}>
              {formData.isNewToBaseAndCenter ? "Yes" : "No"}
            </Text>
          </div>
        )}
        {(formData.empType === EMPTYPES.Civilian ||
          formData.empType === EMPTYPES.Military) && (
          <div>
            <Label weight="semibold" htmlFor="isTravelerCVId">
              Requires Travel Ability?
            </Label>
            <br />
            <Text id="isTravelerCVId">
              {formData.isTraveler ? "Yes" : "No"}
            </Text>
          </div>
        )}
      </div>
    </>
  );
};
