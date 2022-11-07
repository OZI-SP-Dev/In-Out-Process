import { useEffect, useState } from "react";
import { useRoleManagement, useAllUserRolesByUser, SPRole } from "api/RolesApi";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { IPerson } from "api/UserApi";
import {
  ConstrainMode,
  DetailsList,
  IColumn,
  SelectionMode,
} from "@fluentui/react";
import { CancelIcon, ContactIcon, ListIcon } from "@fluentui/react-icons-mdl2";
import { Label, makeStyles, Text } from "@fluentui/react-components";

/* FluentUI Styling */
const useStyles = makeStyles({
  formContainer: { display: "grid" },
  fieldIcon: {
    marginRight: ".5em",
  },
  fieldContainer: {
    paddingLeft: "1em",
    paddingRight: "1em",
    paddingTop: ".5em",
    paddingBottom: ".5em",
    display: "grid",
    position: "relative",
  },
  fieldLabel: {
    paddingBottom: ".5em",
    display: "flex",
  },
});

export const RolesByUser: React.FunctionComponent = () => {
  const classes = useStyles();
  const { data: allRolesByUser } = useAllUserRolesByUser();
  const [items, setItems] = useState<SPRole[]>([]);
  const [selectedUser, setSelectedUser] = useState<IPerson>();

  useEffect(() => {
    if (typeof selectedUser?.EMail === "string") {
      const newItems = allRolesByUser?.get(selectedUser.EMail);
      if (newItems === undefined) {
        setItems([]);
      } else {
        setItems(newItems);
      }
    } else {
      setItems([]);
    }
  }, [allRolesByUser, selectedUser?.EMail]);

  const columns: IColumn[] = [
    {
      key: "name",
      name: "Role",
      minWidth: 100,
      isResizable: true,
      onRender: (item) => item.Title,
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

  // Get the hook with functions to perform Role Management
  const { removeRole } = useRoleManagement();

  // Function to test removing a Role
  const removeRoleClick = (role: number) => {
    removeRole.mutate(role);
  };

  return (
    <div className={classes.formContainer}>
      <div className={classes.fieldContainer}>
        <Label size="small" weight="semibold" className={classes.fieldLabel}>
          <ContactIcon className={classes.fieldIcon} />
          User
        </Label>
        <PeoplePicker
          ariaLabel={"Select the user to view the roles of"}
          updatePeople={(selectedUser) => {
            if (selectedUser) {
              setSelectedUser(selectedUser[0]);
            }
          }}
          selectedItems={selectedUser ? selectedUser : []}
        ></PeoplePicker>
      </div>
      <div className={classes.fieldContainer}>
        <Label size="small" weight="semibold" className={classes.fieldLabel}>
          <ListIcon className={classes.fieldIcon} />
          Roles
        </Label>
        <DetailsList
          items={items}
          columns={columns}
          selectionMode={SelectionMode.none}
          constrainMode={ConstrainMode.unconstrained}
          isHeaderVisible={false}
        ></DetailsList>
        {items.length === 0 && (
          <Text>No roles assigned to the selected user.</Text>
        )}
      </div>
    </div>
  );
};
