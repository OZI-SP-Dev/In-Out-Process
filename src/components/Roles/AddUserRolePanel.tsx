import { FunctionComponent, useState } from "react";
import {
  useRoleManagement,
  useAllUserRolesByUser,
  RoleType,
  ISubmitRole,
} from "api/RolesApi";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { IPerson } from "api/UserApi";
import { Panel, PanelType } from "@fluentui/react";
import {
  Button,
  Label,
  makeStyles,
  tokens,
  Text,
  FluentProvider,
  Tooltip,
  Badge,
  Spinner,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import { Controller, useForm } from "react-hook-form";
import {
  AlertSolidIcon,
  CompletedIcon,
  ContactIcon,
  DropdownIcon,
} from "@fluentui/react-icons-mdl2";

interface IAddUserRolePanel {
  onAddCancel?: () => void;
  isAddPanelOpen?: boolean;
  onAdd: () => void;
}

/* FluentUI Styling */
const useStyles = makeStyles({
  formContainer: { display: "grid" },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    display: "block",
  },
  fieldIcon: {
    marginRight: ".5em",
  },
  fieldContainer: {
    paddingLeft: "1em",
    paddingRight: "1em",
    paddingTop: ".5em",
    paddingBottom: ".5em",
    display: "grid",
    position: "relative",
  },
  fieldLabel: {
    paddingBottom: ".5em",
    display: "flex",
  },
  addButton: {
    display: "grid",
    justifyContent: "end",
    marginLeft: "1em",
    marginRight: "1em",
    marginTop: ".5em",
    marginBottom: ".5em",
  },
});

export const AddUserRolePanel: FunctionComponent<IAddUserRolePanel> = (
  props
) => {
  const classes = useStyles();
  const { data: allRolesByUser } = useAllUserRolesByUser();
  const [items, setItems] = useState<RoleType[]>([]);
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<Partial<ISubmitRole>>(); //Make all the props optional, so that we can set them to undefined etc

  // Get the hook with functions to perform Role Management
  const { addRole } = useRoleManagement();

  const roles = Object.values(RoleType)
    .filter(
      (item) =>
        // Don't include Employee, Supervisor, or any role the user already has in the options
        item !== RoleType.SUPERVISOR &&
        item !== RoleType.EMPLOYEE &&
        !items.includes(item)
    )
    .sort(function (a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    })
    .map((role) => {
      return role;
    });

  // Function to test adding a Role
  const addRoleClick = (data: Partial<ISubmitRole>) => {
    if (data.User && data.Role) {
      // Since we ensure that there is data we can assert that it is of ISubmitRole type
      addRole.mutate(data as ISubmitRole, {
        onSuccess: () => {
          setTimeout(() => {
            props.onAdd();
          }, 2000);
        },
      });
    }
  };

  const onUserChange = (user: IPerson[]) => {
    if (user.length > 0) {
      setValue("User", user[0]);
      const newItems = allRolesByUser?.get(user[0].EMail);
      if (newItems === undefined) {
        setItems([]);
      } else {
        setItems(newItems.map((role) => role.Title));
      }
    } else {
      setValue("User", undefined); // Clear value for the RHF erorr/validation handling
      setItems([]); // List all roles as options
    }
  };

  /** Function called when the Panel is closed/dismissed */
  const onDismissed = () => {
    reset(); // Clear the RHF fields
    setItems([]); // Resest Roles to all options
    addRole.reset(); // Reset our mutation
  };

  return (
    <Panel
      isOpen={props.isAddPanelOpen}
      onDismissed={onDismissed}
      isBlocking={true}
      onDismiss={props.onAddCancel}
      headerText="Add User to Role"
      type={PanelType.medium}
    >
      <FluentProvider>
        <form
          id="inReqForm"
          className={classes.formContainer}
          onSubmit={handleSubmit(addRoleClick)}
        >
          <div className={classes.fieldContainer}>
            <Label
              size="small"
              weight="semibold"
              className={classes.fieldLabel}
              required
            >
              <ContactIcon className={classes.fieldIcon} />
              User
            </Label>
            <Controller
              name="User"
              control={control}
              rules={{
                required:
                  "You must select a User from the Global Address List (GAL)",
              }}
              render={({ field: { value } }) => (
                <PeoplePicker
                  ariaLabel="User"
                  aria-describedby="userErr"
                  selectedItems={value ?? []}
                  updatePeople={onUserChange}
                />
              )}
            />
            {errors.User && (
              <Text id="userErr" className={classes.errorText}>
                {errors.User.message}
              </Text>
            )}
          </div>
          <div className={classes.fieldContainer}>
            <Label
              htmlFor="roleId"
              size="small"
              weight="semibold"
              className={classes.fieldLabel}
              required
            >
              <DropdownIcon className={classes.fieldIcon} />
              Role
            </Label>
            <Controller
              name="Role"
              control={control}
              rules={{
                required: "You must select a role to add to the user",
              }}
              render={({ field: { onBlur, onChange } }) => (
                <Dropdown
                  id="roleId"
                  aria-describedby="roleErr"
                  onOptionSelect={(_ev, data) => {
                    if (data?.selectedOptions) {
                      onChange(data.optionValue);
                    }
                  }}
                  onBlur={onBlur}
                >
                  {roles.map((role) => (
                    <Option value={role} key={role}>
                      {role}
                    </Option>
                  ))}
                </Dropdown>
              )}
            />
            {errors.Role && (
              <Text id="roleErr" className={classes.errorText}>
                {errors.Role.message}
              </Text>
            )}
          </div>
          <div className={classes.addButton}>
            {addRole.isError && (
              <Tooltip
                content={
                  addRole.error instanceof Error
                    ? addRole.error.message
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
            {(addRole.isIdle || addRole.isError) && (
              <Button appearance="primary" type="submit">
                Add User to Role
              </Button>
            )}
            {addRole.isLoading && (
              <Spinner size="small" label="Adding role..." />
            )}
            {addRole.isSuccess && (
              <Badge
                size="extra-large"
                appearance="ghost"
                color="success"
                icon={<CompletedIcon />}
              >
                Role added successfully
              </Badge>
            )}
          </div>
        </form>
      </FluentProvider>
    </Panel>
  );
};
