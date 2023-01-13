import {
  getCheckListItemsByRequestId,
  ICheckListItem,
  transformCheckListItemsFromSP,
} from "api/CheckListItemApi";
import { spWebContext } from "providers/SPWebContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DateTime } from "luxon";
import { Person } from "api/UserApi";
import { checklistTemplates } from "api/CreateChecklistItems";
import { useEmail } from "hooks/useEmail";
import { RoleType } from "api/RolesApi";
import { useContext } from "react";
import { UserContext } from "providers/UserProvider";

const completeCheckListItem = (
  item: ICheckListItem,
  checklistItems: ICheckListItem[],
  currentUser: Person,
  sendActivationEmails: (
    activatedTasksByRole: Map<RoleType, ICheckListItem[]>,
    allChecklistItems: ICheckListItem[],
    completedChecklistItemId: number
  ) => Promise<void[]>
) => {
  const [batchedSP, execute] = spWebContext.batched();
  const batch = batchedSP.web.lists.getByTitle("CheckListItems");
  let activatedTasksByRole: Map<RoleType, ICheckListItem[]> = new Map();

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
      (item2) =>
        item.TemplateId !== item2.TemplateId && // Ensure we aren't looking at the item we just completed
        rule.Prereqs.includes(item2.TemplateId) && // Is this item part of the prereqs for this particular item to become active
        !item2.CompletedBy // If it is, and it isn't completed, then flag we have an item that still needs completed for this item
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
    sendActivationEmails(activatedTasksByRole, checklistItems, item.Id);
  }
  return execute();
};

export const useCompleteChecklistItem = (item: ICheckListItem) => {
  const queryClient = useQueryClient();
  const currentUser = useContext(UserContext).user;
  const email = useEmail();
  let checklistItems: ICheckListItem[];

  return useMutation(
    ["checklist", item.Id],
    () => {
      return completeCheckListItem(
        item,
        checklistItems,
        currentUser,
        email.sendActivationEmails
      );
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
