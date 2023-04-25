import {
  getCheckListItemsByRequestId,
  ICheckListItem,
  transformCheckListItemsFromSP,
} from "api/CheckListItemApi";
import { spWebContext } from "providers/SPWebContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { checklistTemplates } from "api/CreateChecklistItems";
import {
  useSendActivationEmails,
  useSendInRequestVerifyCompleteEmail,
} from "api/EmailApi";
import { RoleType } from "api/RolesApi";
import { useContext } from "react";
import { UserContext } from "providers/UserProvider";

export const useCompleteChecklistItem = (item: ICheckListItem) => {
  const queryClient = useQueryClient();
  const currentUser = useContext(UserContext).user;
  const { mutate: sendActivationEmails } = useSendActivationEmails(item.Id);
  const { mutate: sendInRequestVerifyCompleteEmail } =
    useSendInRequestVerifyCompleteEmail(item.RequestId);

  let checklistItems: ICheckListItem[];

  /** Function called by the React Query useMutation */
  const completeCheckListItem = () => {
    const [batchedSP, execute] = spWebContext.batched();
    const batch = batchedSP.web.lists.getByTitle("CheckListItems");
    let activatedTasksByRole: Map<RoleType, ICheckListItem[]> = new Map();

    /**
     * Add the item to the batch to go to SharePoint, and to the object
     * to go to the Notification function
     *
     * @param item The CheckListItem to be activated
     */
    const addChecklistItemActivated = (item: ICheckListItem) => {
      const leadItems = activatedTasksByRole.get(item.Lead);
      if (leadItems) {
        leadItems.push(item);
      } else {
        activatedTasksByRole.set(item.Lead, [item]);
      }
      batch.items.getById(item.Id).update({ Active: true });
    };

    // Always add the current update to the batch
    batch.items.getById(item.Id).update({
      CompletedById: currentUser.Id,
      CompletedDate: DateTime.now().toISODate(),
    });

    // Locate those items that have this item as a prereq
    const preqs = checklistTemplates.filter((templ) =>
      templ.Prereqs.includes(item.TemplateId)
    );

    // If we found some, examine each to see if we met all the prereqs for that item
    preqs.forEach((rule) => {
      const needCompleting = checklistItems.filter(
        (checklistItem) =>
          item.TemplateId !== checklistItem.TemplateId && // Ensure we aren't looking at the item we just completed
          rule.Prereqs.includes(checklistItem.TemplateId) && // Is this item part of the prereqs for this particular item to become active
          !checklistItem.CompletedBy // If it is, and it isn't completed, then flag we have an item that still needs completed for this item
      );

      // If this item has no more more prereqs, then add it to the list to become activated
      if (needCompleting.length === 0) {
        const item = checklistItems.find(
          (item) => rule.TemplateId === item.TemplateId
        );
        if (item) {
          addChecklistItemActivated(item);
        }
      }
    });

    // If we activated any checklist items, then send out appropriate notifications
    if (activatedTasksByRole.size > 0) {
      sendActivationEmails({
        activatedChecklistItems: activatedTasksByRole,
        allChecklistItems: checklistItems,
      });
    } else {
      // If we didn't activate any, is it the last item?
      const needCompleted = checklistItems.filter(
        (checklistItem) =>
          item.TemplateId !== checklistItem.TemplateId && // Ensure we aren't looking at the item we just completed
          !checklistItem.CompletedBy // If it isn't completed, then flag we have an item that still needs completed for this request
      );

      // If there are not any checklist items remaining, then send the notification
      if (needCompleted.length === 0) {
        sendInRequestVerifyCompleteEmail();
      }
    }
    return execute();
  };

  return useMutation(["checklist", item.Id], completeCheckListItem, {
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
  });
};
