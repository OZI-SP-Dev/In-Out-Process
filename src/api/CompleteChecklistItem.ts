import {
  getCheckListItemsByRequestId,
  ICheckListItem,
  transformCheckListItemsFromSP,
} from "api/CheckListItemApi";
import { spWebContext } from "providers/SPWebContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { Person, useCurrentUser } from "api/UserApi";
import { templates } from "api/CreateChecklistItems";

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
    case templates.ObtainCACGov:
    case templates.ObtainCACCtr:
      //Activate the myLearning and myETMS tasks if we are completing one of the 2 different CAC tasks
      checklistItems?.forEach((element) => {
        if (element.TemplateId === templates.VerifyMyLearn) {
          batch.items.getById(element.Id).update({ Active: true });
        }
        if (element.TemplateId === templates.VerifyMyETMS) {
          batch.items.getById(element.Id).update({ Active: true });
        }
      });

      break;
    case templates.InstallationInProcess:
      //Activate the Obtain CAC (Mil/Civ) task
      checklistItems?.forEach((element) => {
        if (element.TemplateId === templates.ObtainCACGov) {
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
  const currentUser = useCurrentUser();
  let checklistItems: ICheckListItem[];

  return useMutation(
    ["checklist", item.Id],
    () => {
      return completeCheckListItem(item, checklistItems, currentUser);
    },
    {
      onMutate: async () => {
        const checklistItemsTemp = await queryClient.fetchQuery(
          ["checklist", item.RequestId],
          () => getCheckListItemsByRequestId(item.RequestId)
        );
        checklistItems = transformCheckListItemsFromSP(checklistItemsTemp);
      },
      onSuccess: () => {
        return queryClient.invalidateQueries(["checklist"]);
      },
    }
  );
};
