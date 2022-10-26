import { IItemAddResult, IItemUpdateResult } from "@pnp/sp/items";
import { EMPTYPES } from "constants/EmpTypes";
import { worklocation } from "constants/WorkLocations";
import { IPerson, Person } from "api/UserApi";
import { spWebContext } from "providers/SPWebContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { people } from "@fluentui/example-data";

declare var _spPageContextInfo: any;

/**
 * Directly map the incoming request to the IResponseItem to perform type
 * conversions and drop SharePoint added data that is not needed, and will
 * cause update errors
 */
const transformInRequestFromSP = (request: IResponseItem): IInRequest => {
  return {
    Id: request.Id,
    empName: request.empName,
    empType: request.empType,
    gradeRank: request.gradeRank,
    MPCN: request.MPCN,
    SAR: request.SAR,
    workLocation: request.workLocation,
    office: request.office,
    isNewCivMil: request.isNewCivMil,
    prevOrg: request.prevOrg,
    isNewToBaseAndCenter: request.isNewToBaseAndCenter,
    hasExistingCAC: request.hasExistingCAC,
    CACExpiration: request.CACExpiration
      ? new Date(request.CACExpiration)
      : undefined,
    eta: new Date(request.eta),
    completionDate: new Date(request.completionDate),
    supGovLead: new Person({
      Id: request.supGovLead.Id,
      EMail: request.supGovLead.EMail,
      Title: request.supGovLead.Title,
    }),
    employee: request.employee
      ? new Person({
          Id: request.employee.Id,
          EMail: request.employee.EMail,
          Title: request.employee.Title,
        })
      : undefined,
    isTraveler: request.isTraveler,
    closedOrCancelledDate: request.closedOrCancelledDate
      ? new Date(request.closedOrCancelledDate)
      : undefined,
    cancelReason: request.cancelReason,
    status: request.closedOrCancelledDate
      ? request.cancelReason
        ? "Cancelled"
        : "Closed"
      : "Active",
  };
};

const transformInRequestsFromSP = (requests: IResponseItem[]): IInRequest[] => {
  return requests.map((request) => {
    return transformInRequestFromSP(request);
  });
};

/**
 * Directly map the incoming request to the IRequestItem to perform type
 * conversions and drop SharePoint added data that is not needed, and
 * will cause update errors.
 *
 * Convert Date objects to strings
 * Convert Person objects to their IDs
 */

const transformInRequestToSP = async (
  request: IInRequest
): Promise<IRequestItem> => {
  const transformedRequest: IRequestItem = {
    Id: request.Id,
    empName: request.empName,
    empType: request.empType,
    gradeRank: request.gradeRank,
    MPCN: request.MPCN,
    SAR: request.SAR,
    workLocation: request.workLocation,
    office: request.office,
    isNewCivMil: request.isNewCivMil,
    prevOrg: request.prevOrg,
    isNewToBaseAndCenter: request.isNewToBaseAndCenter,
    hasExistingCAC: request.hasExistingCAC,
    CACExpiration: request.CACExpiration
      ? request.CACExpiration.toISOString()
      : "",
    eta: request.eta.toISOString(),
    completionDate: request.completionDate.toISOString(),
    supGovLeadId:
      request.supGovLead.Id === -1
        ? (await spWebContext.web.ensureUser(request.supGovLead.EMail)).data.Id
        : request.supGovLead.Id,
    /* If an employee is provided then we are upadting the employee field with a person
        A value of -1 requires looking up the site user's Id, whereas a positive number means we already have the Id.
       If the employee object is undefined then we need to clear the SharePoint field.  We do this by setting the
        employeeId to -1 and the employeeStringId to "".  If we don't set employeeStringId to "" then both our app and the
        native SharePoint UI will show a partial person object having an Id of -1 rather than a clear field  
    */
    employeeId: request.employee?.Id
      ? request.employee.Id === -1
        ? (await spWebContext.web.ensureUser(request.employee.EMail)).data.Id
        : request.employee.Id
      : -1,
    employeeStringId: request.employee?.Id ? undefined : "",
    isTraveler: request.isTraveler,
    closedOrCancelledDate: request.closedOrCancelledDate
      ? request.closedOrCancelledDate.toISOString()
      : "",
    cancelReason: request.cancelReason,
  };
  return transformedRequest;
};

// This is a listing of all fields to be returned with a request
// Currently it is being used by all requests, but can be updated as needed
// If we do make separate field requests, we should make a new type and transform functions
const requestedFields =
  "Id,empName,empType,gradeRank,MPCN,SAR,workLocation,isNewCivMil,isTraveler,isNewToBaseAndCenter,hasExistingCAC,CACExpiration,prevOrg,eta,supGovLead/Id,supGovLead/EMail,supGovLead/Title,office,employee/Id,employee/Title,employee/EMail,completionDate,closedOrCancelledDate,cancelReason";
