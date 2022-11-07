import { useEffect, useState } from "react";
import {
  useRoleManagement,
  RoleType,
  SPRole,
  useAllUserRolesByRole,
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
} from "@fluentui/react";
import { CancelIcon } from "@fluentui/react-icons-mdl2";

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
  const initialItems = allRolesByType?.get(RoleType.ADMIN);
  const [items, setItems] = useState<SPRole[]>(
    initialItems ? initialItems : []
  );

  useEffect(() => {
    const newItems = allRolesByType?.get(selectedValue as RoleType);
    if (newItems === undefined) {
      setItems([]);
    } else {
      setItems(newItems);
    }
  }, [allRolesByType, selectedValue]);

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
    {
      key: "action",
      name: "",
      minWidth: 20,
      maxWidth: 20,
      isResizable: false,
      onRender: (item) => (
        <CancelIcon onClick={() => removeRoleClick(item.Id)} />
      ),
    },
  ];

  const onTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setSelectedValue(data.value);
  };

  // Get the hook with functions to perform Role Management
  const { removeRole } = useRoleManagement();

  // Function to test removing a Role
  const removeRoleClick = (role: number) => {
    removeRole.mutate(role);
  };

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
          <DetailsList
            items={items}
            columns={columns}
            selectionMode={SelectionMode.none}
            constrainMode={ConstrainMode.unconstrained}
          ></DetailsList>
          {items.length === 0 && <>No users with this role</>}
        </div>
      </div>
    </>
  );
};
