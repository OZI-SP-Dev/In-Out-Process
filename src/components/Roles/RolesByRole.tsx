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
} from "@fluentui/react";

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
  const items = allRolesByType?.get(selectedValue as RoleType) || [];
  const [selection] = useState(new Selection());

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

  const commandItems: ICommandBarItemProps[] = [
    {
      key: "delete",
      text: "Delete",
      iconProps: { iconName: "Delete" },
      onClick: () => {
        let selectedEntries = selection.getSelection();
        for (let entry of selectedEntries) {
          let spRoleEntry = entry as SPRole;
          removeRole.mutate(spRoleEntry.Id);
        }
      },
    },
  ];

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
    </>
  );
};
