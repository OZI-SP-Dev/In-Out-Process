import { EMPTYPES } from "constants/EmpTypes";
import { worklocation } from "constants/WorkLocations";
import { IPerson, Person } from "api/UserApi";
import { spWebContext } from "providers/SPWebContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserContext } from "providers/UserProvider";
import { useContext } from "react";
import { useAddTasks } from "api/CreateChecklistItems";
import {
  useSendRequestCancelEmail,
  useSendRequestCompleteEmail,
  useSendRequestSubmitEmail,
} from "api/EmailApi";
import { ICheckListItem } from "api/CheckListItemApi";

/**  Definition for what data is needed to peform the cancellation (including to send email) */
interface IRequestCancel {
  /** The request */
  request: IRequest;
  /** The tasks, so we know which Leads to contact */
  tasks: ICheckListItem[];
  /** The reason the rquest was cancelled */
  reason: string;
}

/**
 * Directly map the incoming request to the IResponseItem to perform type
 * conversions and drop SharePoint added data that is not needed, and will
 * cause update errors
 */
export const transformRequestFromSP = (request: IResponseItem): IRequest => {
  if (isInResponse(request)) {
    return {
      reqType: request.reqType,
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
      isSCI: request.isSCI,
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
  } else {
    return {
      reqType: request.reqType,
      Id: request.Id,
      empName: request.empName,
      empType: request.empType,
      SAR: request.SAR,
      sensitivityCode: request.sensitivityCode,
      workLocation: request.workLocation,
      workLocationDetail: request.workLocationDetail,
      office: request.office,
      isTraveler: request.isTraveler,
      outReason: request.outReason,
      gainingOrg: request.gainingOrg,
      isSCI: request.isSCI,
      hasSIPR: request.hasSIPR,
      lastDay: new Date(request.lastDay),
      beginDate: new Date(request.beginDate),
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
  }
};

/**
 * Directly map the incoming request to the IRequestItem to perform type
 * conversions and drop SharePoint added data that is not needed, and
 * will cause update errors.
 *
 * Convert Date objects to strings
 * Convert Person objects to their IDs
 */

const transformRequestToSP = async (
  request: IRequest
): Promise<IRequestItem> => {
  if (isInRequest(request)) {
    // Transform for In Processing Request
    return {
      reqType: request.reqType,
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
          ? (await spWebContext.web.ensureUser(request.supGovLead.EMail)).data
              .Id
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
      isSCI: request.isSCI,
      closedOrCancelledDate: request.closedOrCancelledDate
        ? request.closedOrCancelledDate.toISOString()
        : "",
      cancelReason: request.cancelReason,
    } as IInRequestItem;
  } else {
    // Transform for Out Processing Request
    return {
      reqType: request.reqType,
      Id: request.Id,
      empName: request.empName,
      empType: request.empType,
      SAR: request.SAR,
      sensitivityCode: request.sensitivityCode,
      workLocation: request.workLocation,
      workLocationDetail: request.workLocationDetail,
      office: request.office,
      isTraveler: request.isTraveler,
      outReason: request.outReason,
      gainingOrg: request.gainingOrg,
      isSCI: request.isSCI,
      hasSIPR: request.hasSIPR,
      lastDay: request.lastDay.toISOString(),
      beginDate: request.beginDate.toISOString(),
      supGovLeadId:
        request.supGovLead.Id === -1
          ? (await spWebContext.web.ensureUser(request.supGovLead.EMail)).data
              .Id
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
      closedOrCancelledDate: request.closedOrCancelledDate
        ? request.closedOrCancelledDate.toISOString()
        : "",
      cancelReason: request.cancelReason,
    } as IOutRequestItem;
  }
};

/**
 * Directly map the request from SharePoint to perform type
 * conversions and drop SharePoint added data that is not needed, and will
 * cause update errors
 */
export const transformRequestSummaryFromSP = (
  request: IResponseItem
): IRequestSummary => {
  if (isInResponse(request)) {
    return {
      reqType: request.reqType,
      Id: request.Id,
      empName: request.empName,
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
  } else {
    return {
      reqType: request.reqType,
      Id: request.Id,
      empName: request.empName,
      lastDay: new Date(request.lastDay),
      beginDate: new Date(request.beginDate),
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
  }
};

const transformRequestsSummaryFromSP = (
  requests: IResponseItem[]
): IRequestSummary[] => {
  return requests.map((request) => {
    return transformRequestSummaryFromSP(request);
  });
};

// This is a listing of all fields to be returned with an individual request
// We leverage wildcard to get all fields, but have to specify the particular expanded entries we want from expanded field
const requestedFields =
  "*,supGovLead/Id,supGovLead/EMail,supGovLead/Title,employee/Id,employee/Title,employee/EMail";
const expandedFields = "supGovLead,employee";

// These are the fields that we get for the My Requests table, as well as for getting My Checklist Items
//  Id is used for navigating in My Requests and My Checklist Items
//  reqType is used to know if it is In/Out type
//  cancelReason/closedOrCancelled are used to determine request status
//  empName and eta are used by My Requests table and My Checklist Items
//  completionDate is used by My Checklist Items
//  supGovLead/Id and employee/Id are used to determine what should be in My Checklist Items
const requestsSummaryFields =
  "Id,reqType,empName,eta,completionDate,cancelReason,closedOrCancelledDate,supGovLead/Id,supGovLead/EMail,supGovLead/Title,employee/Id,employee/EMail,employee/Title";
const requestsSummaryexpandedFields = "supGovLead,employee";

// Internal functions that actually do the fetching
const getMyRequests = async (userId: number) => {
  return spWebContext.web.lists
    .getByTitle("Items")
    .items.filter(
      `(supGovLead/Id eq '${userId}' or employee/Id eq '${userId}') and closedOrCancelledDate eq null`
    )
    .select(requestsSummaryFields)
    .expand(requestsSummaryexpandedFields)();
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
    .items.select(requestsSummaryFields)
    .expand(requestsSummaryexpandedFields)
    .top(5000)();
};

// Exported hooks for working with requests

export const useMyRequests = () => {
  const userId = useContext(UserContext).user.Id;
  return useQuery({
    queryKey: ["requests", "user" + userId],
    queryFn: () => getMyRequests(userId),
    select: transformRequestsSummaryFromSP,
  });
};

export const useRequest = (requestId: number) => {
  return useQuery({
    queryKey: ["requests", requestId],
    queryFn: () => getRequest(requestId),
    select: transformRequestFromSP,
  });
};

export const useRequests = () => {
  return useQuery({
    queryKey: ["requests"],
    queryFn: () => getRequests(),
    select: transformRequestsSummaryFromSP,
  });
};

export const useAddRequest = () => {
  const queryClient = useQueryClient();
  const addTasks = useAddTasks();
  const sendRequestSubmitEmail = useSendRequestSubmitEmail();
  return useMutation(
    ["requests"],
    async (newRequest: IRequest) => {
      const newRequestRes = await spWebContext.web.lists
        .getByTitle("Items")
        .items.add(await transformRequestToSP(newRequest));

      // Pass back the request that came to us, but add in the Id returned from SharePoint
      let res: IRequest = structuredClone(newRequest);
      res.Id = newRequestRes.data.Id;

      return res;
    },
    {
      onSuccess: async (data) => {
        // Mark requests as needing refreshed
        queryClient.invalidateQueries(["requests"]);

        // Create the tasks using that new Request Id
        const tasks = await addTasks.mutateAsync(data);
        // After the tasks have been created, generate the email notification
        sendRequestSubmitEmail.mutate({ request: data, tasks: tasks });
      },
    }
  );
};

export const useUpdateRequest = (Id: number) => {
  const queryClient = useQueryClient();
  return useMutation(
    ["requests", Id],
    async (request: IRequest) => {
      return spWebContext.web.lists
        .getByTitle("Items")
        .items.getById(Id)
        .update(await transformRequestToSP(request));
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["requests", Id]);
      },
    }
  );
};

export const useCancelRequest = (Id: number) => {
  const queryClient = useQueryClient();
  const sendRequestCancelEmail = useSendRequestCancelEmail();
  return useMutation(
    ["requests", Id],
    async (cancelInfo: IRequestCancel) => {
      const now = new Date();
      return spWebContext.web.lists
        .getByTitle("Items")
        .items.getById(Id)
        .update({
          // Set it to be cancelled today
          closedOrCancelledDate: now.toISOString(),
          // Populate the reason it was cancelled
          cancelReason: cancelInfo.reason,
        });
    },
    {
      onSuccess: (_data, variable) => {
        queryClient.invalidateQueries(["requests", Id]);

        // TODO -- When implementing Out Request Email -- remove this typecheck, and update hook to send correct email
        if (isInRequest(variable.request)) {
          // Generate the email notification
          sendRequestCancelEmail.mutate({
            request: variable.request,
            tasks: variable.tasks,
            reason: variable.reason,
          });
        }
      },
    }
  );
};

// Hook for Completing a request
export const useCompleteRequest = (Id: number) => {
  const queryClient = useQueryClient();
  const sendRequestCompleteEmail = useSendRequestCompleteEmail();

  return useMutation(
    ["requests", Id],
    async (request: IRequest) => {
      const now = new Date();
      return spWebContext.web.lists
        .getByTitle("Items")
        .items.getById(request.Id)
        .update({
          // Set it to be closed today
          closedOrCancelledDate: now.toISOString(),
        });
    },
    {
      onSuccess: (_data, request) => {
        queryClient.invalidateQueries(["requests", Id]);

        // Generate the email notification
        // TODO -- When implementing Out Request Email -- remove this typecheck, and update hook to send correct email
        if (isInRequest(request)) {
          sendRequestCompleteEmail.mutate(request);
        }
      },
    }
  );
};

// create IItem item to work with it internally
export type IInRequest = {
  /** Required - Whether it is In or Out Processing request */
  reqType: "In";
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
  /** Optional - The Employee's SAR from the UMD -- Required for CIV/MIL, others will be blank */
  SAR?: number;
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
  /** Required - Can only be 'yes' | 'no' if it is Mil. Must be '' if it is a Civ/Ctr */
  isSCI: "yes" | "no" | "";
  /** Optional - Date Supervisor Closed or Cancelled -- If there is a cancelReason then we know it was cancelled */
  closedOrCancelledDate?: Date;
  /** Optional - The reason for why the request was cancelled */
  cancelReason?: string;
  // Required - This is a field internally used by the app -- it is calculated within the app and not passed to/from the data repo (SharePoint)
  status: "Active" | "Cancelled" | "Closed";
};

// create PnP JS response interface for the InForm
// This extends the IInRequest to change the types of certain objects
export type IInResponseItem = Omit<
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
export type IInRequestItem = Omit<
  IInResponseItem,
  "supGovLead" | "employee"
> & {
  supGovLeadId: number;
  employeeId: number;
  employeeStringId?: string;
};

// create IItem item to work with it internally
export type IOutRequest = {
  reqType: "Out";
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
  /** Optional - The Employee's SAR from the UMD -- Required for CIV/MIL, others will be blank */
  SAR?: number;
  /** Optional - The Employee's Sensitivity Code from the PD -- Required for CIV, others will be blank */
  sensitivityCode?: number;
  /** Required - Possible values are 'local' and 'remote'  */
  workLocation: worklocation;
  /** Optional - Required if workLocation is 'remote', otherwise is blank */
  workLocationDetail?: string;
  /** Required - The Employee's Office */
  office: string;
  /** Required - Can only be 'yes' | 'no' if it is Civ/Mil. Must be '' if it is a Ctr */
  isTraveler: "yes" | "no" | "";
  /** Required - Thre reason they are out-processing */
  outReason: string;
  /** Required - The user's new organization.  Will be '' if they are not transferring */
  gainingOrg: string;
  /** Required - Can only be 'yes' | 'no' */
  isSCI: "yes" | "no";
  /** Required - Can only be 'yes' | 'no' */
  hasSIPR: "yes" | "no";
  /** Required - The user's last day */
  lastDay: Date;
  /** Required - The estimated date to start out processing - Default to 7 days before lastDay*/
  beginDate: Date;
  /** Required - The Superviosr/Gov Lead of the employee */
  supGovLead: IPerson;
  /** Optional - The employee GAL entry. If the user doesn't exist yet, then it will be undefined */
  employee?: IPerson;
  /** Optional - Date Supervisor Closed or Cancelled -- If there is a cancelReason then we know it was cancelled */
  closedOrCancelledDate?: Date;
  /** Optional - The reason for why the request was cancelled */
  cancelReason?: string;
  // Required - This is a field internally used by the app -- it is calculated within the app and not passed to/from the data repo (SharePoint)
  status: "Active" | "Cancelled" | "Closed";
};

// create PnP JS response interface for the InForm
// This extends the IOutRequest to change the types of certain objects
export type IOutResponseItem = Omit<
  IOutRequest,
  "lastDay" | "beginDate" | "closedOrCancelledDate" | "status" // Drop the status object from the type, as it is used internally and is not data from the repository
> & {
  // Storing the date objects in Single Line Text fields as ISOStrings
  lastDay: string;
  beginDate: string;
  closedOrCancelledDate?: string;
};

// create PnP JS response interface for the InForm
// This extends the IOutRequest to drop some required objects and add additional objects
export type IOutRequestItem = Omit<
  IOutResponseItem,
  "supGovLead" | "employee"
> & {
  supGovLeadId: number;
  employeeId: number;
  employeeStringId?: string;
};

// Pick just the fields from IInRequest that we need
type IInRequestSummary = Pick<
  IInRequest,
  | "Id"
  | "reqType"
  | "empName"
  | "eta"
  | "completionDate"
  | "cancelReason"
  | "closedOrCancelledDate"
  | "supGovLead"
  | "employee"
  | "status"
>;

// Pick just the fields from IOutRequest that we need
type IOutRequestSummary = Pick<
  IOutRequest,
  | "Id"
  | "reqType"
  | "empName"
  | "lastDay"
  | "beginDate"
  | "cancelReason"
  | "closedOrCancelledDate"
  | "supGovLead"
  | "employee"
  | "status"
>;

/* Limited fields retrieved from the Request listing */
export type IRequestSummary = IInRequestSummary | IOutRequestSummary;

/** Request Type -- Can be either IInRequest or IOutRequest */
export type IRequest = IInRequest | IOutRequest;

/** RequestItem Type -- Can be either IInRequestItem or IOutRequestItem */
export type IRequestItem = IInRequestItem | IOutRequestItem;

/** RequestItem Type -- Can be either IInRequestItem or IOutRequestItem */
export type IResponseItem = IInResponseItem | IOutResponseItem;

// Custom Type Checking Function to determine if it is an In Processing Request, or an Out Processing Request
export function isInRequest(
  request: IInRequest | IOutRequest
): request is IInRequest {
  return request.reqType !== "Out"; // If it isn't an Out processing, then it must be In processing -- supports legacy records where "In" was not set
}

// Custom Type Checking Function to determine if it is an In Processing Request response, or an Out Processing Request response
export function isInResponse(
  request: IResponseItem
): request is IInResponseItem {
  return request.reqType !== "Out"; // If it isn't an Out processing, then it must be In processing -- supports legacy records where "In" was not set
}

// Custom Type Checking Function to determine if it is an In Processing Request response, or an Out Processing Request response
export function isInRequestItem(
  request: IRequestItem
): request is IInRequestItem {
  return request.reqType !== "Out"; // If it isn't an Out processing, then it must be In processing -- supports legacy records where "In" was not set
}
