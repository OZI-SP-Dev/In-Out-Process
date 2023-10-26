import { FunctionComponent, useEffect, useRef, useState } from "react";
import { EMPTYPES } from "constants/EmpTypes";
import {
  makeStyles,
  Label,
  Text,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  Button,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import { IInRequest } from "api/RequestApi";
import { MessageBar, MessageBarType } from "@fluentui/react";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";
import { RoleType } from "api/RolesApi";
import { useAdditionalInfo } from "api/AdditionalInfoApi";
import {
  Dismiss24Regular,
  Eye16Filled,
  Eye16Regular,
} from "@fluentui/react-icons";

/* FluentUI Styling */
const useStyles = makeStyles({
  compactContainer: {
    display: "grid",
    paddingLeft: ".5em",
    paddingRight: ".5em",
    columnGap: "2em",
    rowGap: ".5em",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))",
  },
  capitalize: { textTransform: "capitalize" },
  messageBar: { whiteSpace: "pre-wrap" }, // Allow the \n character to wrap text
});

export interface IInRequestViewCompact {
  formData: IInRequest;
  roles: RoleType[];
}

export const InRequestViewCompact: FunctionComponent<IInRequestViewCompact> = (
  props
) => {
  const classes = useStyles();
  const formData = props.formData;
  const additionalInfo = useAdditionalInfo(formData.Id);
  const codeEntry = SENSITIVITY_CODES.find(
    (code) => code.key === formData.sensitivityCode
  );
  const sensitivityCode = codeEntry ? codeEntry.text : "";
  const isAuthSSN =
    props.roles.includes(RoleType.ATAAPS) ||
    props.roles.includes(RoleType.DTS) ||
    props.roles.includes(RoleType.GTC) ||
    props.roles.includes(RoleType.SECURITY) ||
    props.roles.includes(RoleType.SUPERVISOR);
  const [showSSN, setShowSSN] = useState<number>();
  const noSSN = additionalInfo?.data?.length === 0;
  const noSSNRef = useRef(noSSN);
  const formattedSSN =
    showSSN && additionalInfo.data?.[0] && !additionalInfo.isStale
      ? `${additionalInfo.data[0]?.Title.substring(
          0,
          3
        )}-${additionalInfo.data[0]?.Title.substring(
          3,
          5
        )}-${additionalInfo.data[0]?.Title.substring(5, 9)}`
      : showSSN
      ? "Retrieving"
      : "*************";

  /** Function to hide the SSN and clear the setTimeout */
  const hideSSN = () => {
    clearTimeout(showSSN);
    setShowSSN(undefined);
  };

  /** Function to hide the SSN after the setTimeout has occured
   *  Has an exception to not close the Dialog if it is open
   */
  const hideSSN2 = function () {
    if (!noSSNRef.current) {
      setShowSSN(undefined);
    }
  };

  useEffect(() => {
    // Update the current value of the Ref when React-Query updates
    noSSNRef.current = additionalInfo?.data?.length === 0;
  }, [additionalInfo.data]);

  // Display the Employee Type in a shortened format
  // If it is a Civilian add New/Existing after depending on the selection
  let displayEmpType = "";
  switch (formData.empType) {
    case EMPTYPES.Civilian:
      displayEmpType =
        "Civilian - " + (formData.isNewCivMil === "yes" ? "New" : "Existing");
      break;
    case EMPTYPES.Military:
      displayEmpType =
        "Military - " + (formData.isNewCivMil === "yes" ? "New" : "Existing");
      break;
    case EMPTYPES.Contractor:
      displayEmpType = "Contractor";
      break;
  }

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
        {isAuthSSN &&
          (formData.empType === EMPTYPES.Civilian ||
            formData.empType === EMPTYPES.Military) &&
          !formData.closedOrCancelledDate && (
            <div>
              <Label weight="semibold" htmlFor="ssnCVId">
                SSN: (CUI - PRVCY)
              </Label>
              <br />
              <Text style={{ width: "6em", display: "inline-block" }}>
                {formattedSSN}
              </Text>
              {!showSSN ? (
                <Eye16Regular
                  onClick={() => {
                    if (!additionalInfo.data || additionalInfo.isStale) {
                      additionalInfo.refetch();
                    }
                    setShowSSN(window.setTimeout(hideSSN2, 10000));
                  }}
                />
              ) : (
                <Eye16Filled onClick={hideSSN} />
              )}
            </div>
          )}
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
          <>
            <div>
              <Label
                weight="semibold"
                htmlFor="contractNumberCVId"
                aria-describedby="contractNumberCVId"
              >
                Contract Number
              </Label>
              <br />
              <Text id="contractNumberCVId">{formData.contractNumber}</Text>
            </div>
            <div>
              <Label
                weight="semibold"
                htmlFor="contractEndDateCVId"
                aria-describedby="contractEndDateCVId"
              >
                Contract End Date
              </Label>
              <br />
              <Text id="contractEndDateCVId">
                {formData.contractEndDate?.toLocaleDateString()}
              </Text>
            </div>
            <div>
              <Label weight="semibold" htmlFor="cacExpirationCVId">
                CAC Expiration
              </Label>
              <br />
              <Text id="cacExpirationCVId">
                {formData.hasExistingCAC === "yes"
                  ? formData.CACExpiration?.toLocaleDateString()
                  : "No CAC"}
              </Text>
            </div>
          </>
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
        {(formData.empType === EMPTYPES.Civilian ||
          formData.empType === EMPTYPES.Military) && (
          <div>
            <Label weight="semibold" htmlFor="SARCVId">
              SAR
            </Label>
            <br />
            <Text id="SARCVId">{formData.SAR}</Text>
          </div>
        )}
        {formData.empType === EMPTYPES.Military && formData.SAR === 5 && (
          <div>
            <Label
              weight="semibold"
              htmlFor="isSCICVId"
              aria-describedby="isSCICVId"
            >
              Requires SCI?
            </Label>
            <br />
            <Text id="isSCICVId" className={classes.capitalize}>
              {formData.isSCI}
            </Text>
          </div>
        )}
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
        <div>
          <Label weight="semibold" htmlFor="jobTitleCVId">
            Job/Duty Title
          </Label>
          <br />
          <Text id="jobTitleCVId">{formData.jobTitle}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="dutyPhoneCVId">
            Duty Phone #
          </Label>
          <br />
          <Text id="dutyPhoneCVId">{formData.dutyPhone}</Text>
        </div>
      </div>
      {
        /* Popup dialog box for when the Supervisor doesn't have access to SSN 
           Includes check to make sure we aren't fetching to catch the case the
           new supervisor just added an SSN, and now wants to view it */
        noSSN && !additionalInfo.isFetching && (
          <Dialog open={!!showSSN}>
            <DialogSurface aria-describedby="noSSNDialog">
              <DialogBody>
                <DialogTitle
                  action={
                    <Button
                      appearance="subtle"
                      aria-label="close"
                      icon={<Dismiss24Regular />}
                      onClick={hideSSN}
                    />
                  }
                >
                  Unable to view SSN
                </DialogTitle>
                <DialogContent id="noSSNDialog">
                  <div>
                    <Text id="empName">
                      You did not enter the original SSN, and therefore cannot
                      view it. If it was inccorect and needs updated, you may
                      enter the full SSN to overwrite the original by clicking
                      the "Edit" button, and making the update
                    </Text>
                  </div>
                </DialogContent>
                <DialogActions>
                  <Button appearance="primary" onClick={hideSSN}>
                    OK
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        )
      }
    </>
  );
};
