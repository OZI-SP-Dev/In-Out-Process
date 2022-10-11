import { createContext, FunctionComponent } from "react";
import { RoleType, useUserRoles } from "api/RolesApi";
import { IPerson, useCurrentUser } from "api/UserApi";

export interface IUserContext {
  user: IPerson | undefined;
  roles: RoleType[];
}

export const UserContext = createContext<Partial<IUserContext>>({
  user: undefined,
});

export const UserProvider: FunctionComponent = ({ children }) => {
  const user = useCurrentUser();
  const { data: roles } = useUserRoles(user.Id);

  const userContext: IUserContext = {
    user,
    roles: roles ? roles : ([] as RoleType[]),
  };

  return (
    <UserContext.Provider value={userContext}>{children}</UserContext.Provider>
  );
};

export const { Consumer } = UserContext;
