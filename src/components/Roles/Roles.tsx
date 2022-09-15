import { useContext } from "react";
import { useAllUserRoles } from "api/RolesApi";
import { UserContext } from "providers/UserProvider";

export const Roles: React.FunctionComponent = () => {
  const { data: allRoles } = useAllUserRoles();
  const userContext = useContext(UserContext);

  return (
    <>
      Current User Roles
      <ol>
        {userContext.roles?.map((role) => (
          <li key={role}>{role}</li>
        ))}
      </ol>
      All Roles
      <ol>
        {allRoles?.map((role) => {
          const userEntry = role.Roles?.map((roles) => {
            return <li>{roles.Role} </li>;
          });
          return (
            <>
              <li key={role.User.Title}>{role.User.Title}</li>
              <ol>{userEntry}</ol>
            </>
          );
        })}
      </ol>
    </>
  );
};
