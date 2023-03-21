import { EMPTYPES } from "constants/EmpTypes";
import { worklocation } from "constants/WorkLocations";
import { IPerson, Person } from "api/UserApi";
import { spWebContext } from "providers/SPWebContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserContext } from "providers/UserProvider";
import { useContext } from "react";

/**
 * Directly map the incoming request to the IResponseItem to perform type
 * conversions and drop SharePoint added data that is not needed, and will
 * cause update errors
 */
export const transformInRequestFromSP = (
  request: IResponseItem
): IInRequest => {
  return {
    Id: request.Id,
    empName: request.empName,
    empType: request.empType,
    gradeRank: request.gradeRank,
    MPCN: request.MPCN,
    SAR: request.SAR,
    sensitivityCode: request.sensitivityCode,
    workLocation: request.workLocation,
    workLocationDetail: request.workLocationDetail,
    office: request.office,
    isNewCivMil: request.isNewCivMil,
    prevOrg: request.prevOrg,
    hasExistingCAC: request.hasExistingCAC,
    CACExpiration: request.CACExpiration
      ? new Date(request.CACExpiration)
      : undefined,
    contractNumber: request.contractNumber,
    contractEndDate: request.contractEndDate
      ? new Date(request.contractEndDate)
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
    isSupervisor: request.isSupervisor,
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
    sensitivityCode: request.sensitivityCode,
    workLocation: request.workLocation,
    workLocationDetail: request.workLocationDetail,
    office: request.office,
    isNewCivMil: request.isNewCivMil,
    prevOrg: request.prevOrg,
    hasExistingCAC: request.hasExistingCAC,
    CACExpiration: request.CACExpiration
      ? request.CACExpiration.toISOString()
      : "",
    contractNumber: request.contractNumber,
    contractEndDate: request.contractEndDate
      ? request.contractEndDate.toISOString()
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
    isSupervisor: request.isSupervisor,
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
  "Id,empName,empType,gradeRank,MPCN,SAR,sensitivityCode,workLocation,workLocationDetail,isNewCivMil,isTraveler,isSupervisor,hasExistingCAC,CACExpiration,contractNumber,contractEndDate,prevOrg,eta,supGovLead/Id,supGovLead/EMail,supGovLead/Title,office,employee/Id,employee/Title,employee/EMail,completionDate,closedOrCancelledDate,cancelReason";
const expandedFields = "supGovLead,employee";

// Internal functions that actually do the fetching
const getMyRequests = async (userId: number) => {
  return spWebContext.web.lists
    .getByTitle("Items")
    .items.filter(
      `(supGovLead/Id eq '${userId}' or employee/Id eq '${userId}') and closedOrCancelledDate eq null`
    )
    .select(requestedFields)
    .expand(expandedFields)();
};

export const getRequest = async (Id: number) => {
  return spWebContext.web.lists
    .getByTitle("Items")
    .items.getById(Id)
    .select(requestedFields)
    .expand(expandedFields)();
};

const getRequests = async () => {
  return spWebContext.web.lists
    .getByTitle("Items")
    .items.select(requestedFields)
    .expand(expandedFields)
    .top(5000)();
};

// Exported hooks for working with requests

export const useMyRequests = () => {
  const userId = useContext(UserContext).user.Id;
  return useQuery({
    queryKey: ["requests", "user" + userId],
    queryFn: () => getMyRequests(userId),
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
      const newRequestRes = await spWebContext.web.lists
        .getByTitle("Items")
        .items.add(await transformInRequestToSP(newRequest));

      // Pass back the request that came to us, but add in the Id returned from SharePoint
      let res: IInRequest = structuredClone(newRequest);
      res.Id = newRequestRes.data.Id;

      return res;
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
      return spWebContext.web.lists
        .getByTitle("Items")
        .items.getById(Id)
        .update(await transformInRequestToSP(request));
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
  /** Optional - The Employee's MPCN from the UMD -- Required for CIV/MIL, others will be blank */
  MPCN?: number;
  /** Required - The Employee's SAR from the UMD */
  SAR: number;
  /** Optional - The Employee's Sensitivity Code from the PD -- Required for CIV, others will be blank */
  sensitivityCode?: number;
  /** Required - Possible values are 'local' and 'remote'  */
  workLocation: worklocation;
  /** Optional - Required if workLocation is 'remote', otherwise is blank */
  workLocationDetail?: string;
  /** Required - The Employee's Office */
  office: string;
  /** Required - Can only be 'yes' | 'no' if it is Civilian or Military.  Must be '' if it is a Contractor */
  isNewCivMil: "yes" | "no" | "";
  /** Required - The user's previous organization.  Will be '' if isNewCiv is not 'yes' */
  prevOrg: string;
  /** Required - Can only be 'yes' | 'no' if is a Ctr.  For others it will be '' */
  hasExistingCAC: "yes" | "no" | "";
  /** Optional - Can only be set if it is a Ctr. Must be '' for Civ or Mil. */
  CACExpiration?: Date;
  /** Optional - Must be set if it is a Ctr. Must be '' for Civ or Mil */
  contractNumber?: string;
  /** Optional - Must be set if it is a Ctr. Must be '' for Civ or Mil */
  contractEndDate?: Date;
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
  /** Required - Can only be 'yes' | 'no' if it is Civ/Mil. Must be '' if it is a Ctr */
  isSupervisor: "yes" | "no" | "";
  /** Optional - Date Supervisor Closed or Cancelled -- If there is a cancelReason then we know it was cancelled */
  closedOrCancelledDate?: Date;
  /** Optional - The reason for why the request was cancelled */
  cancelReason?: string;
  // Required - This is a field internally used by the app -- it is calculated within the app and not passed to/from the data repo (SharePoint)
  status: "Active" | "Cancelled" | "Closed";
};

// create PnP JS response interface for the InForm
// This extends the IInRequest to change the types of certain objects
export type IResponseItem = Omit<
  IInRequest,
  | "eta"
  | "completionDate"
  | "CACExpiration"
  | "contractEndDate"
  | "closedOrCancelledDate"
  | "status" // Drop the status object from the type, as it is used internally and is not data from the repository
> & {
  // Storing the date objects in Single Line Text fields as ISOStrings
  eta: string;
  completionDate: string;
  CACExpiration: string;
  contractEndDate: string;
  closedOrCancelledDate?: string;
};

// create PnP JS response interface for the InForm
// This extends the IInRequest to drop some required objects and add additional objects
export type IRequestItem = Omit<IResponseItem, "supGovLead" | "employee"> & {
  supGovLeadId: number;
  employeeId: number;
  employeeStringId?: string;
};
