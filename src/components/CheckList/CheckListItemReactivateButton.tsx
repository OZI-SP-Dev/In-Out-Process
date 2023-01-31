import { ICheckListItem } from "api/CheckListItemApi";
import { Button, Tooltip, Spinner, Badge } from "@fluentui/react-components";
import { useReactivateChecklistItem } from "api/ReactivateChecklistItem";
import { AlertSolidIcon } from "@fluentui/react-icons-mdl2";
import { useIsMutating } from "@tanstack/react-query";

interface CheckListItemReactivateButtonProps {
  checklistItem: ICheckListItem;
}

export const CheckListItemReactivateButton = ({
  checklistItem,
}: CheckListItemReactivateButtonProps) => {
  const reactivateCheckListItem = useReactivateChecklistItem(checklistItem);
  const isMutating = useIsMutating({
    mutationKey: ["checklist", checklistItem.Id],
  });

  // Because this button may be clicked, then the panel changed to another completed task
  // we cannot use .isLoading because will be true if ANY item is currently using this mutation
  // by using useIsMutating we can look for a specific mutation key
  if (isMutating > 0) {
    return (
      <Spinner
        style={{ justifyContent: "flex-start" }}
        size="small"
        label="Reactivating..."
      />
    );
  }

  return (
    <>
      <Button
        name="reactivationButton"
        appearance="secondary"
        onClick={() => reactivateCheckListItem.mutate()}
      >
        Reactivate
      </Button>
      {reactivateCheckListItem.isError && (
        <Tooltip
          content={
            reactivateCheckListItem.error instanceof Error
              ? reactivateCheckListItem.error.message
              : "An error occurred."
          }
          relationship="label"
        >
          <Badge
            size="extra-large"
            appearance="ghost"
            color="danger"
            style={{ verticalAlign: "middle" }}
            icon={<AlertSolidIcon />}
          />
        </Tooltip>
      )}
    </>
  );
};
