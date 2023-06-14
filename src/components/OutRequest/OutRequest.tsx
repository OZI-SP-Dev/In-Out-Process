import { FunctionComponent } from "react";
import {
  Button,
  Textarea,
  Text,
  makeStyles,
  tokens,
  Tooltip,
  Spinner,
  Badge,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import { OutRequestViewCompact } from "components/OutRequest/OutRequestViewCompact";
import { OutRequestEditPanel } from "components/OutRequest/OutRequestEditPanel";
import { useBoolean } from "@fluentui/react-hooks";
import {
  IOutRequest,
  useCancelRequest,
  useCompleteRequest,
  useUpdateRequest,
} from "api/RequestApi";
import { RoleType } from "api/RolesApi";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  EditIcon,
  CancelIcon,
  CompletedIcon,
  AlertSolidIcon,
} from "@fluentui/react-icons-mdl2";
import { useChecklistItems } from "api/CheckListItemApi";
import { Dismiss24Regular } from "@fluentui/react-icons";

interface IOutRequestComp {
  request: IOutRequest;
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
    marginTop: ".25em",
    marginBottom: ".5em",
    display: "flex",
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    display: "block",
  },
});

export const OutRequest: FunctionComponent<IOutRequestComp> = (props) => {
  const classes = useStyles();

  const navigateTo = useNavigate();

  /** Get the checklist items associated with this request */
  const checklistItems = useChecklistItems(Number(props.request.Id));

  /** Number of checklist items still needing completed.  If we don't have the info yet, default to undefined */
  const checklistItemsToComplete = checklistItems.data
    ? checklistItems.data.filter((item) => !item.CompletedDate).length
    : undefined;

  /* Boolean state for determining whether or not the Edit Panel is shown */
  const [isEditPanelOpen, { setTrue: showEditPanel, setFalse: hideEditPanel }] =
    useBoolean(false);

  //** Is the Current User the Superviosr/Gov Lead of this Request */
  const isSupervisor = props.roles.includes(RoleType.SUPERVISOR);

  /* Hook to update this request */
  const updateRequest = useUpdateRequest(props.request.Id);

  /* Hook to cancel this request */
  const cancelRequest = useCancelRequest(props.request.Id);

  /* Hook to complete this request */
  const completeRequest = useCompleteRequest(props.request.Id);

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
  const updateType = isCancelDialogOpen ? "cancel" : "complete";

  const performCancel = (item: any) => {
    if (checklistItems.data) {
      cancelRequest.mutate(
        {
          request: props.request,
          tasks: checklistItems.data,
          reason: item.cancelReason,
        },
        {
          onSuccess: () => {
            // Close the cancel reason prompt
            hideCancelDialog();
            // Return the user to the Homepage
            navigateTo("/");
          },
        }
      );
    } else {
      // This shouldn't be reachable, as the Cancel button is disabled if there is no data, but if it is, then present message to user
      window.alert("Something has gone wrong.  Please refresh and try again.");
    }
  };

  /** Function to mark the Out Processing Request as Complete */
  const performComplete = () => {
    completeRequest.mutate(props.request);
  };

  return (
    <>
      {/* Only show the buttons to Supervisors -- and only show if it isn't Closed/Cancelled */}
      {isSupervisor && !props.request?.closedOrCancelledDate && (
        <div className={classes.supervisorButtonBar}>
          <Tooltip content={"Edit this request"} relationship={"description"}>
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
          </Tooltip>
          <Tooltip content={"Cancel this request"} relationship={"description"}>
            <Button
              appearance="subtle"
              onClick={showCancelDialog}
              icon={<CancelIcon />}
              shape="circular"
              size="small"
              disabled={updateRequest.isLoading || checklistItems.isLoading} // Disable if we are processing an update or don't have checklist item data yet
            >
              Cancel
            </Button>
          </Tooltip>
          {
            //Show a spinner if we are processing a "complete" request
            updateType === "complete" && updateRequest.isLoading ? (
              <Spinner size="extra-small" label="Completing..." />
            ) : (
              <>
                <Tooltip
                  content={
                    checklistItemsToComplete === 0
                      ? "Complete this request"
                      : "Cannot be completed until all checklist items have been completed"
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
                    Complete
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
          <Dialog open={!isCancelDialogOpen}>
            <DialogSurface>
              <form id="outReqForm" onSubmit={handleSubmit(performCancel)}>
                <DialogBody>
                  <DialogTitle
                    action={
                      <Button
                        appearance="subtle"
                        aria-label="close"
                        icon={<Dismiss24Regular />}
                        onClick={hideCancelDialog}
                      />
                    }
                  >
                    Provide a reason for the cancellation
                  </DialogTitle>
                  <DialogContent className={classes.formContainer}>
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
                  </DialogContent>
                  <DialogActions>
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
                  </DialogActions>
                </DialogBody>
              </form>
            </DialogSurface>
          </Dialog>
          <OutRequestEditPanel
            onEditSave={hideEditPanel}
            onEditCancel={hideEditPanel}
            isEditPanelOpen={isEditPanelOpen}
            data={props.request}
          />
        </div>
      )}
      <OutRequestViewCompact formData={props.request} />
    </>
  );
};
