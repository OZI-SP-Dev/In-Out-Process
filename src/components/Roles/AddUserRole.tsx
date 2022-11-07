import { useState } from "react";
import {
  useRoleManagement,
  useAllUserRolesByUser,
  RoleType,
} from "api/RolesApi";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { IPerson } from "api/UserApi";
import { Dropdown } from "@fluentui/react";
import {
  Button,
  Label,
  makeStyles,
  tokens,
  Text,
} from "@fluentui/react-components";
import { Controller, useForm } from "react-hook-form";
import { ContactIcon, DropdownIcon } from "@fluentui/react-icons-mdl2";

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

export const AddUserRole: React.FunctionComponent = () => {
  const classes = useStyles();
  const { data: allRolesByUser } = useAllUserRolesByUser();
  const [items, setItems] = useState<RoleType[]>([]);
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<any>();

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
      return { key: role, text: role };
    });

  // Function to test adding a Role
  const addRoleClick = (data: { user: any; role: RoleType }) => {
    if (data.user && data.role) {
      addRole.mutate({
        User: data.user,
        Role: data.role,
      });
    }
  };

  const onUserChange = (user: IPerson[]) => {
    if (user) {
      setValue("user", user[0]);
      if (typeof user[0]?.EMail === "string") {
        const newItems = allRolesByUser?.get(user[0].EMail);
        if (newItems === undefined) {
          setItems([]);
        } else {
          setItems(newItems.map((role) => role.Title));
        }
      } else {
        setItems([]);
      }
    } else {
      setValue("user", []);
      setItems([]);
    }
  };

  return (
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
          name="user"
          control={control}
          rules={{
            required:
              "You must select a User from the Global Address List (GAL)",
          }}
          render={({ field: { onBlur, onChange, value } }) => (
            <PeoplePicker
              ariaLabel="User"
              aria-describedby="userErr"
              selectedItems={value}
              updatePeople={onUserChange}
            />
          )}
        />
        {errors.user && (
          <Text id="userErr" className={classes.errorText}>
            {errors.user.message}
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
          name="role"
          control={control}
          rules={{
            required: "You must select a role to add to the user",
          }}
          render={({ field: { onBlur, onChange, value } }) => (
            <Dropdown
              id="roleId"
              aria-describedby="roleErr"
              selectedKey={value}
              onChange={(_, option) => {
                if (option?.key) {
                  onChange(option.key);
                }
              }}
              onBlur={onBlur}
              options={roles}
            />
          )}
        />
        {errors.role && (
          <Text id="gradeRankErr" className={classes.errorText}>
            {errors.role.message}
          </Text>
        )}
      </div>
      <div className={classes.addButton}>
        <Button appearance="primary" type="submit">
          Add User to Role
        </Button>
      </div>
    </form>
  );
};
