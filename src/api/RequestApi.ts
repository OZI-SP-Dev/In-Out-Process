import { IItemAddResult, IItemUpdateResult } from "@pnp/sp/items";
import { EMPTYPES } from "constants/EmpTypes";
import { worklocation } from "constants/WorkLocations";
import { IPerson, Person } from "api/UserApi";
import { spWebContext } from "providers/SPWebContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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

const transformInRequestToSP = (request: IInRequest): IRequestItem => {
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
    supGovLeadId: request.supGovLead.Id,
    employeeId: request.employee?.Id,
    isTraveler: request.isTraveler,
  };
  return transformedRequest;
};

// This is a listing of all fields to be returned with a request
// Currently it is being used by all requests, but can be updated as needed
// If we do make separate field requests, we should make a new type and transform functions
const requestedFields =
  "Id,empName,empType,gradeRank,MPCN,SAR,workLocation,isNewCivMil,isTraveler,isNewToBaseAndCenter,hasExistingCAC,CACExpiration,prevOrg,eta,supGovLead/Id,supGovLead/EMail,supGovLead/Title,office,employee/Id,employee/Title,employee/EMail,completionDate";
const expandedFields = "supGovLead,employee";

// Internal functions that actually do the fetching
const getMyRequests = async () => {
  if (process.env.NODE_ENV === "development") {
    let response = testItems;
    return Promise.resolve(response);
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
    (newRequest: IInRequest) => {
      if (process.env.NODE_ENV === "development") {
        let returnRequest = {} as IItemAddResult;
        returnRequest.data = { ...newRequest, Id: 4 };
        return Promise.resolve(returnRequest);
      } else {
        return spWebContext.web.lists
          .getByTitle("Items")
          .items.add(transformInRequestToSP(newRequest));
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
    (request: IInRequest) => {
      if (process.env.NODE_ENV === "development") {
        let returnRequest = {} as IItemUpdateResult;
        returnRequest.data = { ...request, etag: "1" };
        return Promise.resolve(returnRequest);
      } else {
        return spWebContext.web.lists
          .getByTitle("Items")
          .items.getById(Id)
          .update(transformInRequestToSP(request));
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
  /** Required - Can only be set if it is a Ctr. Must be '' for Civ or Mil. */
  CACExpiration: Date | undefined;
  /** Required - The user's Estimated Arrival Date */
  eta: Date;
  /** Required - The Expected Completion Date - Default to 28 days from eta*/
  completionDate: Date;
  /** Required - The Superviosr/Gov Lead of the employee */
  supGovLead: IPerson;
  /** Required - The employee GAL entry. If the user doesn't exist yet, then it will be undefined */
  employee: IPerson | undefined;
  /** Required - Can only be 'yes' | 'no' if it is Civ/Mil. Must be '' if it is a Ctr */
  isTraveler: "yes" | "no" | "";
};

// create PnP JS response interface for the InForm
// This extends the IInRequest -- currently identical, but may need to vary when pulling in SPData
type IResponseItem = Omit<
  IInRequest,
  "eta" | "completionDate" | "CACExpiration" | "supGovLead" | "employee"
> & {
  // Storing the date objects in Single Line Text fields as ISOStrings
  eta: string;
  completionDate: string;
  CACExpiration: string;

  // supGovLead is a Person field, and we request to expand it to retrieve Id, Title, and EMail
  supGovLead: {
    Id: number;
    Title: string;
    EMail: string;
  };

  // employee is a Person field, and we request to expand it to retrieve Id, Title, and EMail
  employee?: {
    Id: number;
    Title: string;
    EMail: string;
  };
};

// create PnP JS response interface for the InForm
// This extends the IInRequest -- currently identical, but may need to vary when pulling in SPData
type IRequestItem = Omit<IResponseItem, "supGovLead" | "employee"> & {
  supGovLeadId: number;
  employeeId: number | undefined;
};

const testItems: IResponseItem[] = [
  {
    Id: 1,
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
    Id: 2,
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
    empName: "Doe, Jack E",
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
      Id: 1,
      Title: "Default User",
      EMail: "defaultTEST@us.af.mil",
    },
    employee: undefined,
  },
];
