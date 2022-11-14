import { FunctionComponent } from "react";
import {
  Button,
  FluentProvider,
  Textarea,
  Text,
  makeStyles,
  tokens,
  Tooltip,
  Spinner,
  Badge,
} from "@fluentui/react-components";
import { InRequestViewCompact } from "components/InRequest/InRequestViewCompact";
import { InRequestEditPanel } from "components/InRequest/InRequestEditPanel";
import { useBoolean } from "@fluentui/react-hooks";
import { IInRequest, useUpdateRequest } from "api/RequestApi";
import { RoleType } from "api/RolesApi";
import { Dialog, DialogFooter, DialogType } from "@fluentui/react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  EditIcon,
  CancelIcon,
  CompletedIcon,
  AlertSolidIcon,
} from "@fluentui/react-icons-mdl2";
import { useChecklistItems } from "api/CheckListItemApi";

interface IInRequestComp {
  request: IInRequest;
  roles: RoleType[];
}

// Fields to be used by the React Hook Form
type CancelDialogForm = {
  cancelReason: string;
};

/* FluentUI Styling */
const useStyles = makeStyles({
  formContainer: { display: "grid" },
  supervisorButtonBar: {
    marginTop: "-.75em",
    marginBottom: ".5em",
    paddingLeft: ".75em",
    display: "flex",
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    display: "block",
  },
});

