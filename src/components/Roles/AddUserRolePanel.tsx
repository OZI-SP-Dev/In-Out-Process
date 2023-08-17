import { FunctionComponent, useState } from "react";
import {
  useRoleManagement,
  useAllUserRolesByUser,
  RoleType,
  ISubmitRole,
  SPRole,
} from "api/RolesApi";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { IPerson, Person } from "api/UserApi";
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
  Input,
} from "@fluentui/react-components";
import { Controller, useForm } from "react-hook-form";
import {
  AlertSolidIcon,
  CompletedIcon,
  ContactIcon,
  DropdownIcon,
  TextFieldIcon,
} from "@fluentui/react-icons-mdl2";

interface IAddUserRolePanel {
  onClose: () => void;
  isAddPanelOpen: boolean;
  editItem?: SPRole;
}

// Custom type converter, to make it possible to set any of the props to null
type WithNull<T> = {
  [P in keyof T]: T[P] | null;
};

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
  fieldDescription: {
    display: "block",
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
  } = useForm<WithNull<ISubmitRole>>({}); //Make all the props able to be null, so that we can set them to null -- RHF doesn't like undefined

  // Get the hook with functions to perform Role Management
  const { addRole, updateRole } = useRoleManagement();

  /** The list of available dropdown roles for the selected user */
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

  /** Function to add/update a Role record */
  const addRoleClick = (data: WithNull<ISubmitRole>) => {
    if (data.User && data.Title) {
      // Since we ensure that there is data we can assert that it is of ISubmitRole type
      const roleData = data as ISubmitRole;
      if (!props.editItem) {
        // Since we ensure that there is data we can assert that it is of ISubmitRole type
        addRole.mutate(roleData, {
          onSuccess: () => {
            setTimeout(() => {
              props.onClose();
            }, 2000);
          },
        });
      } else {
        const updateData = { old: { ...props.editItem }, new: { ...roleData } };
        updateRole.mutate(updateData, {
          onSuccess: () => {
            setTimeout(() => {
              props.onClose();
            }, 2000);
          },
        });
      }
    }
  };

  const onUserChange = (user: IPerson[] | null) => {
    if (user && user.length > 0) {
      setValue("User", user[0]);
      const newItems = allRolesByUser?.get(user[0].EMail);
      if (newItems === undefined) {
        setItems([]);
      } else {
        setItems(newItems.map((role) => role.Title));
      }
    } else {
      setValue("User", null); // Clear value for the RHF erorr/validation handling
      setItems([]); // List all roles as options
    }
  };

  /** Function called when the Panel is opened */
  const onOpen = () => {
    if (props.editItem) {
      const user = new Person(props.editItem.User);
      const tempEditItem = {
        ...props.editItem,
        User: user,
      };
      reset(tempEditItem); // Set the RHF values
      onUserChange([user]);
    } else {
      reset({ User: null, Title: null, Email: "" }); // Clear RHF
      setItems([]); // Resest Roles to all options
    }

    addRole.reset(); // Reset our mutation
    updateRole.reset(); // Reset our mutation
  };

  return (
    <Panel
      isOpen={props.isAddPanelOpen}
      onOpen={onOpen}
      isBlocking={true}
      onDismiss={props.onClose}
      headerText={!props.editItem ? "Add Role" : "Update Role"}
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
              name="Title"
              control={control}
              rules={{
                required: "You must select a role to add to the user",
              }}
              render={({ field: { onBlur, onChange, value } }) => (
                <Dropdown
                  id="roleId"
                  aria-describedby="roleErr"
                  value={value ?? ""}
                  selectedOptions={[value?.toString() ?? ""]}
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
            {errors.Title && (
              <Text id="roleErr" className={classes.errorText}>
                {errors.Title.message}
              </Text>
            )}
          </div>
          <div className={classes.fieldContainer}>
            <Label
              htmlFor="roleId"
              size="small"
              weight="semibold"
              className={classes.fieldLabel}
            >
              <TextFieldIcon className={classes.fieldIcon} />
              Alternate Email Address
            </Label>
            <Controller
              name="Email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ""}
                  aria-describedby="emailErr"
                  aria-labelledby="emailErr"
                />
              )}
            />
            {errors.Email && (
              <Text id="emailErr" className={classes.errorText}>
                {errors.Email.message}
              </Text>
            )}
            <Text
              weight="regular"
              size={200}
              className={classes.fieldDescription}
            >
              Email address to send to if different than the Global Address List
              (GAL). This can be used to send emails to an Organizational Box,
              by providing that address here.
            </Text>
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
            {updateRole.isError && (
              <Tooltip
                content={
                  updateRole.error instanceof Error
                    ? updateRole.error.message
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
            {((addRole.isIdle && updateRole.isIdle) ||
              addRole.isError ||
              updateRole.isError) && (
              <Button appearance="primary" type="submit">
                {!props.editItem ? "Add Role" : "Update Role"}
              </Button>
            )}
            {(addRole.isLoading || updateRole.isLoading) && (
              <Spinner
                size="small"
                label={
                  addRole.isLoading ? "Adding role..." : "Updating role..."
                }
              />
            )}
            {(addRole.isSuccess || updateRole.isSuccess) && (
              <Badge
                size="extra-large"
                appearance="ghost"
                color="success"
                icon={<CompletedIcon />}
              >
                {addRole.isSuccess
                  ? "Role added successfully"
                  : "Role updated successfully"}
              </Badge>
            )}
          </div>
        </form>
      </FluentProvider>
    </Panel>
  );
};
