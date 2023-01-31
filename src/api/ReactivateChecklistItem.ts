import { ICheckListItem } from "api/CheckListItemApi";
import { spWebContext } from "providers/SPWebContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useReactivateChecklistItem = (item: ICheckListItem) => {
  const queryClient = useQueryClient();

  /** Function called by the React Query useMutation */
  const completeCheckListItem = () => {
    // Clear the CompletedBy and CompletedDate.
    // To clear a Person field in SharePoint we must pass and Id of -1 and a StringId of ""
    return spWebContext.web.lists
      .getByTitle("ChecklistItems")
      .items.getById(item.Id)
      .update({
        CompletedById: -1,
        CompletedByStringId: "",
        CompletedDate: null,
      });
  };

  return useMutation(["checklist", item.Id], completeCheckListItem, {
    onSuccess: () => {
      return queryClient.invalidateQueries(["checklist"]);
    },
  });
};
