import { ICheckListItem } from "api/CheckListItemApi";
import { Button, Tooltip } from "@fluentui/react-components";
import { useCompleteChecklistItem } from "api/CompleteChecklistItem";
import { useState } from "react";

interface CheckListItemButtonProps {
  checklistItem: ICheckListItem;
}

export const CheckListItemButton = ({
  checklistItem,
}: CheckListItemButtonProps) => {
  const completeCheckListItem = useCompleteChecklistItem(checklistItem);
  const [visible, setVisible] = useState(false);

  // Utilize both isLoading and isSuccess
  // This removes button until query cache is updated
  if (completeCheckListItem.isLoading || completeCheckListItem.isSuccess) {
    return <>Saving...</>;
  }

  return (
    <>
      <Tooltip
        content="This item requires another item to be completed first."
        relationship="description"
        visible={!checklistItem.Active && visible}
        onVisibleChange={(_ev, data) => setVisible(data.visible)}
      >
        <Button
          appearance="primary"
          onClick={() => completeCheckListItem.mutate()}
          disabledFocusable={!checklistItem.Active}
        >
          Complete
        </Button>
      </Tooltip>
      {completeCheckListItem.isError && <>{completeCheckListItem.error}</>}
    </>
  );
};
