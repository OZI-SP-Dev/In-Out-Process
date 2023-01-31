import {
  ConstrainMode,
  IColumn,
  IGroup,
  SelectionMode,
  ShimmeredDetailsList,
  Toggle,
} from "@fluentui/react";
import { makeStyles } from "@fluentui/react-components";
import { ICheckListItem, useMyChecklistItems } from "api/CheckListItemApi";
import { IInRequest, useRequests } from "api/RequestApi";
import { Link } from "react-router-dom";
import { UserContext } from "providers/UserProvider";
import { RoleType } from "api/RolesApi";
import { useContext, useState } from "react";
import { CheckListItemButton } from "components/CheckList/CheckListItemButton";

/** ICheckListItem extended by adding the request info
 * It is optional since we may not have the request referenced by
 * the checklist.  The mapping will drop those which don't have
 * a request reference
 */
interface ICheckListItemLookup extends ICheckListItem {
  request?: IInRequest;
}

/** FluentUI Styling */
const useStyles = makeStyles({
  myCheckListItemsHeader: {
    paddingLeft: "1em",
    paddingRight: "1em",
  },
});

/** This is a component to display the Active CheckListItems that the current user can complete */
export const MyCheckListItems = () => {
  /** FluentUI Styling */
  const classes = useStyles();

  /** The user from UserContext */
  const user = useContext(UserContext);

  /** Hook to get the requests */
  const { data: requests } = useRequests();

  /** This is a type used to create an object to store whether the group is collapsed */
  type groupcollapse = { [key in RoleType]: boolean };

  /** The object that tells the ShimmeredDetailList how to display the groups */
  let groups: { all: IGroup[]; currentItem?: IGroup } | undefined;

  // State to hold whether or not the group is collapsed or not
  // This way when the screen is re-rendered based on the items updating (added/removed)
  // It leaves the group in the collapsed/uncollapsed state it was in
  const [groupCollapsedState, setGroupCollapsedState] = useState<groupcollapse>(
    // Initialize all RoleTypes as collapsed
    Object.values(RoleType).reduce((prevVal, curVal) => {
      prevVal[curVal] = true;
      return prevVal;
    }, {} as groupcollapse)
  );

  const [showingCompleted, setShowingCompleted] = useState(false);

  /** Hook to get current user's CheckListItems, even completed ones */
  const { data: checklistItems } = useMyChecklistItems(
    user.roles || [],
    showingCompleted
  );

  /** The current user's CheckListItems */
  let myCheckListItems: ICheckListItemLookup[] | undefined;

  // Ensure we have all the data we need to correctly determine which items to show
  if (checklistItems && requests && user?.user && user?.roles) {
    // Create an object where we can quickly reference the Request based on the Id
    const requestLookup = new Map(
      requests.map((request) => [request.Id, request])
    );

    // Create an object containg both the CheckList item and the reference to the Request
    myCheckListItems = checklistItems.map((item) => {
      let retItem: ICheckListItemLookup = {
        ...item,
        request: requestLookup.get(item.RequestId),
      };
      return retItem;
    });

    // Filter the checklist to remove those that are not valid for the current user
    myCheckListItems = myCheckListItems.filter(
      (item) =>
        // Don't return items if we don't have a reference to the request it belongs to
        item.request &&
        // Only return items for requests that are Active
        item.request.status === "Active" &&
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

    // Sort them in the order of the Lead, so that they can be grouped
    myCheckListItems.sort((a, b) => a.Lead.localeCompare(b.Lead));

    // Create the groups reference object that tells the ShimmeredDetailList how to render
    groups = myCheckListItems.reduce(
      (prevValue, curValue, curIndex) => {
        if (prevValue.currentItem.key === curValue.Lead) {
          // If the Lead of the Current Item is the same as the Previous, then increment the count
          prevValue.currentItem.count++;
          return prevValue;
        } else {
          // Otherwise, we have a new Lead, so create a currentItem object
          prevValue.currentItem = {
            key: curValue.Lead,
            name: "Lead : " + curValue.Lead,
            startIndex: curIndex,
            count: 1,
            level: 0,
            isCollapsed: groupCollapsedState?.[curValue.Lead],
          };
          // Add a reference to this new object to the array of all groups
          prevValue.all.push(prevValue.currentItem);
          return prevValue;
        }
      },
      // Provide an initial value to the reduce function, so that we begin evaluating on index 0 not 1
      { currentItem: {} as IGroup, all: [] as IGroup[] }
    );
  }

  // If there is only 1 group that has CheckListItems -- then expand it
  if (groups?.all.length === 1) {
    groups.all[0].isCollapsed = false;
  }

  // Define columns for details list
  const columns: IColumn[] = [
    {
      key: "item",
      name: "Item",
      fieldName: "Id",
      minWidth: 40,
      maxWidth: 40,
      isResizable: false,
    },
    {
      key: "title",
      name: "Title",
      fieldName: "Title",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
      onRender: (item) => (
        <Link to={"/item/" + item.RequestId}>{item.Title}</Link>
      ),
    },
    {
      key: "complete",
      name: "Complete",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
      onRender: (item) => {
        if (item.CompletedDate) {
          return item.CompletedDate.toLocaleString();
        } else {
          return <CheckListItemButton checklistItem={item} />;
        }
      },
    },
    {
      key: "empName",
      name: "Employee Name",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
      onRender: (item) => {
        if (item.request.empName) {
          return item.request.empName;
        }
      },
    },
    {
      key: "onBoardDate",
      name: "Estimated On-Boarding",
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
      key: "completionTargetDate",
      name: "Target Completion",
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
      <div className={classes.myCheckListItemsHeader}>
        <h1>My CheckList Items</h1>
      </div>
      <Toggle
        className={classes.myCheckListItemsHeader}
        label="Toggle to show/hide completed items"
        onChange={() => setShowingCompleted(!showingCompleted)}
        onText="Showing all items"
        offText="Showing open items"
      />
      <ShimmeredDetailsList
        setKey="Id"
        items={myCheckListItems || []}
        columns={columns}
        enableShimmer={!checklistItems}
        selectionMode={SelectionMode.none}
        groups={groups?.all}
        groupProps={{
          headerProps: {
            onToggleCollapse: (group) => {
              // Update the state when the header is toggled
              setGroupCollapsedState({
                ...groupCollapsedState,
                [group.key]: !group.isCollapsed, //The new state is the opposite of what is was before they toggled
              });
            },
          },
        }}
        compact={true}
        constrainMode={ConstrainMode.unconstrained}
      />
    </>
  );
};
