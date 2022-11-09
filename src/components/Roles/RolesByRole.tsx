import { useState } from "react";
import {
  useRoleManagement,
  RoleType,
  useAllUserRolesByRole,
  SPRole,
} from "api/RolesApi";
import {
  makeStyles,
  SelectTabData,
  SelectTabEvent,
  Tab,
  TabList,
  TabValue,
} from "@fluentui/react-components";
import {
  ConstrainMode,
  DetailsList,
  IColumn,
  SelectionMode,
  Selection,
  CommandBar,
  ICommandBarItemProps,
  IObjectWithKey,
} from "@fluentui/react";
import { AddUserRolePanel } from "components/Roles/AddUserRolePanel";
import { useBoolean } from "@fluentui/react-hooks";

/* FluentUI Styling */
const useStyles = makeStyles({
  flexContainer: { display: "flex" },
  roleList: {
    flexGrow: 0,
    width: "10em",
    paddingLeft: "1em",
    paddingRight: "1em",
    paddingTop: ".5em",
    paddingBottom: ".5em",
  },
  userList: {
    flexGrow: 1,
  },
});

export const RolesByRole: React.FunctionComponent = () => {
  const classes = useStyles();
  const { data: allRolesByType } = useAllUserRolesByRole();
  const [selectedValue, setSelectedValue] = useState<TabValue>(RoleType.ADMIN);

  // The items for the DetailList -- These are the user who have the role in alphabetical order
  const items =
    allRolesByType
      ?.get(selectedValue as RoleType)
      ?.sort((a, b) =>
        a.User.Title.toLowerCase().localeCompare(b.User.Title.toLowerCase())
      ) || [];

  /** Count of selected items in the DetailsList */
  const [selectedCount, setSelectedCount] = useState(0);
  /** Count of selected items in the DetailsList */
  const [selectedItems, setSelectedItems] = useState<IObjectWithKey[]>([]);

  const selection: Selection = new Selection({
    onSelectionChanged: () => {
      setSelectedCount(selection.getSelectedCount());
      setSelectedItems(selection.getSelection());
    },
  });

  /* Boolean state for determining whether or not the AddUserRolePanel is shown */
  const [isAddPanelOpen, { setTrue: showAddPanel, setFalse: hideAddPanel }] =
    useBoolean(false);

  // We don't want to show SUPERVISOR or EMPLOYEE roles as something to view
  const rolesToShow = Object.values(RoleType)
    .filter(
      (item) => item !== RoleType.SUPERVISOR && item !== RoleType.EMPLOYEE
    )
    .sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    });

  const columns: IColumn[] = [
    {
      key: "user",
      name: "User",
      minWidth: 100,
      isResizable: true,
      onRender: (item) => item.User.Title,
    },
  ];

  let commandItems: ICommandBarItemProps[] = [
    {
      key: "add",
      text: "Add User",
      iconProps: { iconName: "Add" },
      onClick: showAddPanel,
    },
  ];

  // If they have selected an item, then add a Delete button
  if (selectedCount > 0) {
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

  const onTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setSelectedValue(data.value);
  };

  // Get the hook with functions to perform Role Management
  const { removeRole } = useRoleManagement();

  return (
    <>
      <div className={classes.flexContainer}>
        <div className={classes.roleList}>
          <TabList
            selectedValue={selectedValue}
            vertical
            onTabSelect={onTabSelect}
          >
            {rolesToShow.map((role) => (
              <Tab key={role} value={role}>
                {role}
              </Tab>
            ))}
          </TabList>
        </div>
        <div className={classes.userList}>
          <CommandBar items={commandItems}></CommandBar>
          <DetailsList
            items={items}
            columns={columns}
            selectionMode={SelectionMode.multiple}
            constrainMode={ConstrainMode.unconstrained}
            selection={selection}
          ></DetailsList>
          {items.length === 0 && <>No users with this role</>}
        </div>
      </div>
      <AddUserRolePanel
        isAddPanelOpen={isAddPanelOpen}
        onAddCancel={hideAddPanel}
        onAdd={hideAddPanel}
        defaultRole={selectedValue as RoleType}
      />
    </>
  );
};
