import { useState } from "react";
import {
  useRoleManagement,
  useAllUserRolesByUser,
  RoleType,
} from "api/RolesApi";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { IPerson } from "api/UserApi";
import { Dropdown } from "@fluentui/react";
import { Button } from "@fluentui/react-components";

export const AddUserRole: React.FunctionComponent = () => {
  const { data: allRolesByUser } = useAllUserRolesByUser();
  const [items, setItems] = useState<RoleType[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleType>();
  const [selectedUser, setSelectedUser] = useState<IPerson>();

  // Get the hook with functions to perform Role Management
  const { addRole } = useRoleManagement();

  const roles = Object.values(RoleType)
    .filter(
      (item) =>
        // Don't include Employee, Supervisor, or any role the user already has in the options
        item !== RoleType.SUPERVISOR &&
        item !== RoleType.EMPLOYEE &&
        !items.includes(item)
    )
    .sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    })
    .map((role) => {
      return { key: role, text: role };
    });

  // Function to test adding a Role
  const addRoleClick = () => {
    if (selectedUser && selectedRole) {
      addRole.mutate({
        User: selectedUser,
        Role: selectedRole,
      });
    }
  };

  const onUserChange = (user: IPerson[]) => {
    if (user) {
      setSelectedUser(user[0]);
      if (typeof user[0]?.EMail === "string") {
        const newItems = allRolesByUser?.get(user[0].EMail);
        if (newItems === undefined) {
          setItems([]);
        } else {
          setItems(newItems.map((role) => role.Title));
        }
      } else {
        setItems([]);
      }
    } else {
      setSelectedUser(undefined);
      setItems([]);
    }
  };

  const onRoleChange = (ev: any, option: any) => {
    if (option.text) {
      setSelectedRole(option.text);
    }
  };

  return (
    <>
      <PeoplePicker
        ariaLabel={"Select the user to view the roles of"}
        updatePeople={onUserChange}
        selectedItems={selectedUser ? selectedUser : []}
      ></PeoplePicker>
      <Dropdown
        options={roles}
        onChange={onRoleChange}
        selectedKey={selectedRole}
      ></Dropdown>
      <Button onClick={addRoleClick}>Add User to Role</Button>
    </>
  );
};
