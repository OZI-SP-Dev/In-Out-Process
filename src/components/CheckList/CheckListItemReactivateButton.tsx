import { ICheckListItem } from "api/CheckListItemApi";
import {
  Button,
  Tooltip,
  Spinner,
  Badge,
  Dialog,
  DialogTitle,
  DialogSurface,
  DialogContent,
  DialogActions,
  DialogBody,
} from "@fluentui/react-components";
import { useReactivateChecklistItem } from "api/ReactivateChecklistItem";
import { AlertSolidIcon } from "@fluentui/react-icons-mdl2";
import { useBoolean } from "@fluentui/react-hooks";
import { useEffect, useRef } from "react";

interface CheckListItemReactivateButtonProps {
  checklistItem: ICheckListItem;
}

export const CheckListItemReactivateButton = ({
  checklistItem,
}: CheckListItemReactivateButtonProps) => {
  const reactivateCheckListItem = useReactivateChecklistItem(checklistItem);

  /* Show the Reactivate Dialog or not */
  const [
    isReactivateDialogOpen,
    { setTrue: showReactivateDialog, setFalse: hideReactivateDialog },
  ] = useBoolean(false);

  // Ref to the cancel button so we can set focus to it by default
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // If the Reactivation dialog is opened, and the cancel button is on it, then set it to be the focused element
  useEffect(() => {
    if (isReactivateDialogOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isReactivateDialogOpen]);

  return (
    <>
      <Button
        name="reactivationButton"
        appearance="secondary"
        onClick={showReactivateDialog}
      >
        Reactivate
      </Button>
      <Dialog open={isReactivateDialogOpen} modalType="modal">
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Reactivate Checklist Item?</DialogTitle>
            <DialogContent>
              Are you sure you want to reactivate this checklist item, which
              clears when and by whom it was completed, requiring it to be
              recompleted?
            </DialogContent>
            <DialogActions>
              {!reactivateCheckListItem.isLoading ? (
                <Button
                  appearance="primary"
                  onClick={() => reactivateCheckListItem.mutate()}
                >
                  Yes, reactivate
                </Button>
              ) : (
                <Spinner
                  style={{ justifyContent: "flex-start" }}
                  size="small"
                  label="Reactivating..."
                />
              )}
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
                    icon={<AlertSolidIcon />}
                  />
                </Tooltip>
              )}
              <Button
                ref={cancelButtonRef}
                appearance="secondary"
                onClick={hideReactivateDialog}
              >
                No, take me back safely
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};