const expandedFields = "supGovLead,employee";

// Internal functions that actually do the fetching
const getMyRequests = async () => {
  if (process.env.NODE_ENV === "development") {
    return Promise.resolve(
      testItems.filter(
        (item) => item.employee?.Id === 1 || item.supGovLead.Id === 1
      )
    );
  } else {
    // userId moved inside statement determining if dev environment or not as was exiting without returning when not existing in dev
    const userId = _spPageContextInfo?.userId;
    if (userId === undefined) {
      return Promise.reject([]);
    } else {
      return spWebContext.web.lists
        .getByTitle("Items")
        .items.filter(
          `supGovLead/Id eq '${userId}' or employee/Id eq '${userId}'`
        )
        .select(requestedFields)
        .expand(expandedFields)();
    }
  }
};

const getRequest = async (Id: number) => {
  if (process.env.NODE_ENV === "development") {
    let response = testItems[Id - 1];
    return Promise.resolve(response);
  } else {
    return spWebContext.web.lists
      .getByTitle("Items")
      .items.getById(Id)
      .select(requestedFields)
      .expand(expandedFields)();
  }
};

const getRequests = async () => {
  if (process.env.NODE_ENV === "development") {
    let response = testItems;
    return Promise.resolve(response);
  } else {
    return spWebContext.web.lists
      .getByTitle("Items")
      .items.select(requestedFields)
      .expand(expandedFields)();
  }
};

// Exported hooks for working with requests

export const useMyRequests = () => {
  return useQuery(["requests", "currentUser"], getMyRequests, {
    select: transformInRequestsFromSP,
  });
};

export const useRequest = (requestId: number) => {
  return useQuery({
    queryKey: ["requests", requestId],
    queryFn: () => getRequest(requestId),
    select: transformInRequestFromSP,
  });
};

export const useRequests = () => {
  return useQuery({
    queryKey: ["requests"],
    queryFn: () => getRequests(),
    select: transformInRequestsFromSP,
  });
};

export const useAddRequest = () => {
  const queryClient = useQueryClient();
  return useMutation(
    ["requests"],
    async (newRequest: IInRequest) => {
      if (process.env.NODE_ENV === "development") {
        let returnRequest = {} as IItemAddResult;
        returnRequest.data = { ...newRequest, Id: 4 };
        return Promise.resolve(returnRequest);
      } else {
        return spWebContext.web.lists
          .getByTitle("Items")
          .items.add(await transformInRequestToSP(newRequest));
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["requests"]);
      },
    }
  );
};

export const useUpdateRequest = (Id: number) => {
  const queryClient = useQueryClient();
  return useMutation(
    ["requests", Id],
    async (request: IInRequest) => {
      if (process.env.NODE_ENV === "development") {
        let returnRequest = {} as IItemUpdateResult;
        returnRequest.data = { ...request, etag: "1" };
        return Promise.resolve(returnRequest);
      } else {
        return spWebContext.web.lists
          .getByTitle("Items")
          .items.getById(Id)
          .update(await transformInRequestToSP(request));
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["requests", Id]);
      },
    }
  );
};

// create IItem item to work with it internally
export type IInRequest = {
  /** Required - Will be -1 for NewForms that haven't been saved yet */
  Id: number;
  /** Required - Contains the Employee's Name */
  empName: string;
  /** Required - Employee's Type valid values are:
   * 'Civilian' - for Civilian Employees
   * 'Contractor' - for Contracted Employees
   * 'Military' - for Military Employees
   */
  empType: EMPTYPES;
  /** Required - The Employee's Grade/Rank.  Not applicable if 'ctr' */
  gradeRank: string;
  /** Required - The Employee's MPCN from the UMD */
  MPCN: number;
  /** Required - The Employee's SAR from the UMD */
  SAR: number;
  /** Required - Possible values are 'local' and 'remote'  */
  workLocation: worklocation;
  /** Required - The Employee's Office */
  office: string;
  /** Required - Can only be 'yes' | 'no' if it is Civilian or Military.  Must be '' if it is a Contractor */
  isNewCivMil: "yes" | "no" | "";
  /** Required - The user's previous organization.  Will be '' if isNewCiv is not 'yes' */
  prevOrg: string;
  /** Required - Can only be 'yes' | 'no' if it is a Civ/Mil. For Ctr, must be '' */
  isNewToBaseAndCenter: "yes" | "no" | "";
  /** Required - Can only be 'yes' | 'no' if is a Ctr.  For others it will be '' */
  hasExistingCAC: "yes" | "no" | "";
  /** Optional - Can only be set if it is a Ctr. Must be '' for Civ or Mil. */
  CACExpiration?: Date;
  /** Required - The user's Estimated Arrival Date */
  eta: Date;
  /** Required - The Expected Completion Date - Default to 28 days from eta*/
  completionDate: Date;
  /** Required - The Superviosr/Gov Lead of the employee */
  supGovLead: IPerson;
  /** Optional - The employee GAL entry. If the user doesn't exist yet, then it will be undefined */
  employee?: IPerson;
  /** Required - Can only be 'yes' | 'no' if it is Civ/Mil. Must be '' if it is a Ctr */
  isTraveler: "yes" | "no" | "";
  /** Optional - Date Supervisor Closed or Cancelled -- If there is a cancelReason then we know it was cancelled */
  closedOrCancelledDate?: Date;
  /** Optional - The reason for why the request was cancelled */
  cancelReason?: string;
  // Required - This is a field internally used by the app -- it is calculated within the app and not passed to/from the data repo (SharePoint)
  status: "Active" | "Cancelled" | "Closed";
};

