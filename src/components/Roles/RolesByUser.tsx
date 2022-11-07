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
import { CancelIcon } from "@fluentui/react-icons-mdl2";

export const RolesByUser: React.FunctionComponent = () => {
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
    <>
      <PeoplePicker
        ariaLabel={"Select the user to view the roles of"}
        updatePeople={(selectedUser) => {
          if (selectedUser) {
            setSelectedUser(selectedUser[0]);
          }
        }}
        selectedItems={selectedUser ? selectedUser : []}
      ></PeoplePicker>
      <DetailsList
        items={items}
        columns={columns}
        selectionMode={SelectionMode.none}
        constrainMode={ConstrainMode.unconstrained}
      ></DetailsList>
    </>
  );
};
