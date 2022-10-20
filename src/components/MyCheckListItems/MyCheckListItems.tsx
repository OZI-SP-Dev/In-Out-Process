import { IColumn, SelectionMode, ShimmeredDetailsList } from "@fluentui/react";
import { makeStyles, tokens } from "@fluentui/react-components";
import { ICheckListItem, useOpenChecklistItems } from "api/CheckListItemApi";
import { IInRequest, useRequests } from "api/RequestApi";
import { Link } from "react-router-dom";
import { UserContext } from "providers/UserProvider";
import { RoleType } from "api/RolesApi";
import { useContext } from "react";
type checklistItemLookup = ICheckListItem & { request: IInRequest };

/* FluentUI Styling */
const useStyles = makeStyles({
  myRequestsHeader: {
    paddingLeft: "1em",
    paddingRight: "1em",
  },
  requestList: {
    paddingLeft: "1em",
    paddingRight: "1em",
  },
});

export const MyCheckListItems = () => {
  const { data: checklistItems } = useOpenChecklistItems();
  const { data: requests } = useRequests();
  const classes = useStyles();
  const user = useContext(UserContext);

  let requestLookup: {
    [k: string]: IInRequest;
  };
  let checkListItems2;

  if (checklistItems && requests && user?.user && user?.roles) {
    requestLookup = Object.fromEntries(
      requests.map((request) => [request.Id.toString(), request])
    );
    checkListItems2 = checklistItems.map((item) => {
      let retItem: checklistItemLookup = {
        ...item,
        request: requestLookup[item.ReqId.toString()],
      };
      return retItem;
    });

    checkListItems2 = checkListItems2.filter(
      (item) =>
        // Don't return items for requests that are cancelled/closed
        !item.request.closedOrCancelledDate &&
        // Return items that the current user is the Employee or Supervisor for Employee checklist items
        ((item.Lead === RoleType.EMPLOYEE &&
          (item.request.employee?.Id === user?.user?.Id ||
            item.request.supGovLead.Id === user?.user?.Id)) ||
          // Return items that the current user is the Supervisor for Supervisor checklist items
          (item.Lead === RoleType.SUPERVISOR &&
            item.request.supGovLead.Id === user?.user?.Id) ||
          // The current user has the role the checklist item is for
          user.roles?.includes(item.Lead))
    );
  }

  // Define columns for details list
  const columns: IColumn[] = [
    {
      key: "column0",
      name: "Item",
      fieldName: "Id",
      minWidth: 40,
      maxWidth: 40,
      isResizable: false,
    },
    {
      key: "column1",
      name: "Title",
      fieldName: "Title",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: "column2",
      name: "Lead",
      fieldName: "Lead",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: "column3",
      name: "Employee Name",
      fieldName: "request.empName",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
      onRender: (item) => (
        <Link to={"/item/" + item.ReqId}>{item.request.empName}</Link>
      ),
    },
    {
      key: "column4",
      name: "Estimated On-Boarding",
      fieldName: "eta",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
      onRender: (item) => {
        if (item.request.eta) {
          return item.request.eta.toLocaleDateString();
        }
      },
    },
    {
      key: "column5",
      name: "Target Completion",
      fieldName: "completionDate",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
      onRender: (item) => {
        if (item.request.completionDate) {
          return item.request.completionDate.toLocaleDateString();
        }
      },
    },
  ];

  return (
    <>
      <br />
      <div className={classes.myRequestsHeader}>
        <h2>CheckList Items</h2>
      </div>
      <div className={classes.requestList}>
        <ShimmeredDetailsList
          items={checkListItems2 || []}
          columns={columns}
          enableShimmer={!checklistItems}
          selectionMode={SelectionMode.none}
        />
      </div>
    </>
  );
};
