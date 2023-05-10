import {
  CommandBar,
  ICommandBarItemProps,
  IPanelProps,
  IRenderFunction,
  Panel,
  PanelType,
} from "@fluentui/react";
import { FunctionComponent } from "react";
import {
  Button,
  webLightTheme,
  FluentProvider,
  Text,
  Label,
  Radio,
  RadioGroup,
  tokens,
  makeStyles,
  Combobox,
  Option,
} from "@fluentui/react-components";
import { DatePicker } from "@fluentui/react";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { useForm, Controller } from "react-hook-form";
import { EMPTYPES } from "constants/EmpTypes";
import { IOutRequest, useUpdateRequest } from "api/RequestApi";
import {
  NumberFieldIcon,
  CalendarIcon,
  DropdownIcon,
  ContactIcon,
} from "@fluentui/react-icons-mdl2";
import { RadioButtonFilled } from "@fluentui/react-icons";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";

/* FluentUI Styling */
const useStyles = makeStyles({
  formContainer: { display: "block" },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    display: "block",
  },
  fieldIcon: {
    marginRight: ".5em",
  },
  fieldContainer: {
    paddingLeft: ".25em",
    paddingRight: ".25em",
    paddingTop: ".5em",
    paddingBottom: ".5em",
    display: "grid",
    position: "relative",
  },
  fieldLabel: {
    paddingBottom: ".5em",
    display: "flex",
  },
  fieldDescription: {
    display: "block",
  },
  panelNavCommandBar: {
    marginRight: "auto", // Pull Command Bar far-left and close far-right
  },
  listBox: { maxHeight: "15em" },
});

interface IOutRequestEditPanel {
  data?: any;
  onEditCancel: () => void;
  isEditPanelOpen: boolean;
  onEditSave: () => void;
}

