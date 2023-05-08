import { FunctionComponent } from "react";
import { EMPTYPES } from "constants/EmpTypes";
import { makeStyles, Label, Text } from "@fluentui/react-components";
import { IOutRequest } from "api/RequestApi";
import { MessageBar, MessageBarType } from "@fluentui/react";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";

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
  messageBar: { whiteSpace: "pre-wrap" }, // Allow the \n character to wrap text
});

export interface IOutRequestViewCompact {
  formData: IOutRequest;
}

export const OutRequestViewCompact: FunctionComponent<
  IOutRequestViewCompact
> = (props) => {
  const classes = useStyles();
  const formData: IOutRequest = props.formData;
  const codeEntry = SENSITIVITY_CODES.find(
    (code) => code.key === formData.sensitivityCode
  );
  const sensitivityCode = codeEntry ? codeEntry.text : "";

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
      <div id="outReqCompact" className={classes.compactContainer}>
        <div>
          <Label weight="semibold" htmlFor="empNameCVId">
            Employee Name
          </Label>
          <br />
          <Text id="empNameCVId">{formData.empName}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="empTypeCVId">
            Employee Type
          </Label>
          <br />
          <Text id="empTypeCVId">{formData.empType}</Text>
        </div>
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
          <Label weight="semibold" htmlFor="departDateCVId">
            Last date with org
          </Label>
          <br />
          <Text id="departDateCVId">
            {formData.lastDay?.toLocaleDateString()}
          </Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="beginDateCVId">
            Est Out-processing begin date
          </Label>
          <br />
          <Text id="beginDateCVId">
            {formData.beginDate?.toLocaleDateString()}
          </Text>
        </div>
      </div>
    </>
  );
};
