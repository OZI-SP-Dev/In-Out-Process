import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { spWebContext } from "providers/SPWebContext";
import { ApiError } from "api/InternalErrors";
import { IPerson } from "api/UserApi";

/** Enum used to define the different roles in the tool */
export enum RoleType {
  /** Role for granting Administrator capabilities  */
  ADMIN = "Admin",
  /** Role for granting Information Technology (IT) capabilities */
  IT = "IT",
  /** Role for granting Automated Time Attendance and Production System (ATAAPS) capabilities */
  ATAAPs = "ATAAPS",
  /** Role for granting Front Office Group (FOG) capabilities */
  FOG = "FOG",
  /** Role for granting Defense Travel System (DTS) capabilities  */
  DTS = "DTS",
  /** Role for granting Government Travel Card (GTC) capabilities */
  GTC = "GTC",
}

export interface IUserRoles {
  /** The User having the defined roles */
  User: IPerson;
  /** The Roles assigned to the User */
  Roles: IRole[];
}

export interface IRole {
  /** The Id of the entry in the Roles list */
  Id: number;
  /** The string representing the Role */
  Role: RoleType;
}

/** The structure of records in the Roles list in SharePoint */
interface SPRole {
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

interface ISPSubmitRole {
  Id?: number;
  UserId: number;
  Title: RoleType;
}

/** Test data for use in DEV environment -- mimics structure of Roles list in SharePoint */
let testRoles: SPRole[] = [
  {
    Id: 1,
    User: {
      Id: 1,
      Title: "FORREST, GREGORY M CTR USAF AFMC AFLCMC/OZIC",
      EMail: "me@example.com",
    },
    Title: RoleType.ADMIN,
  },
  {
    Id: 2,
    User: {
      Id: 2,
      Title: "PORTERFIELD, ROBERT D GS-13 USAF AFMC AFLCMC/OZIC",
      EMail: "me@example.com",
    },
    Title: RoleType.IT,
  },
  {
    Id: 3,
    User: {
      Id: 1,
      Title: "FORREST, GREGORY M CTR USAF AFMC AFLCMC/OZIC",
      EMail: "me@example.com",
    },
    Title: RoleType.IT,
  },
];

/** The maxId of records in testRoles -- used for appending new roles in DEV env to mimic SharePoint */
let maxId: number = testRoles.length;

/** Function used by calls in the DEV env to mimic a delay in processing
 *
 * @param milliseconds - Optional value to sleep -- Defaults to 500 if not specified
 * @returns A Promise after the delayed amount of time
 */
const sleep = (milliseconds?: number) => {
  // Default to 500 milliseconds if no value is passed in
  const sleepTime = milliseconds ? milliseconds : 500;
  return new Promise((r) => setTimeout(r, sleepTime));
};

/**
 * Take the SP Role list row data, and group it by user specifying all roles
 * belonging to the user.  One or more user's data can be passed in
 *
 * @param roles The data containing user and role
 * @returns An IUserRoles[] object grouping the roles by user(s)
 */
const getIUserRoles = (roles: SPRole[]): IUserRoles[] => {
  let userRoles: IUserRoles[] = [];
  for (let role of roles) {
    if (Object.values(RoleType).includes(role.Title)) {
      let i = userRoles.findIndex(
        (userRole) => userRole.User.Id === role.User.Id
      );
      if (i > -1) {
        userRoles[i].Roles.push({ Id: role.Id, Role: role.Title });
      } else {
        userRoles.push({
          User: role.User,
          Roles: [{ Id: role.Id, Role: role.Title }],
        });
      }
    }
  }
  return userRoles;
};

/**
 * Get all roles for all users.
 * Internal function called by react-query useQuery to get the data
 *
 * @returns An IUserRoles[] object containing all defined users and their roles
 */
const getAllRoles = async (): Promise<IUserRoles[]> => {
  if (process.env.NODE_ENV === "development") {
    await sleep();
    const roles = getIUserRoles(testRoles);
    if (roles) {
      return Promise.resolve(roles);
    } else {
      return Promise.reject(
        new Error("Error occurred while trying to fetch all Roles")
      );
    }
  } else {
    try {
      return getIUserRoles(
        await spWebContext.web.lists
          .getByTitle("Roles")
          .items.select("Id", "User/Id", "User/Title", "User/EMail", "Title")
          .expand("User")()
      );
    } catch (e) {
      console.error("Error occurred while trying to fetch all Roles");
      console.error(e);
      if (e instanceof Error) {
        throw new ApiError(
          e,
          `Error occurred while trying to fetch all Roles: ${e.message}`
        );
      } else if (typeof e === "string") {
        throw new ApiError(
          new Error(`Error occurred while trying to fetch all Roles: ${e}`)
        );
      } else {
        throw new ApiError(
          undefined,
          "Unknown error occurred while trying to fetch all Roles"
        );
      }
    }
  }
};

/**
 * Get the Roles of a given user.
 * Internal function called by react-query useQuery to get the data
 *
 * @param userId The Id of the user whose roles are being requested
 * @returns The Roles for a given User in the form of IUserRoles,
 *          may be undefined if the User does not have any roles.
 */
const getRolesForUser = async (userId: number): Promise<IUserRoles> => {
  if (process.env.NODE_ENV === "development") {
    await sleep();
    const response = getIUserRoles(
      testRoles.filter((entry) => entry.User.Id === userId)
    );
    if (response.length === 1) {
      return Promise.resolve(response[0]);
    } else {
      // If we returned 0 or more than 1 users worth of data
      //  then default the user to having no roles
      return Promise.resolve({} as IUserRoles);
    }
  } else {
    try {
      const response = getIUserRoles(
        await spWebContext.web.lists
          .getByTitle("Roles")
          .items.filter(`User/Id eq '${userId}'`)
          .select("Id", "User/Id", "User/Title", "User/EMail", "Title")
          .expand("User")()
      );
      if (response.length === 1) {
        return response[0];
      } else {
        // If we didn't error from the API, but returned 0 or more than 1 users worth of data
        //  then default the user to having no roles
        return Promise.resolve({} as IUserRoles);
      }
    } catch (e) {
      console.error(
        `Error occurred while trying to fetch Roles for User with ID ${userId}`
      );
      console.error(e);
      if (e instanceof Error) {
        throw new ApiError(
          e,
          `Error occurred while trying to fetch Roles for User with ID ${userId}: ${e.message}`
        );
      } else if (typeof e === "string") {
        throw new ApiError(
          new Error(
            `Error occurred while trying to fetch Roles for User with ID ${userId}: ${e}`
          )
        );
      } else {
        throw new ApiError(
          undefined,
          `Unknown error occurred while trying to fetch Roles for User with ID ${userId}`
        );
      }
    }
  }
};

/**
 * Get the Roles of a specific user.
 *
 * @param userId The Id number of the user for whom's roles are being requested
 * @returns The Roles for a given User in the form of the react-query results.  The data element is of type RoleType[]
 *
 */
export const useUserRoles = (userId: number) => {
  return useQuery({
    queryKey: ["roles", userId],
    queryFn: () => getRolesForUser(userId),
    // We don't need to requery SharePoint for these
    // Unless it is changing in our app -- and then we can
    // have them invalidated, so it will re-query
    staleTime: Infinity,
    cacheTime: Infinity,
    // Return just the RoleType[]
    select: (data) => data.Roles.map((role) => role.Role),
  });
};

/**
 * Get the Roles of all users.
 *
 * @returns The Roles for a all in the form of the react-query results.  The data element is in the form of IUserRoles[]
 */
export const useAllUserRoles = () => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => getAllRoles(),
    // We don't need to requery SharePoint for these
    // Unless it is changing in our app -- and then we can
    // have them invalidated, so it will re-query
    staleTime: Infinity,
    cacheTime: Infinity,
  });
};