export const OutRequestEditPanel: FunctionComponent<IOutRequestEditPanel> = (
  props
) => {
  const classes = useStyles();

  type IRHFIPerson = {
    Id: number;
    Title: string;
    EMail: string;
    text: string;
    imageUrl?: string;
  };

  // Create a type to handle the IOutRequest type within React Hook Form (RHF)
  // This will allow for better typechecking on the RHF without it running into issues with the special IPerson type
  type IRHFOutRequest = Omit<IOutRequest, "supGovLead" | "employee"> & {
    /* Make of special type to prevent RHF from erroring out on typechecking -- but allow for better form typechecking on all other fields */
    supGovLead: IRHFIPerson;
    employee: IRHFIPerson;
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<IRHFOutRequest>({
    criteriaMode:
      "all" /* Pass back multiple errors, so we can prioritize which one(s) to show */,
    mode: "onChange" /* Provide input directly as they input, so if entering bad data it will let them know */,
    values: props.data,
  });
  const updateRequest = useUpdateRequest(props.data.Id);

  const onEditCancel = () => {
    reset(); // Reset the fields they changed since they are cancelling
    props.onEditCancel(); // Call the passed in function to process in the parent component
  };

  const updateThisRequest = (data: IRHFOutRequest) => {
    updateRequest.mutate(data as IOutRequest, {
      onSuccess: () => {
        // Close the edit panel on a succesful edit
        props.onEditSave();
      },
    });
  };

  // The footer of the EditPanel, containing the "Save" and "Cancel" buttons
  const onRenderNavigationContent: IRenderFunction<IPanelProps> = (
    props,
    defaultRender
  ) => {
    const items: ICommandBarItemProps[] = [
      {
        key: "saveEdits",
        text: "Save",
        iconProps: { iconName: "Save" },
        onClick: (_ev?, _item?) => {
          handleSubmit(updateThisRequest)();
        },
      },
      {
        key: "cancelEdits",
        text: "Cancel",
        iconProps: { iconName: "Cancel" },
        onClick: (_ev?, _item?) => {
          onEditCancel();
        },
      },
    ];

    return (
      <>
        <div className={classes.panelNavCommandBar}>
          <CommandBar items={items}></CommandBar>
        </div>
        {
          // Render the default close button
          defaultRender!(props)
        }
      </>
    );
  };

  return (
    <>
      <Panel
        isOpen={props.isEditPanelOpen}
        isBlocking={true}
        onDismiss={onEditCancel}
        headerText="Edit Request"
        onRenderNavigationContent={onRenderNavigationContent}
        type={PanelType.medium}
      >
        <FluentProvider theme={webLightTheme}>
          <hr />
          <form
            id="outReqForm"
            className={classes.formContainer}
            onSubmit={handleSubmit(updateThisRequest)}
          >
            <div className={classes.fieldContainer}>
              <Label
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
              >
                <ContactIcon className={classes.fieldIcon} />
                Employee from GAL
              </Label>
              <Controller
                name="employee"
                control={control}
                rules={{
                  required: "Employee is required",
                }}
                render={({ field: { onChange, value } }) => (
                  <PeoplePicker
                    ariaLabel="Employee"
                    aria-describedby="employeeErr"
                    selectedItems={value}
                    updatePeople={(items) => {
                      // If the selection is changed, save the persons name into the string empName field
                      if (items?.[0]?.text) {
                        setValue("empName", items[0].text);
                        onChange(items[0]);
                      } else {
                        setValue("empName", "");
                        onChange([]);
                      }
                    }}
                  />
                )}
              />
              {errors.employee && (
                <Text id="employeeErr" className={classes.errorText}>
                  {errors.employee.message}
                </Text>
              )}
            </div>
            <div className={classes.fieldContainer}>
              <Label
                htmlFor="empTypeId"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required
              >
                <RadioButtonFilled className={classes.fieldIcon} />
                Employee Type
              </Label>
              <Controller
                name="empType"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    {...field}
                    id="empTypeId"
                    aria-describedby="empTypeErr"
                    disabled={true}
                    layout="horizontal"
                  >
                    {Object.values(EMPTYPES).map((key) => {
                      return <Radio key={key} value={key} label={key} />;
                    })}
                  </RadioGroup>
                )}
              />
            </div>
            <div className={classes.fieldContainer}>
              <Label
                id="SARId"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required
              >
                <NumberFieldIcon className={classes.fieldIcon} />
                SAR
              </Label>
              <Controller
                name="SAR"
                control={control}
                render={({ field }) => (
                  <Combobox
                    selectedOptions={
                      field.value ? [field.value.toString()] : [""]
                    }
                    value={field.value ? field.value.toString() : ""}
                    aria-labelledby="SARId"
                    disabled={true}
                    placeholder={
                      props.data.empType === EMPTYPES.Contractor ? "N/A" : ""
                    }
                  ></Combobox>
                )}
              />
              <Text
                weight="regular"
                size={200}
                className={classes.fieldDescription}
              >
                If you do not know the SAR, please reference the UMD or contact
                your HR liaison.
              </Text>
            </div>
            <div className={classes.fieldContainer}>
              <Label
                id="sensitivityCodeId"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required={props.data.empType === EMPTYPES.Civilian}
              >
                <DropdownIcon className={classes.fieldIcon} />
                Position Sensitivity Code
              </Label>
              <Controller
                name="sensitivityCode"
                control={control}
                render={({ field: { value } }) => (
                  <Combobox
                    aria-describedby="sensitivityCodeErr"
                    aria-labelledby="sensitivityCodeId"
                    autoComplete="on"
                    listbox={{ className: classes.listBox }}
                    value={
                      value
                        ? SENSITIVITY_CODES.find(({ key }) => key === value)
                            ?.text
                        : ""
                    }
                    placeholder={
                      props.data.empType === EMPTYPES.Civilian ? "" : "N/A"
                    }
                    disabled={true}
                  >
                    {SENSITIVITY_CODES.map(({ key, text }) => (
                      <Option key={key} value={key.toString()}>
                        {text}
                      </Option>
                    ))}
                  </Combobox>
                )}
              />
              <Text
                weight="regular"
                size={200}
                className={classes.fieldDescription}
              >
                If you do not know the code, please reference the position
                documents or contact your HR liason.
              </Text>
            </div>
            <div className={classes.fieldContainer}>
              <Label
                htmlFor="lastDayId"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required
              >
                <CalendarIcon className={classes.fieldIcon} />
                Last date with current organization
              </Label>
              <Controller
                name="lastDay"
                control={control}
                rules={{
                  required: "Last date with current organization is required",
                }}
                render={({ field: { value, onChange } }) => (
                  <DatePicker
                    id="lastDayId"
                    placeholder="Enter the last date the employee will be with the current organization."
                    ariaLabel="Enter the last date the employee will be with the current organization."
                    aria-describedby="lastDayErr"
                    onSelectDate={(newDate) => {
                      if (newDate) {
                        let newBeginDate = new Date(newDate);
                        newBeginDate.setDate(newBeginDate.getDate() - 7);
                        setValue("beginDate", newBeginDate);
                      }
                      onChange(newDate);
                    }}
                    value={value}
                  />
                )}
              />
              {errors.lastDay && (
                <Text id="lastDayErr" className={classes.errorText}>
                  {errors.lastDay.message}
                </Text>
              )}
              <Text
                weight="regular"
                size={200}
                className={classes.fieldDescription}
              >
                Enter the last date the employee will be with the current
                organization.
              </Text>
            </div>
            <div className={classes.fieldContainer}>
              <Label
                htmlFor="beginDateId"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required
              >
                <CalendarIcon className={classes.fieldIcon} />
                Estimated Out-processing begin date
              </Label>
              <Controller
                name="beginDate"
                control={control}
                rules={{
                  required: "Estimated Out-processing begin date is required.",
                }}
                render={({ field: { value, onChange } }) => (
                  <DatePicker
                    id="beginDateId"
                    placeholder="Estimate date beginning employee out-processing (Default value is 7 days prior to Last Date with current organization)."
                    ariaLabel="Estimate date beginning employee out-processing (Default value is 7 days prior to Last Date with current organization)."
                    aria-describedby="beginDateErr"
                    onSelectDate={onChange}
                    value={value}
                  />
                )}
              />
              {errors.beginDate && (
                <Text id="beginDateErr" className={classes.errorText}>
                  {errors.beginDate.message}
                </Text>
              )}
              <Text
                weight="regular"
                size={200}
                className={classes.fieldDescription}
              >
                Estimate date beginning employee out-processing (Default value
                is 7 days prior to Last Date with current organization).
              </Text>
            </div>
            <div className={classes.fieldContainer}>
              <Label
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required
              >
                <ContactIcon className={classes.fieldIcon} />
                Supervisor/Government Lead
              </Label>
              <Controller
                name="supGovLead"
                control={control}
                rules={{
                  required: "Supervisor/Gov Lead is required",
                }}
                render={({ field: { onChange, value } }) => (
                  <PeoplePicker
                    ariaLabel="Supervisor/Government Lead"
                    aria-describedby="supGovLeadErr"
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
              {errors.supGovLead && (
                <Text id="supGovLeadErr" className={classes.errorText}>
                  {errors.supGovLead.message}
                </Text>
              )}
            </div>
            <div>
              <Button appearance="primary" type="submit">
                Save
              </Button>
              <Button appearance="secondary" onClick={onEditCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </FluentProvider>
      </Panel>
    </>
  );
};
