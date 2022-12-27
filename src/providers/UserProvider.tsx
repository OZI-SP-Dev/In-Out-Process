import { createContext, FunctionComponent } from "react";
import { RoleType, useUserRoles } from "api/RolesApi";
import { Person, useCurrentUser } from "api/UserApi";

export interface IUserContext {
  user: Person;
  roles?: RoleType[];
}

export const UserContext = createContext({
  // This value would ONLY be used if a component tried referencing it, and there was no Provider for that context above it.
  // By defining a user here, we help Typescript with it's typechecking
  user: new Person({ Id: 0, Title: "Placeholder", EMail: "Placeholder" }),
  roles: undefined,
} as IUserContext);

export const UserProvider: FunctionComponent = ({ children }) => {
  const user = useCurrentUser();
  const { data: roles } = useUserRoles(user.Id);

  const userContext: IUserContext = {
    user,
    roles: roles ? roles : undefined,
  };

  return (
    <UserContext.Provider value={userContext}>{children}</UserContext.Provider>
  );
};

export const { Consumer } = UserContext;
