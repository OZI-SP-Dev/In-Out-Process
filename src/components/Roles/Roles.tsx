import { useContext } from "react";
import { useRoleManagement, RoleType } from "api/RolesApi";
import { UserContext } from "providers/UserProvider";
import { Button } from "@fluentui/react-components";
import { RolesByRole } from "components/Roles/RolesByRole";
import { RolesByUser } from "components/Roles/RolesByUser";
import { Navigate } from "react-router-dom";
import { AddUserRole } from "./AddUserRole";

export const Roles: React.FunctionComponent = () => {
  const userContext = useContext(UserContext);

  // Get the hook with functions to perform Role Management
  const { addRole } = useRoleManagement();

  // Ensure we have a roles object before determining whether or not to redirect
  if (userContext.roles) {
    if (!userContext.roles.includes(RoleType.ADMIN)) {
      // If they are not an ADMIN, redirect to the Homepage
      return <Navigate to="/" replace={true} />;
    }
  }

  // Function to test adding a Role
  const addRoleClick = (role: RoleType) => {
    let user = userContext.user;
    addRole.mutate({
      User: user ? user : { Id: 1, EMail: "ADMIN", Title: "ADMIN" },
      Role: role,
    });
  };

  return (
    <>
      {/* TODO -- Replace this page with a component for Adding users -- Also with components for viewing by RoleTpye -- And Viewing by User 
              This interface is just a placeholder for testing that RolesAPI update */}
      Add Role to a User
      <AddUserRole />
      Roles By User
      <RolesByUser />
      All Roles by Role
      <RolesByRole />
      <Button onClick={() => addRoleClick(RoleType.ATAAPS)}>Add ATAAPS</Button>
      <Button onClick={() => addRoleClick(RoleType.ADMIN)}>Add ADMIN</Button>
      <Button onClick={() => addRoleClick(RoleType.FOG)}>Add FOG</Button>
    </>
  );
};
