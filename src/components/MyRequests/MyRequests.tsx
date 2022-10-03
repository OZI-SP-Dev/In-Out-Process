import {
  CommandBar,
  IColumn,
  ICommandBarItemProps,
  SelectionMode,
  ShimmeredDetailsList,
} from "@fluentui/react";
import { makeStyles, tokens } from "@fluentui/react-components";
import { useMyRequests } from "api/RequestApi";
import { Link, useNavigate } from "react-router-dom";

/* FluentUI Styling */
const useStyles = makeStyles({
  commandBar: {
    height: "2.5em",
  },
  createButtons: {
    height: "2.5em",
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorBrandBackgroundInverted,
    marginLeft: "1em",
    marginRight: "1em",
    ":hover": {
      backgroundColor: tokens.colorBrandBackgroundHover,
      color: tokens.colorBrandBackgroundInvertedHover,
    },
  },
  icon: {
    color: tokens.colorBrandBackgroundInverted,
    ":hover": {
      color: tokens.colorBrandBackgroundInvertedHover,
    },
  },
  myRequestsHeader: {
    paddingLeft: "1em",
    paddingRight: "1em",
  },
  requestList: {
    paddingLeft: "1em",
    paddingRight: "1em",
  },
});

export const MyRequests = () => {
  const { data } = useMyRequests();
  const navigateTo = useNavigate();
  const classes = useStyles();

  function createNewOutRequest() {
    window.alert("This feature will be coming on a later release");
    return true;
  }

  const menuItems: ICommandBarItemProps[] = [
    {
      key: "newInRequest",
      text: "New In Processing Request",
      iconProps: { iconName: "Add", className: classes.icon },
      className: classes.createButtons,
      onClick: () => {
        navigateTo("/new");
      },
    },
    {
      key: "newOutRequest",
      text: "New Out Processing Request",
      iconProps: {
        iconName: "Add",
        className: classes.icon,
      },
      className: classes.createButtons,
      onClick: () => {
        createNewOutRequest();
      },
    },
  ];
  const columns: IColumn[] = [
    {
      key: "column0",
      name: "Item",
      fieldName: "Id",
      minWidth: 30,
      maxWidth: 30,
      isResizable: false,
    },
    {
      key: "column1",
      name: "Employee Name",
      fieldName: "empName",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
      onRender: (item) => <Link to={"item/" + item.Id}>{item.empName}</Link>,
    },
    {
      key: "column2",
      name: "Estimated On-Boarding",
      fieldName: "eta",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
      onRender: (item) => {
        if (item.eta) {
          return item.eta.toLocaleDateString();
        }
      },
    },
    {
      key: "column3",
      name: "Status",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
      onRender: (item) => {
        if (item.eta) {
          /*TODO: Change to show some sort of status field once established */
          return item.eta.toLocaleDateString();
        }
      },
    },
  ];

  return (
    <>
      <br />
      <CommandBar className={classes.commandBar} items={menuItems} />
      <div className={classes.myRequestsHeader}>
        <h2>My Requests</h2>
      </div>
      <div className={classes.requestList}>
        <ShimmeredDetailsList
          items={data || []}
          columns={columns}
          enableShimmer={!data}
          selectionMode={SelectionMode.none}
        />
      </div>
    </>
  );
};