/**
 * Submit the new role to SharePoint
 * Internal function used by the react-query useMutation
 *
 */
const submitRole = async (submitRoleVal: ISubmitRole) => {
  if (process.env.NODE_ENV === "development") {
    await sleep();
    let newRole = {
      Id: ++maxId,
      User: submitRoleVal.User,
      Title: submitRoleVal.Role,
    };
    //Mutate testRoles as we are mimicking the data being stored in SharePoint
    testRoles.push(newRole);
    return newRole;
  } else {
    let spRequest: ISPSubmitRole = {
      UserId: submitRoleVal.User.Id,
      Title: submitRoleVal.Role,
    };
    await spWebContext.web.lists.getByTitle("Roles").items.add(spRequest);
  }
};

/**
 * Delete the role from SharePoint
 * Internal function used by the react-query useMutation
 *
 */
const deleteRole = async (roleId: number) => {
  if (process.env.NODE_ENV === "development") {
    await sleep();
    // Mutate the testRoles to remove it as we are mimicking the data being stored in SharePoint
    testRoles = testRoles.filter((role) => role.Id !== roleId);
  } else {
    try {
      await spWebContext.web.lists
        .getByTitle("Roles")
        .items.getById(roleId)
        .delete();
    } catch (e) {
      console.error(
        `Error occurred while trying to delete Role with ID ${roleId}`
      );
      console.error(e);
      if (e instanceof Error) {
        throw new ApiError(
          e,
          `Error occurred while trying to delete Role with ID ${roleId}: ${e.message}`
        );
      } else if (typeof e === "string") {
        throw new ApiError(
          new Error(
            `Error occurred while trying to delete Role with ID ${roleId}: ${e}`
          )
        );
      } else {
        throw new ApiError(
          undefined,
          `Unknown error occurred while trying to delete Role with ID ${roleId}`
        );
      }
    }
  }
};

