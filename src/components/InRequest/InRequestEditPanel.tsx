import {
  CommandBar,
  ICommandBarItemProps,
  IPanelProps,
  IRenderFunction,
  Panel,
  PanelType,
} from "@fluentui/react";
import { FunctionComponent, useMemo } from "react";
import {
  Button,
  webLightTheme,
  FluentProvider,
  Input,
  Text,
  Label,
  Radio,
  RadioGroup,
  tokens,
  makeStyles,
  Combobox,
  OptionGroup,
  Option,
} from "@fluentui/react-components";
import { DatePicker } from "@fluentui/react";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { useForm, Controller } from "react-hook-form";
import { EMPTYPES } from "constants/EmpTypes";
import { CIV_GRADES, MIL_RANKS } from "constants/GradeRanks";
import { OFFICES } from "constants/Offices";
import { WORKLOCATIONS } from "constants/WorkLocations";
import { IInRequest, useUpdateRequest } from "api/RequestApi";
import {
  TextFieldIcon,
  NumberFieldIcon,
  CalendarIcon,
  DropdownIcon,
  ContactIcon,
} from "@fluentui/react-icons-mdl2";
import { ToggleLeftRegular, RadioButtonFilled } from "@fluentui/react-icons";
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

interface IInRequestEditPanel {
  data?: any;
  onEditCancel: () => void;
  isEditPanelOpen: boolean;
  onEditSave: () => void;
}

