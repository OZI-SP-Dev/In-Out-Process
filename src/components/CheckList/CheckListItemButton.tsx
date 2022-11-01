import { ICheckListItem } from "api/CheckListItemApi";
import { Button } from "@fluentui/react-components";
import { RoleType } from "api/RolesApi";
import { useRequest } from "api/RequestApi";
import { useCompleteChecklistItem } from "api/CompleteChecklistItem";

export const CheckListItemButton = (
  checklistItem: ICheckListItem,
  roles: RoleType[]
) => {
  const request = useRequest(checklistItem.RequestId);
  const completeCheckListItem = useCompleteChecklistItem(checklistItem);

  if (checklistItem.CompletedDate) {
    return <>{checklistItem.CompletedDate?.toFormat("yyyy-MM-dd")}</>;
  }

  if (completeCheckListItem.isLoading) {
    return <>Saving...</>;
  }

  return (
    <>
      {
        // Show the button to complete if they are the proper role AND the request is Active
        roles?.includes(checklistItem.Lead) &&
          request.data?.status === "Active" &&
          checklistItem.Active && (
            <Button
              appearance="primary"
              onClick={() => completeCheckListItem.mutate()}
            >
              Complete
            </Button>
          )
      }
    </>
  );
};
