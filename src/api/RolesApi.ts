import {
  useMutation,
  UseMutationResult,
  useQuery,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import { spWebContext } from "providers/SPWebContext";
import { IPerson } from "api/UserApi";
import { IItemAddResult } from "@pnp/sp/items";
import { useError } from "hooks/useError";
import { useContext } from "react";
import { UserContext } from "providers/UserProvider";

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
}

//* Format for request for adding a Role to a user */
export interface ISubmitRole {
  /** The User to add the Role to */
  User: IPerson;
  /** The Role to add to the User */
  Role: RoleType;
}

//* Format for sending request to SP for adding a Role to a user */
interface ISPSubmitRole {
  Id?: number;
  UserId: number;
  Title: RoleType;
}

/** Type for Map of User Roles grouped with key of Role */
type IRolesByType = Map<RoleType, SPRole[]>;

/** Type for Map of User Roles grouped with key of UserId */
type IRolesByUser = Map<string, SPRole[]>;

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
      const key = role.User.EMail;
      const collection = map.get(key);
      if (!collection) {
        map.set(key, [role]);
      } else {
        collection.push(role);
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
      if (!collection) {
        map.set(key, [role]);
      } else {
        collection.push(role);
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
    .items.select("Id", "User/Id", "User/Title", "User/EMail", "Title")
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
    .select("Id", "User/Id", "User/Title", "User/EMail", "Title")
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
 * Hook that returns 2 mutate functions to be used for Role Management
 *
 */
export const useRoleManagement = (): {
  addRole: UseMutationResult<
    SPRole | IItemAddResult,
    unknown,
    ISubmitRole,
    unknown
  >;
  removeRole: UseMutationResult<void, unknown, number, unknown>;
} => {
  const queryClient = useQueryClient();
  const { data: currentRolesByUser } = useAllUserRolesByUser();
  const errObj = useError();

  /**
   * Submit the new role to SharePoint
   * Internal function used by the react-query useMutation
   *
   */
  const submitRole = async (submitRoleVal: ISubmitRole) => {
    if (currentRolesByUser) {
      const alreadyExists = currentRolesByUser
        ?.get(submitRoleVal.User.EMail)
        ?.find((roles) => roles.Title === submitRoleVal.Role);
      if (alreadyExists) {
        return Promise.reject(
          new Error(
            `User ${submitRoleVal.User.Title} already has the Role ${submitRoleVal.Role}, you cannot submit a duplicate role!`
          )
        );
      } else {
        let spRequest: ISPSubmitRole = {
          // If the Id for the User is -1 then we need to look up the user in SharePoint, otherwise use the Id we alreay have
          UserId:
            submitRoleVal.User.Id === -1
              ? (await spWebContext.web.ensureUser(submitRoleVal.User.EMail))
                  .data.Id
              : submitRoleVal.User.Id,
          Title: submitRoleVal.Role,
        };
        return spWebContext.web.lists.getByTitle("Roles").items.add(spRequest);
      }
    } else {
      return Promise.reject(
        new Error(
          `Unable to add User ${submitRoleVal.User.Title} to the Role ${submitRoleVal.Role} becasue current roles are undefined`
        )
      );
    }
  };

  /**
   * Delete the role from SharePoint
   * Internal function used by the react-query useMutation
   *
   */
  const deleteRole = async (roleId: number) => {
    return spWebContext.web.lists
      .getByTitle("Roles")
      .items.getById(roleId)
      .delete();
  };

  /** React Query Mutation used to add a Role */
  const addRoleMutation = useMutation(["roles"], submitRole, {
    // Always refetch after error or success:
    onSettled: () => {
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

  // Return object of functions that can be called
  return { addRole: addRoleMutation, removeRole: removeRoleMutation };
};
