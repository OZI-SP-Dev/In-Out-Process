import { spWebContext } from "providers/SPWebContext";
import { DateTime } from "luxon";
import { useQuery } from "@tanstack/react-query";
import { IPerson, Person } from "api/UserApi";
import { RoleType } from "api/RolesApi";
export interface ICheckListItem {
  Id: number;
  Title: string;
  Description: string;
  Lead: RoleType;
  CompletedDate?: DateTime;
  CompletedBy?: IPerson;
  SortOrder?: number;
  RequestId: number;
  TemplateId: number;
  Active: boolean;
}

// create PnP JS response interface for the CheckListItems
// This extends the ICheckListItem, replacing elements with the types to match SharePoint fields
export type ICheckListResponseItem = Omit<
  ICheckListItem,
  "CompletedDate" | "Lead"
> & {
  // Storing the date objects in Single Line Text fields as ISOStrings
  CompletedDate: string;
  Lead: string;
};

// This is a listing of all fields to be returned with a CheckListItem
// Currently it is being used by all requests to SP, but can be updated as needed
// If we do make separate field requests, we should make a new type and transform functions
const requestedFields =
  "Id,Title,Description,Lead,CompletedDate,CompletedBy/Id,CompletedBy/Title,CompletedBy/EMail,RequestId,TemplateId,Active";
const expandedFields = "CompletedBy";

/**
 * Directly map the incoming request to the IResponseItem to perform type
 * conversions and drop SharePoint added data that is not needed, and will
 * cause update errors
 */
const transformCheckListItemFromSP = (
  request: ICheckListResponseItem
): ICheckListItem => {
  let lead: RoleType;
  if (Object.values(RoleType).includes(request.Lead as RoleType)) {
    lead = request.Lead as RoleType;
  } else {
    // If the Lead specified in the record doesn't exist on our mapping -- make the Lead ADMIN
    lead = RoleType.ADMIN;
  }

  return {
    Id: request.Id,
    Title: request.Title,
    Description: request.Description,
    Lead: lead,
    CompletedDate: request.CompletedDate
      ? DateTime.fromISO(request.CompletedDate)
      : undefined,
    CompletedBy: request.CompletedBy
      ? new Person({
          Id: request.CompletedBy.Id,
          Title: request.CompletedBy.Title,
          EMail: request.CompletedBy.EMail,
        })
      : undefined,
    RequestId: request.RequestId,
    TemplateId: request.TemplateId,
    Active: request.Active,
  };
};

export const transformCheckListItemsFromSP = (
  checklistItems: ICheckListResponseItem[]
): ICheckListItem[] => {
  return checklistItems.map((item) => {
    return transformCheckListItemFromSP(item);
  });
};

/** Internal functions that actually do the fetching
 * @param RequestId The Id of the Request to retrieve CheckListItems from SharePoint
 * @returns The ICheckListItem for the given Id
 */
export const getCheckListItemsByRequestId = async (RequestId: number) => {
  return spWebContext.web.lists
    .getByTitle("CheckListItems")
    .items.filter("RequestId eq " + RequestId)
    .select(requestedFields)
    .expand(expandedFields)();
};

/** Internal functions that actually do the fetching
 * @returns The ICheckListItems that are Open (do not have a completeion date) -- TODO -- Cancelled??
 */
const getOpenCheckListItems = async () => {
  return spWebContext.web.lists
    .getByTitle("CheckListItems")
    .items.filter("CompletedDate eq null")
    .select(requestedFields)
    .expand(expandedFields)
    .top(5000)();
};

/**
 * Gets open and completed checklist items for current user's roles
 * Currently unable to filter specifically for where user is the Supervisor or Employee
 * @returns ICheckListItems
 */
const getMyCheckListItems = async (user: Person, roles: RoleType[]) => {
  // Currently returns data for all items where Lead is superivor or employee
  // Module using this function then filters for the correct supervisor/employee
  let filter = "Lead eq 'Supervisor' or Lead eq 'Employee'";

  roles.forEach((role) => {
    filter += " or Lead eq '" + role + "'";
  });

  return spWebContext.web.lists
    .getByTitle("CheckListItems")
    .items.orderBy("Created", false)
    .filter(filter)
    .select(requestedFields)
    .expand(expandedFields)
    .top(5000)();
};

/**
 * Gets the checklist items associated with the RequestId
 *
 * @param RequestId The Id of the parent request to retrieve from SharePoint
 */
export const useChecklistItems = (RequestId: number) => {
  return useQuery({
    queryKey: ["checklist", RequestId],
    queryFn: () => getCheckListItemsByRequestId(RequestId),
    select: transformCheckListItemsFromSP,
  });
};

/**
 * Gets the open checklist items -- right now this is determined by the Completion Date being empty -- but this is NOT accurate b/c of Cancelled Requests
 * TODO -- Update how cancelled checklist items are handled
 *
 */
export const useOpenChecklistItems = () => {
  return useQuery({
    queryKey: ["checklist"],
    queryFn: () => getOpenCheckListItems(),
    select: transformCheckListItemsFromSP,
  });
};

/**
 * Gets all checklist items for the current user
 */
export const useMyChecklistItems = (
  user: Person,
  roles: RoleType[],
  fetchCompleted: boolean
) => {
  return useQuery({
    queryKey: fetchCompleted ? ["myChecklist", user, roles] : ["checklist"],
    queryFn: () =>
      fetchCompleted
        ? getMyCheckListItems(user, roles)
        : getOpenCheckListItems(),
    select: transformCheckListItemsFromSP,
  });
};
