import { ICheckListItem } from "api/CheckListItemApi";
import { spWebContext } from "providers/SPWebContext";
import { IInRequest } from "api/RequestApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { Person, useCurrentUser } from "api/UserApi";

const completeCheckListItem = (
  item: ICheckListItem,
  checklistItems: ICheckListItem[] | undefined,
  currentUser: Person
) => {
  const [batchedSP, execute] = spWebContext.batched();
  const batch = batchedSP.web.lists.getByTitle("CheckListItems");

  // Always add the current update to the batch
  batch.items.getById(item.Id).update({
    CompletedById: currentUser.Id,
    CompletedDate: DateTime.now().toISODate(),
  });

  // Find additional updates
  switch (item.TemplateId) {
    // Valid for testing only
    // Welcome Package 1 should enable TESTING ITEM -1
    case 1: //Testing only
      checklistItems?.forEach((element) => {
        if (element.TemplateId === -1) {
          batch.items.getById(element.Id).update({ Active: true });
        }
      });
      break;

    default:
      break;
  }
  return execute();
};

export const useCompleteChecklistItem = (item: ICheckListItem) => {
  const queryClient = useQueryClient();
  const checklistItems = queryClient.getQueryData<ICheckListItem[]>([
    "checklist",
    item.RequestId,
  ]);
  const currentUser = useCurrentUser();

  return useMutation(
    ["checklist", item.RequestId],
    (newRequest: IInRequest) => {
      if (process.env.NODE_ENV === "development") {
        // TODO: Find a better way to show this in nodejs dev environment
        return Promise.resolve();
      } else {
        return completeCheckListItem(item, checklistItems, currentUser);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["checklist"]);
      },
    }
  );
};
