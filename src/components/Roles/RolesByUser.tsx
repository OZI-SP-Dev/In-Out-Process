import { useState } from "react";
import { useRoleManagement, useAllUserRolesByUser, SPRole } from "api/RolesApi";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { IPerson } from "api/UserApi";
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
import { ContactIcon } from "@fluentui/react-icons-mdl2";
import { Label, makeStyles, Text } from "@fluentui/react-components";
import { AddUserRolePanel } from "components/Roles/AddUserRolePanel";
import { useBoolean } from "@fluentui/react-hooks";

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
  const [selectedUser, setSelectedUser] = useState<IPerson>();
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

  // The items for the DetailList -- These are the roles the user has in alphabetical order
  const items =
    allRolesByUser
      ?.get(selectedUser?.EMail || "")
      ?.sort((a, b) =>
        a.Title.toLowerCase().localeCompare(b.Title.toLowerCase())
      ) || [];

  const columns: IColumn[] = [
    {
      key: "role",
      name: "Role",
      minWidth: 100,
      isResizable: true,
      onRender: (item) => item.Title,
    },
  ];

  // Get the hook with functions to perform Role Management
  const { removeRole } = useRoleManagement();

  let commandItems: ICommandBarItemProps[] = [
    {
      key: "add",
      text: "Add Role",
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

  return (
    <>
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
          <CommandBar items={commandItems}></CommandBar>
          <DetailsList
            items={items}
            columns={columns}
            selectionMode={SelectionMode.multiple}
            constrainMode={ConstrainMode.unconstrained}
            selection={selection}
          ></DetailsList>
          {items.length === 0 && (
            <Text>No roles assigned to the selected user.</Text>
          )}
        </div>
      </div>
      <AddUserRolePanel
        isAddPanelOpen={isAddPanelOpen}
        onAddCancel={hideAddPanel}
        onAdd={hideAddPanel}
        defaultUser={selectedUser}
      />
    </>
  );
};
