import { ICheckListItem } from "api/CheckListItemApi";
import { Button } from "@fluentui/react-components";
import { useCompleteChecklistItem } from "api/CompleteChecklistItem";

interface CheckListItemButtonProps {
  checklistItem: ICheckListItem;
}

export const CheckListItemButton = ({
  checklistItem,
}: CheckListItemButtonProps) => {
  const completeCheckListItem = useCompleteChecklistItem(checklistItem);

  // Utilize both isLoading and isSuccess
  // This removes button until query cache is updated
  if (completeCheckListItem.isLoading || completeCheckListItem.isSuccess) {
    return <>Saving...</>;
  }

  return (
    <Button
      appearance="primary"
      onClick={() => completeCheckListItem.mutate()}
      disabledFocusable={!checklistItem.Active}
    >
      Complete
    </Button>
  );
};
