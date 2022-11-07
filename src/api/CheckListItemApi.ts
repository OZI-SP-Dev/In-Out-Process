import { spWebContext } from "providers/SPWebContext";
import { ApiError } from "api/InternalErrors";
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
type IResponseItem = Omit<ICheckListItem, "CompletedDate" | "Lead"> & {
  // Storing the date objects in Single Line Text fields as ISOStrings
  CompletedDate: string;
  Lead: string;
};

// Declare testItems so it can be used if needed
let testCheckListItems: IResponseItem[] = [];

// Generate data for testing but only in the development environment
if (process.env.NODE_ENV === "development") {
  /** CheckListItem Data for testing  */
  testCheckListItems.push(
    {
      Id: 1,
      Title: "First Item!",
      Description:
        "<p>This is a sample description of a task.</p><p>It <b>CAN</b> contain <span style='color:#4472C4'>fancy</span> <span style='background:yellow'>formatting</span> to help deliver an <span    style='font-size:14.0pt;line-height:107%'>IMPACTFUL </span>message/</p>",
      Lead: "Admin",
      CompletedDate: "2022-09-15",
      CompletedBy: {
        Id: 2,
        Title: "Default User 2",
        EMail: "defaultTEST2@us.af.mil",
      },
      RequestId: 1,
      TemplateId: -1,
      Active: true,
    },
    {
      Id: 2,
      Title: "Second Item!",
      Description: "<p>This task should be able to be completed by IT</p>",
      Lead: "IT",
      CompletedDate: "",
      CompletedBy: undefined,
      RequestId: 1,
      TemplateId: -2,
      Active: true,
    },
    {
      Id: 3,
      Title: "Third Item!",
      Description:
        "<p>This task should be able to be completed by Supervisor</p>",
      Lead: "Supervisor",
      CompletedDate: "",
      CompletedBy: undefined,
      RequestId: 1,
      TemplateId: -3,
      Active: true,
    },
    {
      Id: 4,
      Title: "Fourth Item!",
      Description:
        "<p>This task should be able to be completed by Employee or Supervisor</p>",
      Lead: "Employee",
      CompletedDate: "",
      CompletedBy: undefined,
      RequestId: 1,
      TemplateId: -4,
      Active: false,
    }
  );

  var x = testCheckListItems.length;
  var numRoles = Object.keys(RoleType).length;
  const today = new Date();

  while (x++ < 1000) {
    // Should it have a Completed Date?
    let completedDate: string = "";
    const randomDayDiff = Math.floor(Math.random() * 14);
    let role: string;

    // Make a higher chance task is Employee/Supervisor so there is higher change of an open one for current user
    switch (Math.floor(Math.random() * 2)) {
      case 0:
        role = RoleType.EMPLOYEE;
        break;
      case 2:
        role = RoleType.SUPERVISOR;
        break;
      default:
        role =
          Object.values(RoleType)[
            Math.floor(Math.random() * (numRoles - 1)) + 1
          ];
    }

    // If it isn't 0 then let's make it that date -- 0 will be "Incomplete CheckListItem"
    if (randomDayDiff) {
      const newDate = new Date();
      newDate.setDate(today.getDate() - randomDayDiff);
      completedDate = newDate.toISOString();
    }

    testCheckListItems.push({
      Id: x,
      Title: `Example item ${x}`,
      Description: `<p>This is an auto generated sample checklist item</p>`,
      Lead: role,
      CompletedDate: completedDate,
      CompletedBy: completedDate
        ? {
            Id: 2,
            Title: "Default User 2",
            EMail: "defaultTEST2@us.af.mil",
          }
        : undefined,
      RequestId: Math.floor(Math.random() * 25) + 1,
      TemplateId: -5,
      Active: true,
    });
  }
}

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
  request: IResponseItem
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

const transformCheckListItemsFromSP = (
  checklistItems: IResponseItem[]
): ICheckListItem[] => {
  return checklistItems.map((item) => {
    return transformCheckListItemFromSP(item);
  });
};

/** Internal functions that actually do the fetching
 * @param RequestId The Id of the Request to retrieve CheckListItems from SharePoint
 * @returns The ICheckListItem for the given Id
 */
const getCheckListItemsByRequestId = async (RequestId: number) => {
  if (process.env.NODE_ENV === "development") {
    await sleep(2000);
    return Promise.resolve(
      testCheckListItems.filter((item) => item.RequestId === RequestId)
    );
  } else {
    try {
      return spWebContext.web.lists
        .getByTitle("CheckListItems")
        .items.filter("RequestId eq " + RequestId)
        .select(requestedFields)
        .expand(expandedFields)();
    } catch (e) {
      console.error(
        `Error occurred while trying to fetch CheckListeItems for RequestId ${RequestId}`
      );
      console.error(e);
      if (e instanceof Error) {
        throw new ApiError(
          e,
          `Error occurred while trying to fetch CheckListeItems for RequestId ${RequestId}: ${e.message}`
        );
      } else if (typeof e === "string") {
        throw new ApiError(
          new Error(
            `Error occurred while trying to fetch CheckListeItems for RequestId ${RequestId}: ${e}`
          )
        );
      } else {
        throw new ApiError(
          undefined,
          `Unknown error occurred while trying to fetch CheckListeItems for RequestId ${RequestId}`
        );
      }
    }
  }
};

/** Internal functions that actually do the fetching
 * @returns The ICheckListItems that are Open (do not have a completeion date) -- TODO -- Cancelled??
 */
const getOpenCheckListItems = async () => {
  if (process.env.NODE_ENV === "development") {
    await sleep(2000);
    return Promise.resolve(
      testCheckListItems.filter((item) => !item.CompletedDate)
    );
  } else {
    try {
      return spWebContext.web.lists
        .getByTitle("CheckListItems")
        .items.filter("CompletedDate eq null")
        .select(requestedFields)
        .expand(expandedFields)();
    } catch (e) {
      console.error(
        `Error occurred while trying to fetch Open CheckListeItems`
      );
      console.error(e);
      if (e instanceof Error) {
        throw new ApiError(
          e,
          `Error occurred while trying to fetch Open CheckListeItems: ${e.message}`
        );
      } else if (typeof e === "string") {
        throw new ApiError(
          new Error(
            `Error occurred while trying to fetch Open CheckListeItems: ${e}`
          )
        );
      } else {
        throw new ApiError(
          undefined,
          `Unknown error occurred while trying to fetch Open CheckListeItems`
        );
      }
    }
  }
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