/**
 * Hook that returns 2 functions to be used for Role Management
 *
 */
export const useRoleManagement = (): {
  addRole: (request: ISubmitRole) => void;
  removeRole: (roleId: number) => void;
} => {
  const queryClient = useQueryClient();
  const { data: currentRoles } = useAllUserRoles();

  /** React Query Mutation used to add a Role */
  const addRoleMutation = useMutation(["roles"], submitRole, {
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries(["roles"]);
    },
    onError: (error, variable) => {
      if (error instanceof Error) {
        throw new ApiError(
          error,
          `Error occurred while trying to add ${variable.Role} Role for User ${variable.User.Title}: ${error.message}`
        );
      } else if (typeof error === "string") {
        throw new ApiError(
          new Error(
            `Error occurred while trying to add ${variable.Role} Role for User ${variable.User.Title}: ${error}`
          )
        );
      } else {
        throw new ApiError(
          undefined,
          `Unknown error occurred while trying to add ${variable.Role} Role for User ${variable.User.Title}`
        );
      }
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
        throw new ApiError(
          error,
          `Error occurred while trying to remove role with Id ${variable}: ${error.message}`
        );
      } else if (typeof error === "string") {
        throw new ApiError(
          new Error(
            `Error occurred while trying to remove role with Id ${variable}: ${error}`
          )
        );
      } else {
        throw new ApiError(
          undefined,
          `Unknown error occurred while trying to remove the role with Id ${variable}`
        );
      }
    },
  });

  /**
   * Add a Role for a User to SharePoint
   *
   * @param user - The User you want to add the Role to
   * @param role - The Role you want to add for the user
   *  */
  const addRole = (request: ISubmitRole) => {
    if (currentRoles) {
      const alreadyExists = currentRoles.filter(
        (entry) =>
          entry.User.Id === request.User.Id &&
          entry.Roles.find((roles) => roles.Role === request.Role)
      );
      if (alreadyExists?.length > 0) {
        throw new ApiError(
          new Error(
            `User ${request.User.Title} already has the Role ${request.Role}, you cannot submit a duplicate role!`
          )
        );
      } else {
        const submitRoleVal: ISubmitRole = {
          User: request.User,
          Role: request.Role,
        };

        addRoleMutation.mutate(submitRoleVal);
      }
    }
  };

  /**
   * Add a Role for a User to SharePoint
   *
   * @param user - The User you want to add the Role to
   * @param role - The Role you want to add for the user
   *  */
  const removeRole = (roleId: number) => {
    removeRoleMutation.mutate(roleId);
  };

  // Return object of functions that can be called
  return { addRole: addRole, removeRole: removeRole };
};