export const InRequest: FunctionComponent<IInRequestComp> = (props) => {
  const classes = useStyles();

  const navigateTo = useNavigate();

  /** Get the checklist items associated with this request */
  const checlistItems = useChecklistItems(Number(props.request.Id));

  /** Number of checklist items still needing completed.  If we don't have the info yet, default to undefined */
  const checklistItemsToComplete = checlistItems.data
    ? checlistItems.data.filter((item) => !item.CompletedDate).length
    : undefined;

  /* Boolean state for determining whether or not the Edit Panel is shown */
  const [isEditPanelOpen, { setTrue: showEditPanel, setFalse: hideEditPanel }] =
    useBoolean(false);

  //** Is the Current User the Superviosr/Gov Lead of this Request */
  const isSupervisor = props.roles.includes(RoleType.SUPERVISOR);

  /* Hook to update this request */
  const updateRequest = useUpdateRequest(props.request.Id);

  /* The form inside the Cancel Dialog to collect a reason for cancellation */
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelDialogForm>();

  /* Show the Cancel Dialog or not */
  const [
    isCancelDialogOpen,
    { setTrue: hideCancelDialog, setFalse: showCancelDialog },
  ] = useBoolean(true);

  /** The type of the most recent update.  If cancel dialog is open, we know it is a cancel, if it isn't we know it is a complete.
   *  Note: You MUST pair this with a check of the updateRequest as this defaults to "complete" - so doesn't indicate a "complete" request
   *   was processed without checking if updateRequest.isError, isSuccess, etc.
   */
  const updateType: "cancel" | "complete" = isCancelDialogOpen
    ? "cancel"
    : "complete";

  const performCancel = (item: any) => {
    let updateItem = {
      ...props.request, // Create the update object based on the Current Request,
      ...item, // Add in the Cancellation Reason from the React Hook From
      closedOrCancelledDate: new Date(), // Add in that it occurred today
    };

    updateRequest.mutate(updateItem, {
      onSuccess: () => {
        // Close the cancel reason prompt
        hideCancelDialog();
        // Return the user to the Homepage
        navigateTo("/");
      },
    });
  };

  /** Function to mark the In Processing Request as Complete */
  const performComplete = () => {
    let updateItem = {
      ...props.request, // Create the update object based on the Current Request,
      closedOrCancelledDate: new Date(), // Add in that it occurred today
    };
    updateRequest.mutate(updateItem);
  };

  return (
    <>
      {/* Only show the buttons to Supervisors -- and only show if it isn't Closed/Cancelled */}
      {isSupervisor && !props.request?.closedOrCancelledDate && (
        <div className={classes.supervisorButtonBar}>
          <Button
            appearance="subtle"
            onClick={showEditPanel}
            icon={<EditIcon />}
            shape="circular"
            size="small"
            disabled={updateRequest.isLoading} // Disable if we are processing an update
          >
            Edit
          </Button>
          <Button
            appearance="subtle"
            onClick={showCancelDialog}
            icon={<CancelIcon />}
            shape="circular"
            size="small"
            disabled={updateRequest.isLoading} // Disable if we are processing an update
          >
            Cancel Request
          </Button>

          {
            //Show a spinner if we are processing a "complete" request
            updateType === "complete" && updateRequest.isLoading ? (
              <Spinner size="extra-small" label="Completing..." />
            ) : (
              <>
                <Tooltip
                  content={
                    checklistItemsToComplete !== 0
                      ? "Cannot be marked complete until all checklist items have been completed"
                      : "Mark this request as complete"
                  }
                  relationship={"description"}
                >
                  <Button
                    appearance="subtle"
                    onClick={performComplete}
                    icon={<CompletedIcon />}
                    shape="circular"
                    size="small"
                    // Disable if there are still items to complete (or we don't have the data yet) or we are processing an update
                    disabled={
                      checklistItemsToComplete !== 0 || updateRequest.isLoading
                    }
                  >
                    Mark Complete
                  </Button>
                </Tooltip>
                {
                  // If the last update request type was "complete" and we ran into an error
                  updateType === "complete" && updateRequest.isError && (
                    <Tooltip
                      content={
                        updateRequest.error instanceof Error
                          ? updateRequest.error.message
                          : "An error occurred."
                      }
                      relationship="label"
                    >
                      <Badge
                        size="large"
                        appearance="ghost"
                        color="danger"
                        icon={<AlertSolidIcon />}
                      />
                    </Tooltip>
                  )
                }
              </>
            )
          }
          <Dialog
            hidden={isCancelDialogOpen}
            modalProps={{
              isBlocking: true,
            }}
            onDismiss={hideCancelDialog}
            dialogContentProps={{
              type: DialogType.normal,
              title: "Provide a reason for the cancellation",
            }}
          >
            <FluentProvider>
              <form
                id="inReqForm"
                onSubmit={handleSubmit(performCancel)}
                className={classes.formContainer}
              >
                <Controller
                  name="cancelReason"
                  defaultValue=""
                  control={control}
                  rules={{
                    required: "Reason is required",
                    pattern: {
                      value: /\S/i,
                      message: "Reason is required",
                    },
                  }}
                  render={({ field }) => (
                    <Textarea
                      {...field}
                      placeholder="Provide a reason for the cancelling of this request"
                      aria-label="Reason for cancellation"
                      aria-describedby="reasonErr"
                    />
                  )}
                />
                {errors.cancelReason && (
                  <Text id="reasonErr" className={classes.errorText}>
                    {errors.cancelReason.message}
                  </Text>
                )}
                <DialogFooter>
                  {updateType === "cancel" && updateRequest.isLoading ? (
                    <Button appearance="transparent">
                      <Spinner
                        as="div"
                        size="extra-small"
                        label="Cancelling..."
                      />
                    </Button>
                  ) : (
                    <>
                      <Button appearance="primary" type="submit">
                        OK
                      </Button>
                      {updateType === "cancel" && updateRequest.isError && (
                        <Tooltip
                          content={
                            updateRequest.error instanceof Error
                              ? updateRequest.error.message
                              : "An error occurred."
                          }
                          relationship="label"
                        >
                          <Badge
                            size="large"
                            appearance="ghost"
                            color="danger"
                            icon={<AlertSolidIcon />}
                          />
                        </Tooltip>
                      )}
                    </>
                  )}
                  <Button
                    appearance="secondary"
                    disabled={updateRequest.isLoading}
                    onClick={hideCancelDialog}
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </form>
            </FluentProvider>
          </Dialog>
          <InRequestEditPanel
            onEditSave={hideEditPanel}
            onEditCancel={hideEditPanel}
            isEditPanelOpen={isEditPanelOpen}
            data={props.request}
          />
        </div>
      )}
      <InRequestViewCompact formData={props.request} />
    </>
  );
};
