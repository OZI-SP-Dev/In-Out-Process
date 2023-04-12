import { ICheckListItem } from "api/CheckListItemApi";
import { ActivityItem, Panel, PanelType } from "@fluentui/react";
import { Label, Text, makeStyles } from "@fluentui/react-components";
import { FunctionComponent } from "react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { InfoIcon, TextFieldIcon } from "@fluentui/react-icons-mdl2";
import { addHook, sanitize } from "dompurify";
import { RoleType } from "api/RolesApi";
import { IInRequest } from "api/RequestApi";
import { CheckListItemButton } from "components/CheckList/CheckListItemButton";
import { CheckListItemPrereq } from "components/CheckList/CheckListItemPrereq";
import { CheckListItemReactivateButton } from "components/CheckList/CheckListItemReactivateButton";

addHook("afterSanitizeAttributes", function (node) {
  if (node.tagName === "A") {
    // Set all links in the Description to be opened in a new tab
    node.setAttribute("target", "_blank");
    // Reduce security/performance issues associated with opening in a new tab
    node.setAttribute("rel", "noreferer");
  }
});

const useStyles = makeStyles({
  detailContainer: { display: "block" },
  fieldIcon: {
    marginRight: ".5em",
  },
  fieldContainer: {
    paddingLeft: ".25em",
    paddingRight: ".25em",
    paddingTop: ".5em",
    paddingBottom: ".5em",
    display: "grid",
    position: "relative",
  },
  fieldLabel: {
    paddingBottom: ".5em",
    display: "flex",
  },
  panelNavCommandBar: {
    marginRight: "auto", // Pull Command Bar far-left and close far-right
  },
});

export interface ICheckList {
  isOpen: boolean;
  item: ICheckListItem;
  onDismiss: () => void;
  roles: RoleType[];
  request: IInRequest;
}

export const CheckListItemPanel: FunctionComponent<ICheckList> = (props) => {
  const classes = useStyles();

  return (
    <Panel
      isOpen={props.isOpen}
      isBlocking={false}
      onDismiss={props.onDismiss}
      headerText={props.item ? props.item.Title : ""}
      type={PanelType.medium}
    >
      <FluentProvider theme={webLightTheme}>
        <div className={classes.detailContainer}>
          <hr />
          <div className={classes.fieldContainer}>
            <Label
              htmlFor="panelLead"
              size="small"
              weight="semibold"
              className={classes.fieldLabel}
            >
              <TextFieldIcon className={classes.fieldIcon} />
              Lead
            </Label>
            <Text id="panelLead">{props.item.Lead}</Text>
          </div>
          <div className={classes.fieldContainer}>
            <Label
              htmlFor="panelDescription"
              size="small"
              weight="semibold"
              className={classes.fieldLabel}
            >
              <TextFieldIcon className={classes.fieldIcon} />
              Description
            </Label>
            <div
              id="panelDescription"
              dangerouslySetInnerHTML={{
                __html: sanitize(props.item.Description),
              }}
            />
          </div>
          <div className={classes.fieldContainer}>
            <Label
              htmlFor="panelCompletion"
              size="small"
              weight="semibold"
              className={classes.fieldLabel}
            >
              <InfoIcon className={classes.fieldIcon} />
              Completion Details
            </Label>
            {props.item.CompletedBy ? (
              <ActivityItem
                activityDescription={
                  <div>{props.item.CompletedBy?.Title} completed</div>
                }
                activityPersonas={[props.item.CompletedBy]}
                timeStamp={props.item.CompletedDate?.toFormat("MMMM dd, yyyy")}
              ></ActivityItem>
            ) : (
              <>Not yet completed</>
            )}
          </div>
          <div className={classes.fieldContainer}>
            {!props.item.CompletedBy &&
              props.roles?.includes(props.item.Lead) &&
              props.request.status === "Active" && (
                <CheckListItemButton checklistItem={props.item} />
              )}
          </div>
          {/* Only show the Prerequisite section if the Request is Active, and the Checklist Item is NOT Active */}
          {props.request.status === "Active" && !props.item.Active && (
            <div className={classes.fieldContainer}>
              <Label
                htmlFor="panelCompletion"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
              >
                <InfoIcon className={classes.fieldIcon} />
                Prerequisites
              </Label>
              <CheckListItemPrereq checklistItem={props.item} />
            </div>
          )}
          {/* Only show the Reactivate section if the Request is Active, and the Checklist Item is Completed, and the User is the Lead  */}
          {props.request.status === "Active" &&
            props.item.CompletedBy &&
            props.roles?.includes(props.item.Lead) && (
              <div className={classes.fieldContainer}>
                <Label
                  htmlFor="reactivationButton"
                  size="small"
                  weight="semibold"
                  className={classes.fieldLabel}
                >
                  <InfoIcon className={classes.fieldIcon} />
                  Reactivate Checklist Item
                </Label>
                <CheckListItemReactivateButton checklistItem={props.item} />
              </div>
            )}
        </div>
      </FluentProvider>
    </Panel>
  );
};
