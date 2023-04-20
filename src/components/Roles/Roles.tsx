import { useContext, useMemo, useState } from "react";
import {
  RoleType,
  SPRole,
  useAllUserRolesByRole,
  useAllUserRolesByUser,
  useRoleManagement,
} from "api/RolesApi";
import { makeStyles } from "@fluentui/react-components";
import { Navigate } from "react-router-dom";
import {
  ConstrainMode,
  DetailsList,
  IColumn,
  IObjectWithKey,
  SelectionMode,
  Selection,
  ICommandBarItemProps,
  CommandBar,
} from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { AddUserRolePanel } from "components/Roles/AddUserRolePanel";
import { UserContext } from "providers/UserProvider";

/** FluentUI Styling */
const useStyles = makeStyles({
  header: {
    paddingLeft: "1em",
    paddingRight: "1em",
  },
});

const Roles: React.FunctionComponent = () => {
  const classes = useStyles();

  // Which view is selected
  const [selectedValue, setSelectedValue] = useState<"ByRole" | "ByUser">(
    "ByRole"
  );

  // Get the role Maps for by User and by Role
  const { data: allRolesByUser } = useAllUserRolesByUser();
  const { data: allRolesByRole } = useAllUserRolesByRole();

  // Get the hook with functions to perform Role Management
  const { removeRole } = useRoleManagement();

  // Get the role of the current user
  const userRoles = useContext(UserContext).roles;

  // Selected items in the DetailsList
  const [selectedItems, setSelectedItems] = useState<IObjectWithKey[]>([]);

  /* Boolean state for determining whether or not the AddUserRolePanel is shown */
  const [isAddPanelOpen, { setTrue: showAddPanel, setFalse: hideAddPanel }] =
    useBoolean(false);

  /* State holding the current selection object used by the DetailsList */
  const [selection] = useState(
    new Selection({
      onSelectionChanged: () => {
        // When the selection changes -- update our state containing selected items
        setSelectedItems(selection.getSelection());
      },
    })
  );

  /* Memoized value containing the data for DetailsList
      that only gets updated if allRolesByRole, allRolesByUser, or selectedValue changes) */
  const detailListData = useMemo(() => {
    const allItems: SPRole[] = [];
    const groups = [];

    // If we are in the ByUser view
    if (selectedValue === "ByUser") {
      if (allRolesByUser?.values()) {
        let itemCount = 0;
        for (let entry of allRolesByUser?.values()) {
          let newEntry = entry.sort((a, b) =>
            a.Title.toLowerCase().localeCompare(b.Title.toLowerCase())
          );
          groups.push({
            key: entry[0].User.Title,
            name: "User : " + entry[0].User.Title,
            startIndex: itemCount,
            count: entry.length,
            level: 0,
          });
          allItems.push(...newEntry);
          itemCount += entry.length;
        }
        return { allItems: allItems, groups: groups };
      }
    } else {
      // If we are in the ByRole view
      if (allRolesByRole?.values()) {
        let itemCount = 0;
        // We don't want to show SUPERVISOR or EMPLOYEE roles as something to view
        const rolesToShow = Object.values(RoleType)
          .filter(
            (item) => item !== RoleType.SUPERVISOR && item !== RoleType.EMPLOYEE
          )
          .sort(function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
          });
        for (let entry of rolesToShow) {
          let roleEntry = allRolesByRole.get(entry);
          let newEntry: SPRole[] = [];
          if (roleEntry) {
            newEntry = roleEntry.sort((a, b) =>
              a.User.Title.toLowerCase().localeCompare(
                b.User.Title.toLowerCase()
              )
            );
          }
          groups.push({
            key: entry,
            name: "Role : " + entry,
            startIndex: itemCount,
            count: newEntry.length,
            level: 0,
          });
          allItems.push(...newEntry);
          itemCount += newEntry.length;
        }
        return { allItems: allItems, groups: groups };
      }
    }
  }, [allRolesByRole, allRolesByUser, selectedValue]);

  let commandItems: ICommandBarItemProps[] = [
    {
      key: "add",
      text: "Add User",
      iconProps: { iconName: "Add" },
      onClick: showAddPanel,
    },
  ];

  // If they have selected an item, then add a Delete button
  if (selectedItems.length > 0) {
    commandItems.push({
      key: "delete",
      text: "Delete",
      iconProps: { iconName: "Delete" },
      onClick: () => {
        for (let entry of selectedItems) {
          let spRoleEntry = entry as SPRole;
          removeRole.mutate(spRoleEntry.Id);
        }
      },
    });
  }

  const farCommandButtons: ICommandBarItemProps[] = [
    {
      key: "view",
      text: selectedValue === "ByRole" ? "By Role" : "By User",
      iconProps: { iconName: "List" },
      subMenuProps: {
        items: [
          {
            key: "byRole",
            text: "By Role",
            onClick: () => setSelectedValue("ByRole"),
          },
          {
            key: "byUser",
            text: "By User",
            onClick: () => setSelectedValue("ByUser"),
          },
        ],
      },
    },
  ];

  // Ensure we have a roles object before determining whether or not to redirect
  if (!userRoles) {
    return <>Loading...</>;
  }

  if (!userRoles.includes(RoleType.ADMIN)) {
    // If they are not an ADMIN, redirect to the Homepage
    return <Navigate to="/" replace={true} />;
  }

  const columns: IColumn[] = [
    {
      key: "column0",
      name: selectedValue === "ByRole" ? "User" : "Role",
      minWidth: 100,
      isResizable: true,
      onRender: (item) =>
        selectedValue === "ByRole" ? item.User.Title : item.Title,
    },
  ];

  return (
    <>
      <h2 className={classes.header}>Current Assigned Roles</h2>
      <CommandBar
        items={commandItems}
        farItems={farCommandButtons}
      ></CommandBar>
      <DetailsList
        items={detailListData?.allItems ? detailListData.allItems : []}
        columns={columns}
        selectionMode={SelectionMode.multiple}
        constrainMode={ConstrainMode.unconstrained}
        groups={detailListData?.groups}
        selection={selection}
        groupProps={{ showEmptyGroups: true }}
      ></DetailsList>
      <AddUserRolePanel
        isAddPanelOpen={isAddPanelOpen}
        onAddCancel={hideAddPanel}
        onAdd={hideAddPanel}
      />
    </>
  );
};

export default Roles;
