import {
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { spWebContext, webUrl } from "providers/SPWebContext";
import { IPerson } from "api/UserApi";
import { useError } from "hooks/useError";
import { useContext } from "react";
import { UserContext } from "providers/UserProvider";

// Uses import @pnp/sp/site-groups/web within SPWebContext.ts

/** Enum used to define the different roles in the tool */
export enum RoleType {
  /** Role for granting Administrator capabilities  */
  ADMIN = "Admin",
  /** Role for granting Information Technology (IT) capabilities */
  IT = "IT",
  /** Role for granting Automated Time Attendance and Production System (ATAAPS) capabilities */
  ATAAPS = "ATAAPS",
  /** Role for granting Front Office Group (FOG) capabilities */
  FOG = "FOG",
  /** Role for granting Defense Travel System (DTS) capabilities  */
  DTS = "DTS",
  /** Role for granting Government Travel Card (GTC) capabilities */
  GTC = "GTC",
  /** Role for granting Security capabilities */
  SECURITY = "Security",
  /** Role for if current user is Employee on the current request */
  EMPLOYEE = "Employee",
  /** Role for if current user is Supervisor on the current request */
  SUPERVISOR = "Supervisor",
}

/** The structure of records in the Roles list in SharePoint */
export interface SPRole {
  /** The Id of the entry in the Roles list  */
  Id: number;
  /** The User entry in the Roles list  */
  User: IPerson;
  /** The string representing the Role in the Roles list  */
  Title: RoleType;
  /** Optional - The Alternate Email Address to send the notification to */
  Email?: string;
}

//* Format for request for adding a Role to a user */
export interface ISubmitRole {
  /** The Id of the Role record to update -- if none then it is new record */
  Id?: number;
  /** The User to add the Role to */
  User: IPerson;
  /** The Role to add to the User */
  Title: RoleType;
  /** Optional - The Alternate Email Address to send the notification to */
  Email?: string;
}

//* Format for sending request to SP for adding a Role to a user */
interface ISPSubmitRole {
  /** The Id of the Role record to update -- if none then it is new record */
  Id?: number;
  /** The UserId of the person to add the Role to */
  UserId: number;
  /** The Role to add to the User */
  Title: RoleType;
  /** Optional - The Alternate Email Address to send the notification to */
  Email?: string;
}

/** Type for Map of User Roles grouped with key of Role */
type IRolesByType = Map<RoleType, SPRole[]>;

/** Type for Map of User Roles grouped with key of UserId */
type IRolesByUser = Map<string, SPRole[]>;

/** Function to overrite Email of User on Role record if an Email was provided on the record
 *  @param role - The SPRole record
 *  @returns An SPRole where User is updated with Role record email if provided
 */
const overrideEmail = (role: SPRole): SPRole => {
  const tempUser = {
    ...role.User,
    EMail: role.Email ?? role.User.EMail,
  };
  return { ...role, User: tempUser };
};
/**
 * Take the SP Role list row data, and group it by user specifying all roles
 * belonging to the user.  One or more user's data can be passed in
 *
 * @param roles The data containing user and role
 * @returns An Map with UserId as grouping the SPRole[] by user(s)
 */
const getIUserRoles = (roles: SPRole[]) => {
  const map: IRolesByUser = new Map<string, SPRole[]>();
  for (let role of roles) {
    // Ensure the role on the Record actually exists in RoleType -- otherwise ignore this record
    if (Object.values(RoleType).includes(role.Title)) {
      // Store the record based on the User's actual GAL email
      const key = role.User.EMail;
      const collection = map.get(key);
      const tempRole = overrideEmail(role);
      if (!collection) {
        map.set(key, [tempRole]);
      } else {
        collection.push(tempRole);
      }
    }
  }
  return map;
};

/**
 * Take the SP Role list row data, and group it by RoleType specifying all the users
 * belonging to that role.
 *
 * @param roles The data containing user and role
 * @returns A Map grouping the SPRole[] data by RoleType
 */
const getIUserRolesGroup = (roles: SPRole[]): IRolesByType => {
  const map: IRolesByType = new Map<RoleType, SPRole[]>();
  for (let role of roles) {
    // Ensure the role on the Record actually exists in RoleType -- otherwise ignore this record
    if (Object.values(RoleType).includes(role.Title)) {
      const key = role.Title;
      const collection = map.get(key);
      const tempRole = overrideEmail(role);
      if (!collection) {
        map.set(key, [tempRole]);
      } else {
        collection.push(tempRole);
      }
    }
  }
  return map;
};

/**
 * Take the SP Role list row data, and turn it into a single RoleType[]
 *
 * @param roles The SPRole[] data from the Role list
 * @returns A single RoleType[] object for a single user
 */
const getIUserRoleType = (roles: SPRole[]) => {
  let userRoles: IRolesByUser = getIUserRoles(roles);
  if (userRoles.size === 1) {
    // Return the first (and only) item in the array
    return Array.from(userRoles.values())[0].map((role: SPRole) => role.Title);
  } else {
    // If we didn't error from the API, but returned 0 or more than 1 users worth of data
    //  then default the user to having no roles
    return [] as RoleType[];
  }
};

/**
 * Get all roles for all users.
 * Internal function called by react-query useQuery to get the data
 *
 * @returns An Promise for SPRole[] - containing the Role records
 */
const getAllRoles = async (): Promise<SPRole[]> => {
  return spWebContext.web.lists
    .getByTitle("Roles")
    .items.select("Id", "User/Id", "User/Title", "User/EMail", "Title", "Email")
    .expand("User")();
};

/**
 * Get the Roles of a given user.
 * Internal function called by react-query useQuery to get the data
 *
 * @param userId The Id of the user whose roles are being requested
 * @returns The Promise of the Roles records for a given User in the form of SPRole[],
 *          may be undefined if the User does not have any roles.
 */
const getRolesForUser = async (userId?: number): Promise<SPRole[]> => {
  return spWebContext.web.lists
    .getByTitle("Roles")
    .items.filter(`User/Id eq '${userId}'`)
    .select("Id", "User/Id", "User/Title", "User/EMail", "Title", "Email")
    .expand("User")();
};

/**
 * Get the Roles of a specific user.
 *
 * @param userId The Id number of the user for whom's roles are being requested
 * @returns The Roles for a given User in the form of the react-query results.  The data element is of type RoleType[]
 *
 */
export const useUserRoles = (userId?: number) => {
  const errObj = useError();
  const currentUser = useContext(UserContext).user;

  if (!userId) {
    userId = currentUser.Id;
  }

  return useQuery({
    queryKey: ["roles", userId],
    queryFn: () => getRolesForUser(userId),
    // We don't need to requery SharePoint for these
    // Unless it is changing in our app -- and then we can
    // have them invalidated, so it will re-query
    staleTime: Infinity,
    cacheTime: Infinity,
    // Return just the RoleType[]
    select: getIUserRoleType,
    onError: (err) => {
      if (err instanceof Error) {
        errObj.addError(
          `Error occurred while trying to fetch Roles for User with ID ${userId}: ${err.message}`
        );
      } else if (typeof err === "string") {
        errObj.addError(
          `Error occurred while trying to fetch Roles for User with ID ${userId}: ${err}`
        );
      } else {
        errObj.addError(
          `Unknown error occurred while trying to fetch Roles for User with ID ${userId}`
        );
      }
    },
  });
};

/**
 * Get the Roles of all users.
 * @param select The function to run the data through after it has been returned from the datasource
 * @returns The Roles for a all in the form of the react-query results.  The data element type is based on the selector
 */
const useAllUserRoles = (select: {
  (roles: SPRole[]): IRolesByType | IRolesByUser | SPRole[];
}) => {
  const errObj = useError();

  return useQuery({
    queryKey: ["roles"],
    queryFn: () => getAllRoles(),
    // We don't need to requery SharePoint for these
    // Unless it is changing in our app -- and then we can
    // have them invalidated, so it will re-query
    staleTime: Infinity,
    cacheTime: Infinity,
    select: select,
    onError: (err) => {
      if (err instanceof Error) {
        errObj.addError(
          `Error occurred while trying to fetch all Roles: ${err.message}`
        );
      } else if (typeof err === "string") {
        errObj.addError(
          `Error occurred while trying to fetch all Roles: ${err}`
        );
      } else {
        errObj.addError(
          `Unknown error occurred while trying to fetch all Roles`
        );
      }
    },
  });
};

/** Hook returning all the roles grouped by User */
export const useAllUserRolesByUser = () =>
  useAllUserRoles(getIUserRoles) as UseQueryResult<IRolesByUser, unknown>;

/** Hook returning all the roles grouped by Role */
export const useAllUserRolesByRole = () =>
  useAllUserRoles(getIUserRolesGroup) as UseQueryResult<IRolesByType, unknown>;

/**
 * Hook that returns 3 mutate functions to be used for Role Management
 *
 */
export const useRoleManagement = () => {
  const queryClient = useQueryClient();
  const { data: currentRolesByUser } = useAllUserRolesByUser();
  const errObj = useError();

  /**
   * Submit the new role to SharePoint
   * Internal function used by the react-query useMutation
   *
   */
  const addRole = async (submitRoleVal: ISubmitRole) => {
    return addOrUpdateRole({ new: { ...submitRoleVal } });
  };

  /**
   * Submit the updated role to SharePoint
   * Internal function used by the react-query useMutation
   *
   */
  const updateRole = async (submitRoleVal: {
    old: SPRole;
    new: ISubmitRole;
  }) => {
    return addOrUpdateRole(submitRoleVal);
  };

  /**
   * Submit the add or update role request to SharePoint
   * Internal function used by the react-query useMutation
   *
   */
  const addOrUpdateRole = async (updateRoleVal: {
    old?: SPRole;
    new: ISubmitRole;
  }) => {
    if (currentRolesByUser) {
      const alreadyExists = currentRolesByUser
        ?.get(updateRoleVal.new.User.EMail)
        ?.find((roles) => roles.Title === updateRoleVal.new.Title);

      // The user can have the role already if it is the record we are updating
      if (alreadyExists && alreadyExists.Id !== updateRoleVal.new.Id) {
        return Promise.reject(
          new Error(
            `User ${updateRoleVal.new.User.Title} already has the Role ${updateRoleVal.new.Title}, you cannot submit a duplicate role!`
          )
        );
      } else {
        let spRequest: ISPSubmitRole = {
          // If the Id for the User is -1 then we need to look up the user in SharePoint, otherwise use the Id we alreay have
          UserId:
            updateRoleVal.new.User.Id === -1
              ? (
                  await spWebContext.web.ensureUser(
                    updateRoleVal.new.User.EMail
                  )
                ).data.Id
              : updateRoleVal.new.User.Id,
          Title: updateRoleVal.new.Title,
          Email: updateRoleVal.new.Email,
        };

        let spRes;
        if (!updateRoleVal.old) {
          // New role
          // TODO -- If new item, and they click retry b/c group fails -- don't want to recreate
          spRes = await spWebContext.web.lists
            .getByTitle("Roles")
            .items.add(spRequest)
            .catch((reason) => {
              return Promise.reject(
                new Error("Error creating role entry: " + reason)
              );
            });
          await addUserToGroup(updateRoleVal.new);
        } else {
          // Existing role being updated
          spRes = await spWebContext.web.lists
            .getByTitle("Roles")
            .items.getById(updateRoleVal.old.Id)
            .update(spRequest)
            .catch((reason) => {
              return Promise.reject(
                new Error("Error updating role entry: " + reason)
              );
            });

          if (updateRoleVal.new.User.EMail !== updateRoleVal.old.User.EMail) {
            const addRes = addUserToGroup(updateRoleVal.new);
            const delRes = removeUserFromGroup(updateRoleVal.old);

            // Wait for both the add and remove requests to complete
            const results = await Promise.allSettled([addRes, delRes]);

            // If either/both of them failed, then create a Reject Promise with the respective errors
            const rejected = results.filter((a) => a.status === "rejected");
            if (rejected) {
              return Promise.reject(
                new Error(rejected.map((item: any) => item.reason).join("\n"))
              );
            }
          }

          return Promise.resolve(spRes);
        }
      }
    } else {
      return Promise.reject(
        new Error(
          `Unable to add/update User ${updateRoleVal.new.User.Title} to the Role ${updateRoleVal.new.Title} becasue current roles are undefined`
        )
      );
    }
  };

  /**
   * Delete the role from SharePoint
   * Internal function used by the react-query useMutation
   *
   */
  const deleteRole = async (roleEntry: SPRole) => {
    let spDelRes = await spWebContext.web.lists
      .getByTitle("Roles")
      .items.getById(roleEntry.Id)
      .delete()
      .catch((err) => {
        return Promise.reject(new Error("Error removing role entry: " + err));
      });

    await removeUserFromGroup(roleEntry);

    return Promise.resolve(spDelRes);
  };

  /** React Query Mutation used to add a Role */
  const addRoleMutation = useMutation(["roles"], addRole, {
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(["roles"]);
    },
  });

  /** React Query Mutation used to update a Role record
   *    Calls the same thing as adding a user, but allows us to track separately
   */
  const updateRoleMutation = useMutation(["roles"], updateRole, {
    // Only refresh on success, so that on error of group updates, modal won't refresh
    onSuccess: () => {
      queryClient.invalidateQueries(["roles"]);
    },
  });

  /** React Query Mutation used to remove a Role */
  const removeRoleMutation = useMutation(["roles"], deleteRole, {
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(["roles"]);
    },
    onError: (error, variable) => {
      if (error instanceof Error) {
        errObj.addError(
          `Error occurred while trying to remove role with Id ${variable}: ${error.message}`
        );
      } else if (typeof error === "string") {
        errObj.addError(
          `Error occurred while trying to remove role with Id ${variable}: ${error}`
        );
      } else {
        errObj.addError(
          `Unknown error occurred while trying to remove the role with Id ${variable}`
        );
      }
    },
  });

  /**
   * Add the user to the SharePoint group
   */
  const addUserToGroup = async (submitRoleVal: ISubmitRole) => {
    const loginName = getLoginNameFromEmail(submitRoleVal.User.EMail);
    const groupName = getSiteGroupName(submitRoleVal.Title);
    return spWebContext.web.siteGroups
      .getByName(groupName)
      .users.add(loginName)
      .catch((reason) => {
        return Promise.reject(new Error("Error adding permissions: " + reason));
      });
  };

  /**
   * Delete the user from the SharePoint Group
   */
  const removeUserFromGroup = async (submitRoleVal: SPRole) => {
    const loginName = getLoginNameFromEmail(submitRoleVal.User.EMail);
    const groupName = getSiteGroupName(submitRoleVal.Title);
    return spWebContext.web.siteGroups
      .getByName(groupName)
      .users.removeByLoginName(loginName)
      .catch((reason) => {
        return Promise.reject(
          new Error("Error removing permissions: " + reason)
        );
      });
  };

  /**
   * Get the LoginName for an email
   * Do this by appending the SharePoint Prefix for a user
   */
  const getLoginNameFromEmail = (email: string) => {
    return "i:0#.f|membership|" + email;
  };

  /**
   * Get the site URL
   * Do this by appending the SharePoint Prefix for a user
   */
  const getSiteGroupName = (groupName: string) => {
    const siteMatches = webUrl.match(/(?<=\/)INOUT.*/);
    let groupNameRes;
    if (siteMatches) {
      groupNameRes = siteMatches[0] + " " + groupName;
    } else {
      groupNameRes = groupName;
    }
    return groupNameRes;
  };

  // Return object of functions that can be called
  return {
    /** Mutation to add a user to a role */
    addRole: addRoleMutation,
    /** Mutation to update a role record */
    updateRole: updateRoleMutation,
    /** Mutation to delete a role record */
    removeRole: removeRoleMutation,
  };
};
