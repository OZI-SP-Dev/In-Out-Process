import { FunctionComponent } from "react";
import { EMPTYPES } from "constants/EmpTypes";
import { makeStyles, Label, Text } from "@fluentui/react-components";
import { IInRequest } from "api/RequestApi";
import { MessageBar, MessageBarType } from "@fluentui/react";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";

/* FluentUI Styling */
const useStyles = makeStyles({
  compactContainer: {
    display: "grid",
    paddingLeft: "1em",
    paddingRight: "1em",
    columnGap: "2em",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))",
    gridAutoRows: "minmax(50px, auto)",
  },
  capitalize: { textTransform: "capitalize" },
  messageBar: { whiteSpace: "pre-wrap" }, // Allow the \n character to wrap text
});

export interface IInRequestViewCompact {
  formData: IInRequest;
}

export const InRequestViewCompact: FunctionComponent<IInRequestViewCompact> = (
  props
) => {
  const classes = useStyles();
  const formData: IInRequest = props.formData;
  const codeEntry = SENSITIVITY_CODES.find(
    (code) => code.key === formData.sensitivityCode
  );
  const sensitivityCode = codeEntry ? codeEntry.text : "";
  // Function used to display the Employee Type in a shortened format.
  // If it is a Civilian add New/Existing after depending on the selection
  const displayEmpType = (): string => {
    let displayValue = "";
    switch (formData.empType) {
      case EMPTYPES.Civilian:
        displayValue =
          "Civilian - " + (formData.isNewCivMil === "yes" ? "New" : "Existing");
        break;
      case EMPTYPES.Military:
        displayValue =
          "Military - " + (formData.isNewCivMil === "yes" ? "New" : "Existing");
        break;
      case EMPTYPES.Contractor:
        displayValue = "Contractor";
        break;
    }
    return displayValue;
  };

  let closedOrCancelledNotice: string = "";

  if (formData.status === "Cancelled") {
    closedOrCancelledNotice = `This request was cancelled on ${formData.closedOrCancelledDate?.toDateString()}.\n\nReason: ${
      formData.cancelReason
    }`;
  } else if (formData.status === "Closed") {
    closedOrCancelledNotice = `This request was closed on ${formData.closedOrCancelledDate?.toDateString()}.`;
  }

  return (
    <>
      {closedOrCancelledNotice && (
        <MessageBar
          messageBarType={MessageBarType.warning}
          isMultiline={true}
          className={classes.messageBar}
        >
          {closedOrCancelledNotice}
        </MessageBar>
      )}
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
              {formData.hasExistingCAC === "yes"
                ? formData.CACExpiration?.toLocaleDateString()
                : "No CAC"}
            </Text>
          </div>
        )}
        <div>
          <Label
            weight="semibold"
            htmlFor="workLocationCVId"
            aria-describedby="workLocationCVId"
          >
            Local or Remote?
          </Label>
          <br />
          <Text id="workLocationCVId" className={classes.capitalize}>
            {formData.workLocation === "local"
              ? formData.workLocation
              : formData.workLocationDetail}
          </Text>
        </div>
        {(formData.empType === EMPTYPES.Civilian ||
          formData.empType === EMPTYPES.Military) && (
          <div>
            <Label weight="semibold" htmlFor="MPCNCVId">
              MPCN
            </Label>
            <br />
            <Text id="MPCNCVId">{formData.MPCN}</Text>
          </div>
        )}
        <div>
          <Label weight="semibold" htmlFor="SARCVId">
            SAR
          </Label>
          <br />
          <Text id="SARCVId">{formData.SAR}</Text>
        </div>
        {formData.empType === EMPTYPES.Civilian && (
          <div>
            <Label weight="semibold" htmlFor="SARCVId">
              Position Sensitivity Code
            </Label>
            <br />
            <Text id="sensitivityCodeCVId">{sensitivityCode}</Text>
          </div>
        )}
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
          formData.isNewCivMil === "no" && (
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
            <Label weight="semibold" htmlFor="isTravelerCVId">
              Requires Travel Ability?
            </Label>
            <br />
            <Text id="isTravelerCVId" className={classes.capitalize}>
              {formData.isTraveler}
            </Text>
          </div>
        )}
        {(formData.empType === EMPTYPES.Civilian ||
          formData.empType === EMPTYPES.Military) && (
          <div>
            <Label weight="semibold" htmlFor="isSupervisorCVId">
              Supervisor?
            </Label>
            <br />
            <Text id="isSupervisorCVId" className={classes.capitalize}>
              {formData.isSupervisor}
            </Text>
          </div>
        )}
      </div>
    </>
  );
};
