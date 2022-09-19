import { spWebContext } from "../providers/SPWebContext";
import { ApiError } from "./InternalErrors";
import { DateTime } from "luxon";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "./UserApi";

export interface ICheckListItem {
  Id: number;
  Title: string;
  Lead: string; // TBD: better as role and/or person?
  CompletedDate?: DateTime;
  CompletedBy?: {
    Id: number | undefined;
    Title: string | undefined;
    EMail: string | undefined;
  };
  SortOrder?: number;
}

// create PnP JS response interface for the CheckListItems
// This extends the ICheckListItem, replacing elements with the types to match SharePoint fields
type IResponseItem = Omit<ICheckListItem, "CompletedDate"> & {
  // Storing the date objects in Single Line Text fields as ISOStrings
  CompletedDate: string;

  // CompletedBy is a Person field, and we request to expand it to retrieve Id, Title, and EMail
  CompletedBy?:
    | {
        Id: number | undefined;
        Title: string | undefined;
        EMail: string | undefined;
      }
    | undefined;
};

// Interface for sending an update to SharePoint for marking CheckListItem as complete
interface ISPCompleteCheckListItem {
  Id: number;
  CompletedDate: string;
  CompletedById: number;
}

/** CheckListItem Data for testing  */
let testCheckListItems: IResponseItem[] = [
  {
    Id: 1,
    Title: "First Item!",
    Lead: "Anakin Skywalker",
    CompletedDate: "2022-09-15",
    CompletedBy: {
      Id: 2,
      Title: "Default User 2",
      EMail: "defaultTEST2@us.af.mil",
    },
  },
  {
    Id: 2,
    Title: "Second Item!",
    Lead: "Obi-Wan Kenobi",
    CompletedDate: "",
    CompletedBy: undefined,
  },
];

// This is a listing of all fields to be returned with a CheckListItem
// Currently it is being used by all requests to SP, but can be updated as needed
// If we do make separate field requests, we should make a new type and transform functions
const requestedFields =
  "Id,Title,Lead,CompletedDate,CompletedBy/Id,CompletedBy/Title,CompletedBy/EMail";
const expandedFields = "CompletedBy";

/**
 * Directly map the incoming request to the IResponseItem to perform type
 * conversions and drop SharePoint added data that is not needed, and will
 * cause update errors
 */
const transformCheckListItemFromSP = (
  request: IResponseItem
): ICheckListItem => {
  return {
    Id: request.Id,
    Title: request.Title,
    Lead: request.Lead,
    CompletedDate: request.CompletedDate
      ? DateTime.fromISO(request.CompletedDate)
      : undefined,
    CompletedBy: request.CompletedBy ? request.CompletedBy : undefined,
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
const getItemsById = async (RequestId: number) => {
  if (process.env.NODE_ENV === "development") {
    await sleep(2000);
    return Promise.resolve(testCheckListItems);
  } else {
    try {
      const response: IResponseItem[] = await spWebContext.web.lists
        .getByTitle("CheckListItems")
        .items.filter("RequestId eq " + RequestId)
        .select(requestedFields)
        .expand(expandedFields)();
      return response;
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

/**
 * Gets the checklist items based on the checklist Id.
 *
 * @param RequestId The Id of the parent request to retrieve from SharePoint
 */
export const useChecklistItems = (RequestId: number) => {
  return useQuery({
    queryKey: ["checklist", RequestId],
    queryFn: () => getItemsById(RequestId),
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

/**
 * Submit the new role to SharePoint
 * Internal function used by the react-query useMutation
 *
 */
const completeCheckListItem = async (spRequest: ISPCompleteCheckListItem) => {
  if (process.env.NODE_ENV === "development") {
    await sleep();

    //Mutate checklistitems as we are mimicking the data being stored in SharePoint
    const checkListItemIndex = testCheckListItems.findIndex(
      (item) => item.Id === spRequest.Id
    );

    // TODO -- Perform a lookup to get the User's Info for Test
    testCheckListItems[checkListItemIndex].CompletedBy = {
      Id: spRequest.CompletedById,
      Title: "Default User",
      EMail: "me@example.com",
    };
    testCheckListItems[checkListItemIndex].CompletedDate =
      spRequest.CompletedDate;

    return Promise.resolve(spRequest);
  } else {
    await spWebContext.web.lists
      .getByTitle("CheckListItems")
      .items.getById(spRequest.Id)
      .update(spRequest);
  }
};

/**
 * Hook that returns 2 functions to be used for Role Management
 *
 */
export const useUpdateCheckListItem = (): {
  completeCheckListItem: (itemId: number) => void;
} => {
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();

  /** React Query Mutation used to Complete a CheckListItem */
  const completeCheckListItemMutation = useMutation(
    ["checklist"],
    completeCheckListItem,
    {
      // Always refetch after error or success:
      onSettled: () => {
        queryClient.invalidateQueries(["checklist"]);
      },
      onError: (error, variable) => {
        if (error instanceof Error) {
          throw new ApiError(
            error,
            `Error occurred while trying to complete checklist item ${variable}: ${error.message}`
          );
        } else if (typeof error === "string") {
          throw new ApiError(
            new Error(
              `Error occurred while trying to complete checklist item ${variable}: ${error}`
            )
          );
        } else {
          throw new ApiError(
            undefined,
            `Unknown error occurred while trying to complete checklist item ${variable}`
          );
        }
      },
    }
  );

  // Create a refence to the mutate function to pass to the component using this hook to mark the item as Complete
  const completeChecklistItem = (itemId: number) => {
    let spRequest: ISPCompleteCheckListItem = {
      Id: itemId,
      CompletedById: currentUser.Id,
      CompletedDate: DateTime.now().toISODate(),
    };
    return completeCheckListItemMutation.mutate(spRequest);
  };

  // Return object of functions that can be called
  return { completeCheckListItem: completeChecklistItem };
};
