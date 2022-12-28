import { createContext, FunctionComponent, useState } from "react";
import { RoleType, useUserRoles } from "api/RolesApi";
import { Person, useCurrentUser } from "api/UserApi";

interface IUserContext {
  /** Current or Impersonated User object */ user: Person;
  /** Current or Impersonated Roles object */ roles?: RoleType[];
  /** Function to update to impersonate, or resume as logged in */
  impersonate: (user?: Person) => void;
}
/** The UserContext object
 * Provides the logged in user and roles objects, or if impersonating, the info for the user/roles being impersonated
 * Also provides an impersonate function to update
 */
export const UserContext = createContext({
  // This value would ONLY be used if a component tried referencing it, and there was no Provider for that context above it.
  // We use thie Context.Provider at a high level object in the tree, so it should never be referenced as undefined
  user: new Person({ Id: 0, Title: "Placeholder", EMail: "Placeholder" }),
  roles: undefined,
  impersonate: (user) => {},
} as IUserContext);

export const UserProvider: FunctionComponent = ({ children }) => {
  // Get the current logged in user
  const loggedInUser = useCurrentUser();
  const [user, setUser] = useState(loggedInUser);
  /* We have to pass in a user id for two reasons:
      1)  This will take care of when we are impersonating, so that it will pull the roles for that user
      2)  Because this compenent IS the component that will be the Provider for the UserContext context, if we called
            useUserRoles() without a userId, it would try to get the context, and would load the default context, which
            is just a placeholder 
   */
  const { data: roles } = useUserRoles(user.Id);

  /**
   * Turn on/off or change the impersonated user
   *
   * @param user - Optional - If passed will impersonate that user, if not passed, will revert to being logged in user
   */
  const impersonate = (user?: Person) => {
    if (user) {
      setUser(user);
    } else {
      setUser(loggedInUser);
    }
  };

  /** The object to be passed to the Provider for all Consumers to use */
  const userContext: IUserContext = {
    user,
    roles: roles ? roles : undefined,
    impersonate: impersonate,
  };

  return (
    <UserContext.Provider value={userContext}>{children}</UserContext.Provider>
  );
};
