import { useContext } from "react";
import {
  useRoleManagement,
  RoleType,
  useAllUserRolesByUser,
  useAllUserRolesByRole,
} from "api/RolesApi";
import { UserContext } from "providers/UserProvider";
import { Button } from "@fluentui/react-components";

export const Roles: React.FunctionComponent = () => {
  const { data: allRolesByUser } = useAllUserRolesByUser();
  const { data: allRolesByType } = useAllUserRolesByRole();
  const userContext = useContext(UserContext);

  // We have to turn the Map objects into Arrays to be able to read them in the JSX
  const typeKeys = allRolesByType
    ? Array.from(allRolesByType.keys())
    : undefined;
  const userKeys = allRolesByUser
    ? Array.from(allRolesByUser.keys())
    : undefined;

  // Get the hook with functions to perform Role Management
  const { addRole, removeRole } = useRoleManagement();

  // Function to test adding a Role
  const addRoleClick = (role: RoleType) => {
    let user = userContext.user;
    addRole.mutate({
      User: user ? user : { Id: 1, EMail: "ADMIN", Title: "ADMIN" },
      Role: role,
    });
  };

  // Function to test removing a Role
  const removeRoleClick = (role: number) => {
    removeRole.mutate(role);
  };

  return (
    <>
      {/* TODO -- Replace this page with a component for Adding users -- Also with components for viewing by RoleTpye -- And Viewing by User 
              This interface is just a placeholder for testing that RolesAPI update */}
      Current User Roles
      <ol>
        {userContext.roles?.map((role) => (
          <li key={role}>{role}</li>
        ))}
      </ol>
      All Roles
      <ol>
        {userKeys?.map((key) => (
          <li key={key}>
            {allRolesByUser?.get(key)?.map((role) => role.User.Title)[0]}
            <ol>
              {allRolesByUser?.get(key)?.map((obj) => (
                <li key={obj.Title}>
                  {obj.Title}{" "}
                  <Button onClick={() => removeRoleClick(obj.Id)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
      All Roles by Role
      <ol>
        {typeKeys?.map((key) => (
          <li key={key}>
            {key}
            <ol>
              {allRolesByType?.get(key)?.map((obj) => (
                <li key={obj.User.Title}>
                  {obj.User.Title}{" "}
                  <Button onClick={() => removeRoleClick(obj.Id)}>
                    Remove
                  </Button>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
      <Button onClick={() => addRoleClick(RoleType.ATAAPS)}>Add ATAAPS</Button>
      <Button onClick={() => addRoleClick(RoleType.ADMIN)}>Add ADMIN</Button>
      <Button onClick={() => addRoleClick(RoleType.FOG)}>Add FOG</Button>
    </>
  );
};