export const InRequestEditPanel: FunctionComponent<IInRequestEditPanel> = (
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

  // Create a type to handle the IInRequest type within React Hook Form (RHF)
  // This will allow for better typechecking on the RHF without it running into issues with the special IPerson type
  type IRHFInRequest = Omit<IInRequest, "MPCN" | "supGovLead" | "employee"> & {
    MPCN: string;
    /* Make of special type to prevent RHF from erroring out on typechecking -- but allow for better form typechecking on all other fields */
    supGovLead: IRHFIPerson;
    employee: IRHFIPerson;
  };

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<IRHFInRequest>({
    criteriaMode:
      "all" /* Pass back multiple errors, so we can prioritize which one(s) to show */,
    mode: "onChange" /* Provide input directly as they input, so if entering bad data (eg letter in MPCN) it will let them know */,
    values: props.data,
  });
  const updateRequest = useUpdateRequest(props.data.Id);

  // Setup watches
  const hasExistingCAC = watch("hasExistingCAC");
  const eta = watch("eta");
  const employee = watch("employee");
  const workLocation = watch("workLocation");

  const gradeRankOptions = useMemo(() => {
    switch (props.data.empType) {
      case EMPTYPES.Civilian:
        return CIV_GRADES;
      case EMPTYPES.Military:
        return MIL_RANKS;
      case EMPTYPES.Contractor:
        return [];
      default:
        return [];
    }
  }, [props.data.empType]);

  const onEditCancel = () => {
    reset(); // Reset the fields they changed since they are cancelling
    props.onEditCancel(); // Call the passed in function to process in the parent component
  };

  const minCompletionDate: Date = useMemo(() => {
    // Set the minimumn completion date to be 14 days from the estimated arrival
    if (eta) {
      let newMinDate = new Date(eta);
      newMinDate.setDate(newMinDate.getDate() + 14);
      return newMinDate;
    } else return new Date();
  }, [eta]);

  const updateThisRequest = (data: IRHFInRequest) => {
    // Translate the string MPCN to an Integer
    let mpcn: number | undefined;
    if (
      data.empType === EMPTYPES.Civilian ||
      data.empType === EMPTYPES.Military
    ) {
      // Parsing the string should be fine, as we enforce pattern of numeric
      mpcn = parseInt(data.MPCN);
    }

    const data2: IInRequest = { ...data, MPCN: mpcn } as IInRequest;

    updateRequest.mutate(data2, {
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
            id="inReqForm"
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
                Employee from GAL (skip if not in GAL)
              </Label>
              <Controller
                name="employee"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <PeoplePicker
                    ariaLabel="Employee"
                    aria-describedby="employeeErr"
                    selectedItems={value}
                    updatePeople={(items) => {
                      if (items?.[0]?.text) {
                        setValue("empName", items[0].text, {
                          shouldValidate: true,
                        });
                        onChange(items[0]);
                      } else {
                        setValue("empName", "", { shouldValidate: true });
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
                htmlFor="empNameId"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required
              >
                <ContactIcon className={classes.fieldIcon} />
                Employee Name
              </Label>
              <Controller
                name="empName"
                control={control}
                rules={{
                  required: "Employee Name is required",
                  maxLength: {
                    value: 100,
                    message: "Name cannot be longer than 100 characters",
                  },
                  pattern: {
                    value: /\S/i,
                    message: "Employee Name is required",
                  },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    key={employee?.text ? employee.text : "empName"}
                    disabled={employee?.text ? true : false}
                    aria-describedby="empNameErr"
                    id="empNameId"
                    placeholder="Supply a manually entered name to be used until they are in the GAL.  Example 'Last, First MI'"
                  />
                )}
              />
              {errors.empName && (
                <Text id="empNameErr" className={classes.errorText}>
                  {errors.empName.message}
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
                id="gradeRankId"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required={
                  props.data.empType === EMPTYPES.Civilian ||
                  props.data.empType === EMPTYPES.Military
                }
              >
                <DropdownIcon className={classes.fieldIcon} />
                Grade/Rank
              </Label>
              <Controller
                name="gradeRank"
                control={control}
                defaultValue={""}
                rules={{
                  required:
                    props.data.empType !== EMPTYPES.Contractor
                      ? "Grade/Rank is required"
                      : "",
                }}
                render={({ field: { onBlur, onChange, value } }) => (
                  <Combobox
                    aria-describedby="gradeRankErr"
                    aria-labelledby="gradeRankId"
                    autoComplete="on"
                    listbox={{ className: classes.listBox }}
                    value={value}
                    onOptionSelect={(_, option) => {
                      if (option.optionValue) {
                        onChange(option.optionValue);
                      }
                    }}
                    onBlur={onBlur}
                    disabled={props.data.empType === EMPTYPES.Contractor}
                    placeholder={
                      props.data.empType === EMPTYPES.Contractor ? "N/A" : ""
                    }
                  >
                    {gradeRankOptions.map((gradeRankGroup) => (
                      <OptionGroup
                        key={gradeRankGroup.key}
                        label={gradeRankGroup.text}
                      >
                        {gradeRankGroup.items.map((gradeRankOption) => (
                          <Option
                            key={gradeRankOption.key}
                            value={gradeRankOption.key}
                          >
                            {gradeRankOption.text}
                          </Option>
                        ))}
                      </OptionGroup>
                    ))}
                  </Combobox>
                )}
              />
              {errors.gradeRank && (
                <Text id="gradeRankErr" className={classes.errorText}>
                  {errors.gradeRank.message}
                </Text>
              )}
            </div>
            <div className={classes.fieldContainer}>
              <Label
                htmlFor="MPCNId"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required={
                  props.data.empType === EMPTYPES.Civilian ||
                  props.data.empType === EMPTYPES.Military
                }
              >
                <NumberFieldIcon className={classes.fieldIcon} />
                MPCN
              </Label>
              <Controller
                name="MPCN"
                control={control}
                rules={{
                  required:
                    (props.data.empType === EMPTYPES.Civilian ||
                      props.data.empType === EMPTYPES.Military) &&
                    "MPCN is required",
                  minLength: {
                    value: 7,
                    message: "MPCN cannot be less than 7 digits",
                  },
                  maxLength: {
                    value: 7,
                    message: "MPCN cannot be more than 7 digits",
                  },
                  pattern: {
                    value:
                      /^\d+$/ /* We don't want the pattern to enforce 7 numbers so we can have a unique error for non-numeric (eg letters/symbols) */,
                    message: "MPCN can only consist of numbers",
                  },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    aria-describedby="MPCNErr"
                    placeholder={
                      props.data.empType === EMPTYPES.Contractor ? "N/A" : ""
                    }
                    disabled={props.data.empType === EMPTYPES.Contractor}
                    id="MPCNId"
                    inputMode="numeric"
                  />
                )}
              />
              {errors.MPCN && (
                <Text id="MPCNErr" className={classes.errorText}>
                  {
                    /* Prioritize showing the error for non-numeric */
                    errors.MPCN.types?.pattern
                      ? errors.MPCN.types?.pattern
                      : errors.MPCN.message
                  }
                </Text>
              )}
              <Text
                weight="regular"
                size={200}
                className={classes.fieldDescription}
              >
                If you do not know the MPCN, please reference the UMD or contact
                your HR liaison.
              </Text>
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
                htmlFor="workLocationId"
                id="workLocationLabelId"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required
              >
                <ToggleLeftRegular className={classes.fieldIcon} />
                Local or Remote?
              </Label>
              <Controller
                name="workLocation"
                control={control}
                rules={{
                  required: "Selection is required",
                }}
                render={({ field }) => (
                  <RadioGroup
                    {...field}
                    id="workLocationId"
                    aria-describedby="workLocationErr workLocationDesc"
                    aria-labelledby="workLocationLabelId"
                    layout="horizontal"
                  >
                    {WORKLOCATIONS.map((workLocation) => {
                      return (
                        <Radio
                          key={workLocation.value}
                          value={workLocation.value}
                          label={workLocation.label}
                        />
                      );
                    })}
                  </RadioGroup>
                )}
              />
              {errors.workLocation && (
                <Text id="workLocationErr" className={classes.errorText}>
                  {errors.workLocation.message}
                </Text>
              )}
              <Text
                id="workLocationDesc"
                weight="regular"
                size={200}
                className={classes.fieldDescription}
              >
                Greater than 50 miles qualifies as Remote
              </Text>
            </div>
            {
              /* Display field for entering location if Remote */
              workLocation === "remote" && (
                <div className={classes.fieldContainer}>
                  <Label
                    id="workLocationDetailId"
                    size="small"
                    weight="semibold"
                    className={classes.fieldLabel}
                    required
                  >
                    <TextFieldIcon className={classes.fieldIcon} />
                    Remote Location
                  </Label>
                  <Controller
                    name="workLocationDetail"
                    control={control}
                    rules={{
                      required:
                        "Remote Location is required for Remote Employees",
                      maxLength: {
                        value: 100,
                        message:
                          "Remote Location cannot be longer than 100 characters",
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        aria-describedby="workLocationDetailErr"
                        aria-labelledby="workLocationDetailId"
                      />
                    )}
                  />
                  {errors.workLocationDetail && (
                    <Text
                      id="workLocationDetailErr"
                      className={classes.errorText}
                    >
                      {errors.workLocationDetail.message}
                    </Text>
                  )}
                  <Text
                    weight="regular"
                    size={200}
                    className={classes.fieldDescription}
                  >
                    City, State
                  </Text>
                </div>
              )
            }
            <div className={classes.fieldContainer}>
              <Label
                htmlFor="arrivalDateId"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required
              >
                <CalendarIcon className={classes.fieldIcon} />
                Select estimated on-boarding date
              </Label>
              <Controller
                name="eta"
                control={control}
                rules={{
                  required: "Esitmated date is required",
                }}
                render={({ field: { value, onChange } }) => (
                  <DatePicker
                    id="arrivalDateId"
                    placeholder="Select estimated on-boarding date"
                    ariaLabel="Select an estimated on-boarding date"
                    aria-describedby="etaErr"
                    onSelectDate={(newDate) => {
                      if (newDate) {
                        let newCompletionDate = new Date(newDate);
                        newCompletionDate.setDate(
                          newCompletionDate.getDate() + 28
                        );
                        setValue("completionDate", newCompletionDate, {
                          shouldValidate: true,
                        });
                      }
                      onChange(newDate);
                    }}
                    value={value}
                  />
                )}
              />
              {errors.eta && (
                <Text id="etaErr" className={classes.errorText}>
                  {errors.eta.message}
                </Text>
              )}
            </div>
            <div className={classes.fieldContainer}>
              <Label
                htmlFor="completionDateId"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required
              >
                <CalendarIcon className={classes.fieldIcon} />
                Select target completion date
              </Label>
              <Controller
                name="completionDate"
                control={control}
                rules={{
                  required: "Completion Date is required.",
                }}
                render={({ field: { value, onChange } }) => (
                  <DatePicker
                    id="completionDateId"
                    placeholder="Select target completion date"
                    ariaLabel="Select target completion date"
                    aria-describedby="completionDateErr"
                    onSelectDate={onChange}
                    minDate={minCompletionDate}
                    value={value}
                  />
                )}
              />
              {errors.completionDate && (
                <Text id="completionDateErr" className={classes.errorText}>
                  {errors.completionDate.message}
                </Text>
              )}
            </div>
            <div className={classes.fieldContainer}>
              <Label
                id="officeId"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required
              >
                <DropdownIcon className={classes.fieldIcon} />
                Office
              </Label>
              <Controller
                name="office"
                control={control}
                defaultValue={""}
                rules={{
                  required: "Office is required",
                }}
                render={({ field: { onBlur, onChange, value } }) => (
                  <Combobox
                    aria-describedby="officeErr"
                    aria-labelledby="officeId"
                    autoComplete="on"
                    listbox={{ className: classes.listBox }}
                    value={value}
                    onOptionSelect={(_, option) => {
                      if (option.optionValue) {
                        onChange(option.optionValue);
                      }
                    }}
                    onBlur={onBlur}
                  >
                    {OFFICES.map(({ key, text }) => (
                      <Option key={key} value={key}>
                        {text}
                      </Option>
                    ))}
                  </Combobox>
                )}
              />
              {errors.office && (
                <Text id="officeErr" className={classes.errorText}>
                  {errors.office.message}
                </Text>
              )}
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
            {(props.data.empType === EMPTYPES.Civilian ||
              props.data.empType === EMPTYPES.Military) && (
              <>
                <div className={classes.fieldContainer}>
                  <Label
                    id="isNewCivMilId"
                    size="small"
                    weight="semibold"
                    className={classes.fieldLabel}
                    required
                  >
                    <ToggleLeftRegular className={classes.fieldIcon} />
                    Is Employee a New Air Force{" "}
                    {props.data.empType === EMPTYPES.Civilian
                      ? "Civilian"
                      : "Military"}
                    ?
                  </Label>
                  <Controller
                    name="isNewCivMil"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        {...field}
                        aria-describedby="isNewCivMilErr"
                        aria-labelledby="isNewCivMilId"
                        id="newCivId"
                        disabled={true}
                      >
                        <Radio key={"yes"} value={"yes"} label="Yes" />
                        <Radio key={"no"} value={"no"} label="No" />
                      </RadioGroup>
                    )}
                  />
                </div>
                {props.data.isNewCivMil === "no" && (
                  <div className={classes.fieldContainer}>
                    <Label
                      htmlFor="prevOrgId"
                      size="small"
                      weight="semibold"
                      className={classes.fieldLabel}
                      required
                    >
                      <TextFieldIcon className={classes.fieldIcon} />
                      Previous Organization
                    </Label>
                    <Controller
                      name="prevOrg"
                      control={control}
                      rules={{
                        required: "Previous Organization is required",
                        maxLength: {
                          value: 100,
                          message:
                            "Previous Organization cannot be longer than 100 characters",
                        },
                      }}
                      render={({ field }) => (
                        <Input
                          {...field}
                          aria-describedby="prevOrgErr"
                          id="prevOrgId"
                        />
                      )}
                    />
                    {errors.prevOrg && (
                      <Text id="prevOrgErr" className={classes.errorText}>
                        {errors.prevOrg.message}
                      </Text>
                    )}
                    <Text
                      weight="regular"
                      size={200}
                      className={classes.fieldDescription}
                    >
                      Entry should include Higher HQ / Directorate; examples
                      AFRL/RD, AFLCMC/HI, SAF/AQ
                    </Text>
                  </div>
                )}
              </>
            )}
            {(props.data.empType === EMPTYPES.Civilian ||
              props.data.empType === EMPTYPES.Military) && (
              <div className={classes.fieldContainer}>
                <Label
                  htmlFor="isTravelerId"
                  id="isTravelerLabelId"
                  size="small"
                  weight="semibold"
                  className={classes.fieldLabel}
                  required
                >
                  <ToggleLeftRegular className={classes.fieldIcon} />
                  Will the Employee require travel ability (DTS and GTC)
                </Label>
                <Controller
                  name="isTraveler"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      {...field}
                      aria-describedby="isTravelerErr"
                      aria-labelledby="isTravelerLabelId"
                      id="isTravelerId"
                      disabled={true}
                    >
                      <Radio key={"yes"} value={"yes"} label="Yes" />
                      <Radio key={"no"} value={"no"} label="No" />
                    </RadioGroup>
                  )}
                />
              </div>
            )}
            {(props.data.empType === EMPTYPES.Civilian ||
              props.data.empType === EMPTYPES.Military) && (
              <div className={classes.fieldContainer}>
                <Label
                  htmlFor="isSupervisorId"
                  size="small"
                  weight="semibold"
                  className={classes.fieldLabel}
                  required
                >
                  <ToggleLeftRegular className={classes.fieldIcon} />
                  Is the Employee filling a Supervisory position
                </Label>
                <Controller
                  name="isSupervisor"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup
                      {...field}
                      aria-describedby="isSupervisorErr"
                      id="isSupervisorId"
                      disabled={true}
                    >
                      <Radio key={"yes"} value={"yes"} label="Yes" />
                      <Radio key={"no"} value={"no"} label="No" />
                    </RadioGroup>
                  )}
                />
              </div>
            )}
            {props.data.empType === EMPTYPES.Military &&
              props.data.SAR === 5 && (
                <div className={classes.fieldContainer}>
                  <Label
                    id="isSCIId"
                    size="small"
                    weight="semibold"
                    className={classes.fieldLabel}
                    required
                  >
                    <ToggleLeftRegular className={classes.fieldIcon} />
                    Does employee require SCI access?
                  </Label>
                  <Controller
                    name="isSCI"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup
                        {...field}
                        aria-describedby="isSCIErr"
                        aria-labelledby="isSCIId"
                        disabled={true}
                      >
                        <Radio key={"yes"} value={"yes"} label="Yes" />
                        <Radio key={"no"} value={"no"} label="No" />
                      </RadioGroup>
                    )}
                  />
                </div>
              )}
            {props.data.empType === EMPTYPES.Contractor && (
              <>
                <div className={classes.fieldContainer}>
                  <Label
                    id="contractNumberId"
                    size="small"
                    weight="semibold"
                    className={classes.fieldLabel}
                    required
                  >
                    <TextFieldIcon className={classes.fieldIcon} />
                    Contract Number
                  </Label>
                  <Controller
                    name="contractNumber"
                    control={control}
                    rules={{
                      required: "Contract Number is required",
                      maxLength: {
                        value: 100,
                        message:
                          "Contract Number cannot be longer than 100 characters",
                      },
                    }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        aria-describedby="contractNumberErr"
                        aria-labelledby="contractNumberId"
                      />
                    )}
                  />
                  {errors.contractNumber && (
                    <Text id="contractNumberErr" className={classes.errorText}>
                      {errors.contractNumber.message}
                    </Text>
                  )}
                </div>
                <div className={classes.fieldContainer}>
                  <Label
                    htmlFor="contractEndDateId"
                    size="small"
                    weight="semibold"
                    className={classes.fieldLabel}
                    required
                  >
                    <CalendarIcon className={classes.fieldIcon} />
                    Contract End Date
                  </Label>
                  <Controller
                    name="contractEndDate"
                    control={control}
                    rules={{
                      required: "Contract End Date is required",
                    }}
                    render={({ field: { value, onChange } }) => (
                      <DatePicker
                        id="contractEndDateId"
                        placeholder="Select Contract End Date"
                        ariaLabel="Select Contract End Date"
                        aria-describedby="contractEndDateErr"
                        onSelectDate={onChange}
                        value={value}
                      />
                    )}
                  />
                  {errors.contractEndDate && (
                    <Text id="contractEndDateErr" className={classes.errorText}>
                      {errors.contractEndDate.message}
                    </Text>
                  )}
                </div>
                <div className={classes.fieldContainer}>
                  <Label
                    htmlFor="hasExistingCACId"
                    id="hasExistingCACLabelId"
                    size="small"
                    weight="semibold"
                    className={classes.fieldLabel}
                    required
                  >
                    <ToggleLeftRegular className={classes.fieldIcon} />
                    Does the Support Contractor have an Existing Contractor CAC?
                  </Label>
                  <Controller
                    name="hasExistingCAC"
                    control={control}
                    rules={{
                      required: "Selection is required",
                    }}
                    render={({ field: { onBlur, onChange, value } }) => (
                      <RadioGroup
                        onBlur={onBlur}
                        value={value}
                        onChange={(e, option) => {
                          if (option.value === "no") {
                            setValue("CACExpiration", undefined);
                          }
                          onChange(e, option);
                        }}
                        aria-describedby="hasExistingCACErr"
                        aria-labelledby="hasExistingCACLabelId"
                        id="hasExistingCACId"
                      >
                        <Radio key={"yes"} value={"yes"} label="Yes" />
                        <Radio key={"no"} value={"no"} label="No" />
                      </RadioGroup>
                    )}
                  />
                  {errors.hasExistingCAC && (
                    <Text id="hasExistingCACErr" className={classes.errorText}>
                      {errors.hasExistingCAC.message}
                    </Text>
                  )}
                </div>
                {hasExistingCAC === "yes" && (
                  <div className={classes.fieldContainer}>
                    <Label
                      htmlFor="CACExpirationId"
                      size="small"
                      weight="semibold"
                      className={classes.fieldLabel}
                      required
                    >
                      <CalendarIcon className={classes.fieldIcon} />
                      CAC Expiration
                    </Label>
                    <Controller
                      name="CACExpiration"
                      control={control}
                      rules={{
                        required: "CAC Expiration is required",
                      }}
                      render={({ field: { value, onChange } }) => (
                        <DatePicker
                          id="CACExpirationId"
                          placeholder="Select CAC expiration date"
                          ariaLabel="Select CAC expiration date"
                          aria-describedby="CACExpirationErr"
                          onSelectDate={onChange}
                          value={value}
                        />
                      )}
                    />
                    {errors.CACExpiration && (
                      <Text id="CACExpirationErr" className={classes.errorText}>
                        {errors.CACExpiration.message}
                      </Text>
                    )}
                  </div>
                )}
              </>
            )}
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
