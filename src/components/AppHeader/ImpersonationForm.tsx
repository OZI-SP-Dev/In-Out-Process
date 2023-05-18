import {
  Text,
  makeStyles,
  Button,
  DialogSurface,
  DialogBody,
  DialogContent,
  DialogActions,
  DialogTitle,
  Dialog,
} from "@fluentui/react-components";
import { useContext } from "react";
import { UserContext } from "providers/UserProvider";
import { tokens } from "@fluentui/react-theme";
import { useBoolean } from "@fluentui/react-hooks";
import { Controller, useForm } from "react-hook-form";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { spWebContext } from "providers/SPWebContext";
import { Person } from "api/UserApi";
import { Dismiss24Regular } from "@fluentui/react-icons";

// TODO - Investigate why the Popover showing roles doesn't disappear when Dialog opens

/* FluentUI Styling */
const useStyles = makeStyles({
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    display: "block",
  },
});

/** React Hook Form (RHF) values */
interface IImpersonateForm {
  /** The user object returned by RHF */ user: Person;
}
/** Component that displays a button to enable Impersonation
 *  Upon clicking, it prompts the user to select the appropriate impersonation action
 */
export const ImpersonationForm = () => {
  const classes = useStyles();
  const userContext = useContext(UserContext);

  /* Show the Impersonate Dialog or not */
  const [
    isImpersonateDialogOpen,
    { setTrue: showImpersonateDialog, setFalse: hideImpersonateDialog },
  ] = useBoolean(false);

  /* React Hook Form for the Impersonation Dialog box */
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IImpersonateForm>();

  /**
   * Take the form data (or no data) and if it was provided, then pass to the UserContext to update
   * If it was not provided, then pass nothing to UserContext, so it resets to self
   *
   * @param data The RHF data, or undefined
   * @returns a void Promise
   */
  const performImpersonate = async (data: IImpersonateForm | undefined) => {
    if (data) {
      // Lookup the userId
      const userId = (await spWebContext.web.ensureUser(data.user.EMail)).data
        .Id;
      // Create a new userData object, to pass to the impersonation function
      const userData = { ...data.user, Id: userId };
      userContext.impersonate(userData);
      hideImpersonateDialog(); // Close the impersonation dialog
    }
  };

  /**
   * Take the form data (or no data) and if it was provided, then pass to the UserContext to update
   * If it was not provided, then pass nothing to UserContext, so it resets to self
   *
   * @param data The RHF data, or undefined
   */
  const removeImpersonation = () => {
    // Call the UserContext impersonate function with no defined data to remove the impersonation
    userContext.impersonate(undefined);
    hideImpersonateDialog(); // Close the impersonation dialog
  };

  return (
    <>
      <Button appearance="primary" onClick={showImpersonateDialog}>
        Impersonate User
      </Button>
      <Dialog open={isImpersonateDialogOpen}>
        <DialogSurface aria-describedby="impersonateDialog">
          <form
            id="impersonateForm"
            onSubmit={handleSubmit(performImpersonate)}
          >
            <DialogBody>
              <DialogTitle
                action={
                  <Button
                    appearance="subtle"
                    aria-label="close"
                    icon={<Dismiss24Regular />}
                    onClick={hideImpersonateDialog}
                  />
                }
              >
                Select user to impersonate
              </DialogTitle>
              <DialogContent id="impersonateDialog">
                <div>
                  <Controller
                    name="user"
                    control={control}
                    rules={{
                      required:
                        "You must select a user if you want to impersonate someone",
                    }}
                    render={({ field: { onChange, value } }) => (
                      <PeoplePicker
                        ariaLabel="User to Impersonate"
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
                <Button appearance="primary" type="submit">
                  Impersonate
                </Button>
                <Button appearance="primary" onClick={removeImpersonation}>
                  Return as myself
                </Button>
                <Button appearance="secondary" onClick={hideImpersonateDialog}>
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
