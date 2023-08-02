import {
  Button,
  Text,
  Spinner,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  makeStyles,
  tokens,
  Tooltip,
  Badge,
  Label,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { Controller, useForm } from "react-hook-form";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { Person } from "api/UserApi";
import { useRequest, useUpdateEmployeeToPerson } from "api/RequestApi";
import { useEffect } from "react";
import { AlertSolidIcon } from "@fluentui/react-icons-mdl2";

interface UpdateEmployeeToPersonProps {
  /** The ID of the Request that will be updated */
  requestId: number;
  /** Function to be called when the update has occurred */
  completeAction: () => void;
  /** Function to be called when the update is cancelled/closed without action */
  cancelAction: () => void;
}

/* FluentUI Styling */
const useStyles = makeStyles({
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    display: "block",
  },
});

/** React Hook Form (RHF) values */
interface IPersonForm {
  /** The user object returned by RHF */ user: Person;
}

export const UpdateEmployeeToPerson = ({
  requestId,
  completeAction,
  cancelAction,
}: UpdateEmployeeToPersonProps) => {
  const classes = useStyles();
  const request = useRequest(requestId);
  const updateEmp = useUpdateEmployeeToPerson(requestId);

  /* React Hook Form for the Impersonation Dialog box */
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<IPersonForm>();

  /**
   * Take the form data, and call API to update Request, then proceed on success to Complete the task
   *
   * @param data The RHF data, or undefined
   * @returns a void Promise
   */
  const performPersonUpdate = async (data: IPersonForm) => {
    if (isDirty) {
      updateEmp.mutate(
        data.user,
        { onSuccess: completeAction }
      );
    } else {
      // If it was prepopulated then don't update
      completeAction();
    }
  };

  // effect runs when employee is retrieved to prepopulate if there is a Employee already assigned
  useEffect(() => {
    // reset form with user data
    reset({ user: request.data?.employee });
  }, [request.data?.employee]);

  return (
    <>
      <Dialog open={true}>
        <DialogSurface aria-describedby="personDialog">
          <form id="personForm" onSubmit={handleSubmit(performPersonUpdate)}>
            <DialogBody>
              <DialogTitle
                action={
                  <Button
                    appearance="subtle"
                    aria-label="close"
                    icon={<Dismiss24Regular />}
                    onClick={cancelAction}
                  />
                }
              >
                Confirm/update employee GAL entry
              </DialogTitle>
              <DialogContent id="personDialog">
                <div>
                  <Label htmlFor="empName" weight="semibold">
                    Employee:{" "}
                  </Label>
                  <Text id="empName">{request.data?.empName}</Text>
                  <br />
                  <br />
                  <Controller
                    name="user"
                    control={control}
                    rules={{
                      required: "You must select a user",
                    }}
                    render={({ field: { onChange, value } }) => (
                      <PeoplePicker
                        ariaLabel="Employee GAL"
                        aria-describedby="userErr"
                        selectedItems={value}
                        updatePeople={(items) => {
                          if (items?.[0]) {
                            onChange(items[0]);
                          } else {
                            onChange([]);
                          }
                        }}
                      />
                    )}
                  />
                  {errors.user && (
                    <Text id="userErr" className={classes.errorText}>
                      {errors.user.message}
                    </Text>
                  )}
                </div>
              </DialogContent>
              <DialogActions>
                {updateEmp.isLoading ? (
                  <Spinner
                    style={{ justifyContent: "flex-start" }}
                    size="small"
                    label="Saving..."
                  />
                ) : (
                  <Button appearance="primary" type="submit">
                    OK
                  </Button>
                )}
                {updateEmp.isError && (
                  <Tooltip
                    content={
                      updateEmp.error instanceof Error
                        ? updateEmp.error.message
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
                  appearance="secondary"
                  onClick={() => {
                    cancelAction();
                  }}
                  disabled={updateEmp.isLoading}
                >
                  Cancel
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </DialogSurface>
      </Dialog>
    </>
  );
};
