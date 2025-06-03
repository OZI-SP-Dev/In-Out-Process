import { ICheckListItem } from "api/CheckListItemApi";
import { Button, Tooltip, Spinner, Badge } from "@fluentui/react-components";
import { useCompleteChecklistItem } from "api/CompleteChecklistItem";
import { useState } from "react";
import { AlertSolidIcon } from "@fluentui/react-icons-mdl2";
import { useIsMutating } from "@tanstack/react-query";
import { useBoolean } from "@fluentui/react-hooks";
import { UpdateEmployeeToPerson } from "components/UpdateEmployeeToPerson/UpdateEmployeeToPerson";
import { templates } from "api/CreateChecklistItems";
import { useNavigate } from "react-router-dom";

interface CheckListItemButtonProps {
  checklistItem: ICheckListItem;
  isPanelButton?: boolean;
  hasForcedNameAttached?: boolean;
}

export const CheckListItemButton = ({
  checklistItem,
  isPanelButton = false,
  hasForcedNameAttached = undefined,
}: CheckListItemButtonProps) => {
  const completeCheckListItem = useCompleteChecklistItem(checklistItem);
  const isMutating = useIsMutating({
    mutationKey: ["checklist", checklistItem.Id],
  });
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  /** Show the UpdateEmployeeToPerson Dialog or not */
  const [isDialogOpen, { setTrue: showDialog, setFalse: hideDialog }] =
    useBoolean(false);

  /** Function to perform upon clicking Complete button */
  const completeClick = () => {
    if (
      (checklistItem.TemplateId === templates.SupervisorCoord2875 ||
        checklistItem.TemplateId === templates.SecurityCoord2875 ||
        checklistItem.TemplateId === templates.ProvisionAFNET) &&
      !isPanelButton
    ) {
      // If we are one of the DD Form 2875 processing steps, then force them to complete within the Checklist Panel, so take them there if they aren't already there
      navigate(`/item/${checklistItem.RequestId}`, {
        state: { checklistItem: checklistItem.Id },
      });
    } else if (checklistItem.TemplateId === templates.ProvisionAFNET) {
      // If this is the Provision AFNET task, then prompt to ensure correct user from GAL is selected
      showDialog();
    } else {
      // Complete the checklst item
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
        content={
          !checklistItem.Active
            ? "This item requires another item to be completed first."
            : "You must upload the required file to complete this task"
        }
        relationship="description"
        visible={
          (!checklistItem.Active ||
            (isPanelButton && hasForcedNameAttached === false)) &&
          visible
        }
        onVisibleChange={(_ev, data) => setVisible(data.visible)}
      >
        <Button
          appearance="primary"
          onClick={completeClick}
          disabledFocusable={
            !checklistItem.Active ||
            (isPanelButton && hasForcedNameAttached === false) // If they haven't uploaded a file when we force a naming convention on this checkist item
          }
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
