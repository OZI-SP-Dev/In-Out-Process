import { createContext, FunctionComponent, useEffect, useState } from "react";
import { RoleType } from "../api/RolesApi";
import { IPerson, UserApiConfig } from "../api/UserApi";

export interface IUserContext {
  user: IPerson | undefined;
  roles: RoleType[];
  loadingUser: boolean;
}

export const UserContext = createContext<Partial<IUserContext>>({
  user: undefined,
  loadingUser: true,
});

export const UserProvider: FunctionComponent = ({ children }) => {
  const [user, setUser] = useState<IUserContext>({
    user: undefined,
    roles: [],
    loadingUser: true,
  });

  const userApi = UserApiConfig.getApi();

  // Fix to address setStates inside of an asyncronous call.
  // Reduce to 1 setState to ensure loading isn't set as true before the user/roles are populated
  const fetchUser = async () => {
    let user = undefined;
    let userRoles: RoleType[] = [];
    const userVal = await userApi.getCurrentUser();
    if (userVal) {
      user = { ...userVal };
      let userRolesVal = await userApi.getCurrentUsersRoles();
      if (userRolesVal) {
        userRoles = { ...userRolesVal };
      }
    }
    setUser({ user: user, roles: userRoles, loadingUser: false });
  };

  useEffect(() => {
    fetchUser(); // eslint-disable-next-line
  }, []);

  const userContext: IUserContext = {
    user: user.user,
    roles: user.roles,
    loadingUser: user.loadingUser,
  };

  return (
    <UserContext.Provider value={userContext}>{children}</UserContext.Provider>
  );
};

export const { Consumer } = UserContext;
