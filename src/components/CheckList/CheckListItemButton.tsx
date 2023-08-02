import { ICheckListItem } from "api/CheckListItemApi";
import { Button, Tooltip, Spinner, Badge } from "@fluentui/react-components";
import { useCompleteChecklistItem } from "api/CompleteChecklistItem";
import { useState } from "react";
import { AlertSolidIcon } from "@fluentui/react-icons-mdl2";
import { useIsMutating } from "@tanstack/react-query";
import { useBoolean } from "@fluentui/react-hooks";
import { UpdateEmployeeToPerson } from "components/UpdateEmployeeToPerson/UpdateEmployeeToPerson";
import { templates } from "api/CreateChecklistItems";

interface CheckListItemButtonProps {
  checklistItem: ICheckListItem;
}

export const CheckListItemButton = ({
  checklistItem,
}: CheckListItemButtonProps) => {
  const completeCheckListItem = useCompleteChecklistItem(checklistItem);
  const isMutating = useIsMutating({
    mutationKey: ["checklist", checklistItem.Id],
  });
  const [visible, setVisible] = useState(false);

  /** Show the UpdateEmployeeToPerson Dialog or not */
  const [isDialogOpen, { setTrue: showDialog, setFalse: hideDialog }] =
    useBoolean(false);

  /** Function to perform upon clicking Complete button */
  const completeClick = () => {
    if (checklistItem.TemplateId === templates.ProvisionAFNET) {
      showDialog();
    } else {
      completeCheckListItem.mutate();
    }
  };

  /** Function to perform if it is the AFNET task */
  const completeAction = () => {
    completeCheckListItem.mutate();
    hideDialog();
  };

  // Because this button may be used more than once on a screen we can't use .isLoading
  // .isLoading will be true if ANY item is currently using this mutation
  // by using useIsMutating we can look for a specific mutation key
  if (isMutating > 0) {
    return (
      <Spinner
        style={{ justifyContent: "flex-start" }}
        size="small"
        label="Saving..."
      />
    );
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
          onClick={completeClick}
          disabledFocusable={!checklistItem.Active}
        >
          Complete
        </Button>
      </Tooltip>{" "}
      {completeCheckListItem.isError && (
        <Tooltip
          content={
            completeCheckListItem.error instanceof Error
              ? completeCheckListItem.error.message
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
      {isDialogOpen && (
        <UpdateEmployeeToPerson
          requestId={checklistItem.RequestId}
          completeAction={completeAction}
          cancelAction={hideDialog}
        ></UpdateEmployeeToPerson>
      )}
    </>
  );
};
