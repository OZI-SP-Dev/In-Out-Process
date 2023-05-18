import { IColumn, SelectionMode, ShimmeredDetailsList } from "@fluentui/react";
import { Button, makeStyles, tokens } from "@fluentui/react-components";
import { AddIcon } from "@fluentui/react-icons-mdl2";
import { useMyRequests } from "api/RequestApi";
import { Link, useNavigate } from "react-router-dom";

/* FluentUI Styling */
const useStyles = makeStyles({
  buttonBar: {
    display: "flex",
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
      <div className={classes.buttonBar}>
        <Button
          className={classes.createButtons}
          appearance="primary"
          icon={
            <AddIcon
              className={classes.icon}
              onClick={() => navigateTo("/new")}
            />
          }
        >
          New In Processing Request
        </Button>
        <Button
          className={classes.createButtons}
          appearance="primary"
          icon={
            <AddIcon
              className={classes.icon}
              onClick={() => navigateTo("/depart")}
            />
          }
        >
          New Out Processing Request
        </Button>
      </div>
      <div className={classes.myRequestsHeader}>
        <h2>My Requests</h2>
      </div>
      <div className={classes.requestList}>
        <ShimmeredDetailsList
          items={data || []}
          columns={columns}
          enableShimmer={!data}
          selectionMode={SelectionMode.none}
          setKey="Id"
        />
      </div>
    </>
  );
};