// create PnP JS response interface for the InForm
// This extends the IInRequest to change the types of certain objects
type IResponseItem = Omit<
  IInRequest,
  | "eta"
  | "completionDate"
  | "CACExpiration"
  | "closedOrCancelledDate"
  | "status" // Drop the status object from the type, as it is used internally and is not data from the repository
> & {
  // Storing the date objects in Single Line Text fields as ISOStrings
  eta: string;
  completionDate: string;
  CACExpiration: string;
  closedOrCancelledDate?: string;
};

// create PnP JS response interface for the InForm
// This extends the IInRequest to drop some required objects and add additional objects
type IRequestItem = Omit<IResponseItem, "supGovLead" | "employee"> & {
  supGovLeadId: number;
  employeeId: number;
  employeeStringId?: string;
};

// Declare testItems so it can be used if needed
let testItems: IResponseItem[] = [];

// Generate data for testing but only in the development environment
if (process.env.NODE_ENV === "development") {
  testItems.push(
    {
      Id: 2,
      empName: "Doe, John D",
      empType: EMPTYPES.Civilian,
      gradeRank: "GS-11",
      MPCN: 1234567,
      SAR: 5,
      workLocation: "remote",
      office: "OZIC",
      isNewCivMil: "yes",
      prevOrg: "",
      isNewToBaseAndCenter: "yes",
      hasExistingCAC: "no",
      CACExpiration: "2022-12-31T00:00:00.000Z",
      eta: "2022-12-31T00:00:00.000Z",
      completionDate: "2023-01-31T00:00:00.000Z",
      supGovLead: {
        Id: 1,
        Title: "Default User",
        EMail: "defaultTEST@us.af.mil",
      },
      employee: {
        Id: 2,
        Title: "Default User 2",
        EMail: "defaultTEST2@us.af.mil",
      },
      isTraveler: "no",
    },
    {
      Id: 1,
      empName: "Doe, Jane D",
      empType: EMPTYPES.Civilian,
      gradeRank: "GS-13",
      MPCN: 7654321,
      SAR: 6,
      workLocation: "local",
      office: "OZIC",
      isNewCivMil: "no",
      prevOrg: "AFLCMC/WA",
      isNewToBaseAndCenter: "no",
      hasExistingCAC: "no",
      CACExpiration: "2022-12-31T00:00:00.000Z",
      eta: "2022-12-31T00:00:00.000Z",
      completionDate: "2023-01-31T00:00:00.000Z",
      supGovLead: {
        Id: 1,
        Title: "Default User",
        EMail: "defaultTEST@us.af.mil",
      },
      employee: {
        Id: 2,
        Title: "Default User 2",
        EMail: "defaultTEST2@us.af.mil",
      },
      isTraveler: "no",
    },
    {
      Id: 3,
      empName: "Default User",
      empType: EMPTYPES.Civilian,
      gradeRank: "GS-12",
      MPCN: 1233217,
      SAR: 6,
      workLocation: "local",
      office: "OZIC",
      isNewCivMil: "yes",
      isTraveler: "yes",
      prevOrg: "",
      isNewToBaseAndCenter: "yes",
      hasExistingCAC: "no",
      CACExpiration: "",
      eta: "2022-12-31T00:00:00.000Z",
      completionDate: "2023-01-31T00:00:00.000Z",
      supGovLead: {
        Id: 2,
        Title: "Default User 2",
        EMail: "defaultTEST2@us.af.mil",
      },
      employee: {
        Id: 1,
        Title: "Default User",
        EMail: "defaultTEST@us.af.mil",
      },
    },
    {
      Id: 5,
      empName: "Cancelled, Imma B",
      empType: EMPTYPES.Civilian,
      gradeRank: "GS-13",
      MPCN: 7654321,
      SAR: 6,
      workLocation: "local",
      office: "OZIC",
      isNewCivMil: "no",
      prevOrg: "AFLCMC/WA",
      isNewToBaseAndCenter: "no",
      hasExistingCAC: "no",
      CACExpiration: "2022-12-31T00:00:00.000Z",
      eta: "2022-12-31T00:00:00.000Z",
      completionDate: "2023-01-31T00:00:00.000Z",
      supGovLead: {
        Id: 1,
        Title: "Default User",
        EMail: "defaultTEST@us.af.mil",
      },
      employee: {
        Id: 2,
        Title: "Default User 2",
        EMail: "defaultTEST2@us.af.mil",
      },
      isTraveler: "no",
      closedOrCancelledDate: "2022-11-30T00:00:00.000Z",
      cancelReason: "Employee proceeded with new opportunity",
    },
    {
      Id: 4,
      empName: "Closed, Aye M",
      empType: EMPTYPES.Civilian,
      gradeRank: "GS-13",
      MPCN: 7654321,
      SAR: 6,
      workLocation: "local",
      office: "OZIC",
      isNewCivMil: "no",
      prevOrg: "AFLCMC/WA",
      isNewToBaseAndCenter: "no",
      hasExistingCAC: "no",
      CACExpiration: "2022-12-31T00:00:00.000Z",
      eta: "2022-12-31T00:00:00.000Z",
      completionDate: "2023-01-31T00:00:00.000Z",
      supGovLead: {
        Id: 1,
        Title: "Default User",
        EMail: "defaultTEST@us.af.mil",
      },
      employee: {
        Id: 2,
        Title: "Default User 2",
        EMail: "defaultTEST2@us.af.mil",
      },
      isTraveler: "no",
      closedOrCancelledDate: "2022-11-30T00:00:00.000Z",
    }
  );

  var x = testItems.length;
  const today = new Date();

  while (x++ < 25) {
    // Should it have a Completed Date?
    let closedDate: string = "";
    let completionDate: string = "";
    let etaDate: string = "";
    let employee: { Id: number; Title: string; EMail: string };
    let supervisor: { Id: number; Title: string; EMail: string };

    const randomDayDiff = Math.floor(Math.random() * 14);

    // Use a random person
    const employeeId = Math.floor(Math.random() * people.length);
    const supervisorId = Math.floor(Math.random() * people.length);
    const empTitle = people[employeeId].text;
    const supTitle = people[supervisorId].text;
    employee = {
      Id: employeeId,
      Title: empTitle ? empTitle : "TEST USER",
      EMail: `${people[employeeId].key}@test.us.af.mil`,
    };
    supervisor = {
      Id: supervisorId,
      Title: supTitle ? supTitle : "TEST SUPERVISOR",
      EMail: `${people[supervisorId].key}@test.us.af.mil`,
    };

    // Determine if we should make the current user be the Employee or Supervisor
    const useCurrentUser = Math.floor(Math.random() * 3);
    if (useCurrentUser === 0) {
      // Make the Employee the current user
      employee = { Id: 1, Title: "Default User", EMail: "me@example.com" };
    } else if (useCurrentUser === 1) {
      // Make the Supervisor the current user
      supervisor = { Id: 1, Title: "Default User", EMail: "me@example.com" };
    }

    // If it isn't 0 then let's make it that date -- 0 will be "Incomplete CheckListItem"
    if (randomDayDiff) {
      let newDate = new Date();
      newDate.setDate(today.getDate() - randomDayDiff);
      closedDate = newDate.toISOString();
      newDate.setDate(newDate.getDate() - 14);
      etaDate = newDate.toISOString();
      completionDate = etaDate;
    }
    // If it was 0, then let's set some future dates
    else {
      const randomDayDiff = Math.floor(Math.random() * 14);
      let newDate = new Date();
      newDate.setDate(today.getDate() + randomDayDiff);
      etaDate = newDate.toISOString();
      newDate.setDate(newDate.getDate() + 14);
      completionDate = newDate.toISOString();
    }

    testItems.push({
      Id: x,
      empName: employee.Title,
      empType: EMPTYPES.Civilian,
      gradeRank: "GS-13",
      MPCN: 7654321,
      SAR: 6,
      workLocation: "local",
      office: "OZIC",
      isNewCivMil: "no",
      prevOrg: "AFLCMC/WA",
      isNewToBaseAndCenter: "no",
      hasExistingCAC: "no",
      CACExpiration: "2022-12-31T00:00:00.000Z",
      eta: etaDate,
      completionDate: completionDate,
      supGovLead: supervisor,
      employee: employee,
      isTraveler: "no",
      closedOrCancelledDate: closedDate,
    });
  }
}
