import { ICheckListItem } from "api/CheckListItemApi";
import {
  ActivityItem,
  CommandBar,
  ICommandBarItemProps,
  IPanelProps,
  IRenderFunction,
  Panel,
  PanelType,
} from "@fluentui/react";
import { Label, Text, makeStyles } from "@fluentui/react-components";
import { FunctionComponent } from "react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { InfoIcon, TextFieldIcon } from "@fluentui/react-icons-mdl2";
import { sanitize } from "dompurify";
import { RoleType } from "api/RolesApi";

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
  completeItem: (itemId: number) => void;
  roles: RoleType[];
}

export const CheckListItemPanel: FunctionComponent<ICheckList> = (props) => {
  const classes = useStyles();
  const compProps = props;

  // The Navigation Header of the CheckListItemPanel, containing the "Mark Complete" and "Close" buttons
  const onRenderNavigationContent: IRenderFunction<IPanelProps> = (
    props,
    defaultRender
  ) => {
    const items: ICommandBarItemProps[] = [
      {
        key: "markComplete",
        text: "Mark Complete",
        iconProps: { iconName: "CheckMark" },
        disabled: compProps.item.CompletedBy
          ? true
          : false || !compProps.roles?.includes(compProps.item.Lead),
        onClick: (ev?, item?) => {
          compProps.completeItem(compProps.item.Id);
        },
      },
      {
        key: "closePanel",
        text: "Close",
        iconProps: { iconName: "Cancel" },
        onClick: props?.onDismiss,
      },
    ];

    return (
      <>
        <div className={classes.panelNavCommandBar}>
          {
            // If they are the Lead then show the CommandBar, otherwise hide it
            compProps.roles?.includes(compProps.item.Lead) && (
              <CommandBar items={items}></CommandBar>
            )
          }
        </div>
        {
          // Render the default close button
          defaultRender!(props)
        }
      </>
    );
  };

  return (
    <Panel
      isOpen={props.isOpen}
      isBlocking={false}
      onDismiss={props.onDismiss}
      onRenderNavigationContent={onRenderNavigationContent}
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
              <ActivityItem
                activityDescription={<div>Not yet completed</div>}
              ></ActivityItem>
            )}
          </div>
        </div>
      </FluentProvider>
    </Panel>
  );
};
