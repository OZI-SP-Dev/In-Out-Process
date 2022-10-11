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
} from "@fluentui/react-components";
import { ComboBox, DatePicker, IComboBoxOption } from "@fluentui/react";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { useForm, Controller } from "react-hook-form";
import { EMPTYPES } from "constants/EmpTypes";
import {
  GS_GRADES,
  MIL_GRADES,
  NH_GRADES,
  OFFICES,
} from "constants/GradeRanks";
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

/* FluentUI Styling */
const useStyles = makeStyles({
  formContainer: { display: "block" },
  floatRight: {
    float: "right",
  },
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
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<any>();
  const updateRequest = useUpdateRequest(props.data.Id);

  // Setup watches
  const empType = watch("empType");
  const isNewCivMil = watch("isNewCivMil");
  const hasExistingCAC = watch("hasExistingCAC");
  const eta = watch("eta");
  const employee = watch("employee");

  const compProps = props;

  const gradeRankOptions: IComboBoxOption[] = useMemo(() => {
    switch (empType) {
      case EMPTYPES.Civilian:
        return [...GS_GRADES, ...NH_GRADES];
      case EMPTYPES.Military:
        return [...MIL_GRADES];
      case EMPTYPES.Contractor:
        return [];
      default:
        return [];
    }
  }, [empType]);

  const minCompletionDate: Date = useMemo(() => {
    // Set the minimumn completion date to be 14 days from the estimated arrival
    if (eta) {
      let newMinDate = new Date(eta);
      newMinDate.setDate(newMinDate.getDate() + 14);
      return newMinDate;
    } else return new Date();
  }, [eta]);

  const onOpen = () => {
    //Populate the React-Hook-Form with the data
    reset(props.data);
  };

  const updateThisRequest = (data: IInRequest) => {
    updateRequest.mutate(data, {
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
        onClick: (ev?, item?) => {
          handleSubmit(updateThisRequest)();
        },
      },
      {
        key: "cancelEdits",
        text: "Cancel",
        iconProps: { iconName: "Cancel" },
        onClick: (ev?, item?) => {
          compProps.onEditCancel();
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
        onOpen={onOpen}
        isBlocking={true}
        onDismiss={props.onEditCancel}
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
                render={({ field: { onBlur, onChange, value } }) => (
                  <PeoplePicker
                    ariaLabel="Employee"
                    aria-describedby="employeeErr"
                    selectedItems={value}
                    updatePeople={(items) => {
                      if (items?.[0]) {
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
                  pattern: {
                    value: /\S/i,
                    message: "Employee Name is required",
                  },
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    key={employee?.[0] ? employee[0].text : "empName"}
                    disabled={employee?.[0] ? true : false}
                    aria-describedby="empNameErr"
                    id="empNameId"
                    placeholder="Supply a manually entered name to be used until they are in the GAL.  Example 'Doe, Jack E'"
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
                rules={{
                  required: "Employee Type is required",
                }}
                render={({ field: { onBlur, onChange, value } }) => (
                  <RadioGroup
                    id="empTypeId"
                    onBlur={onBlur}
                    value={value}
                    onChange={(e, option) => {
                      /* If they change employee type, clear out the related fields */
                      setValue("gradeRank", "");
                      if (option.value === EMPTYPES.Contractor) {
                        setValue("isNewCivMil", "");
                        setValue("prevOrg", "");
                        setValue("isNewToBaseAndCenter", "");
                        setValue("isTraveler", "");
                      } else {
                        setValue("hasExistingCAC", "");
                        setValue("CACExpiration", undefined);
                      }
                      onChange(e, option);
                    }}
                    aria-describedby="empTypeErr"
                    layout="horizontal"
                  >
                    {Object.values(EMPTYPES).map((key) => {
                      return <Radio key={key} value={key} label={key} />;
                    })}
                  </RadioGroup>
                )}
              />
              {errors.empType && (
                <Text id="empTypeErr" className={classes.errorText}>
                  {errors.empType.message}
                </Text>
              )}
            </div>
            <div className={classes.fieldContainer}>
              <Label
                htmlFor="gradeRankId"
                size="small"
                weight="semibold"
                className={classes.fieldLabel}
                required
              >
                <DropdownIcon className={classes.fieldIcon} />
                Grade/Rank
              </Label>
              <Controller
                name="gradeRank"
                control={control}
                rules={{
                  required:
                    empType !== EMPTYPES.Contractor
                      ? "Grade/Rank is required"
                      : "",
                }}
                render={({ field: { onBlur, onChange, value } }) => (
                  <ComboBox
                    id="gradeRankId"
                    aria-describedby="gradeRankErr"
                    autoComplete="on"
                    selectedKey={value}
                    onChange={(_, option) => {
                      if (option?.key) {
                        onChange(option.key);
                      }
                    }}
                    onBlur={onBlur}
                    options={gradeRankOptions}
                    dropdownWidth={100}
                    disabled={empType === EMPTYPES.Contractor}
                  />
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
                required
              >
                <NumberFieldIcon className={classes.fieldIcon} />
                MPCN
              </Label>
              <Controller
                name="MPCN"
                control={control}
                rules={{
                  required: "MPCN is required",
                  pattern: {
                    value: /^\d{7}$/i,
                    message: "MPCN must be 7 digits",
                  },
                }}
                render={({ field }) => (
                  <Input {...field} aria-describedby="MPCNErr" id="MPCNId" />
                )}
              />
              {errors.MPCN && (
                <Text id="MPCNErr" className={classes.errorText}>
                  {errors.MPCN.message}
                </Text>
              )}
              <Text
                weight="regular"
                size={200}
                className={classes.fieldDescription}
              >
                The MPCN is a 7 digit number located on the UMD
              </Text>
            </div>
            <div className={classes.fieldContainer}>
              <Label
                htmlFor="SARId"
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
                rules={{
                  required: "SAR is required",
                  pattern: {
                    value: /^\d$/i,
                    message: "SAR must be 1 digit",
                  },
                }}
                render={({ field }) => (
                  <Input {...field} aria-describedby="SARErr" id="SARId" />
                )}
              />
              {errors.SAR && (
                <Text id="SARErr" className={classes.errorText}>
                  {errors.SAR.message}
                </Text>
              )}
              <Text
                weight="regular"
                size={200}
                className={classes.fieldDescription}
              >
                The SAR is a 1 digit number located on the UMD
              </Text>
            </div>
            <div className={classes.fieldContainer}>
              <Label
                htmlFor="workLocationId"
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
                    aria-describedby="workLocationErr"
                    layout="horizontal"
                  >
                    {WORKLOCATIONS.map((workLocation, i) => {
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
            </div>
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
                        setValue("completionDate", newCompletionDate);
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
                htmlFor="officeId"
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
                rules={{
                  required: "Office is required",
                }}
                render={({ field: { onBlur, onChange, value } }) => (
                  <ComboBox
                    id="officeId"
                    aria-describedby="officeErr"
                    autoComplete="on"
                    selectedKey={value}
                    onChange={(_, option) => {
                      if (option?.key) {
                        onChange(option.key);
                      }
                    }}
                    onBlur={onBlur}
                    options={OFFICES}
                    dropdownWidth={100}
                  />
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
                render={({ field: { onBlur, onChange, value } }) => (
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
            {(empType === EMPTYPES.Civilian ||
              empType === EMPTYPES.Military) && (
              <>
                <div className={classes.fieldContainer}>
                  <Label
                    htmlFor="newCivId"
                    size="small"
                    weight="semibold"
                    className={classes.fieldLabel}
                    required
                  >
                    <ToggleLeftRegular className={classes.fieldIcon} />
                    Is Employee a New Air Force{" "}
                    {empType === EMPTYPES.Civilian ? "Civilian" : "Military"}?
                  </Label>
                  <Controller
                    name="isNewCivMil"
                    control={control}
                    rules={{
                      required: "Selection is required",
                    }}
                    render={({ field: { onBlur, onChange, value } }) => (
                      <RadioGroup
                        onBlur={onBlur}
                        value={value}
                        onChange={(e, option) => {
                          if (option.value === "yes") {
                            setValue("prevOrg", "");
                          }
                          onChange(e, option);
                        }}
                        aria-describedby="isNewCivMilErr"
                        id="newCivId"
                      >
                        <Radio key={"yes"} value={"yes"} label="Yes" />
                        <Radio key={"no"} value={"no"} label="No" />
                      </RadioGroup>
                    )}
                  />
                  {errors.isNewCivMil && (
                    <Text id="isNewCivMilErr" className={classes.errorText}>
                      {errors.isNewCivMil.message}
                    </Text>
                  )}
                </div>
                {isNewCivMil === "no" && (
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
                  </div>
                )}
              </>
            )}
            {(empType === EMPTYPES.Civilian ||
              empType === EMPTYPES.Military) && (
              <div className={classes.fieldContainer}>
                <Label
                  htmlFor="newToBaseAndCenterId"
                  size="small"
                  weight="semibold"
                  className={classes.fieldLabel}
                  required
                >
                  <ToggleLeftRegular className={classes.fieldIcon} />
                  Is Employee new to WPAFB and AFLCMC?
                </Label>
                <Controller
                  name="isNewToBaseAndCenter"
                  control={control}
                  rules={{
                    required: "Selection is required",
                  }}
                  render={({ field }) => (
                    <RadioGroup
                      {...field}
                      aria-describedby="isNewToBaseAndCenterErr"
                      id="newToBaseAndCenterId"
                    >
                      <Radio key={"yes"} value={"yes"} label="Yes" />
                      <Radio key={"no"} value={"no"} label="No" />
                    </RadioGroup>
                  )}
                />
                {errors.isNewToBaseAndCenter && (
                  <Text
                    id="isNewToBaseAndCenterErr"
                    className={classes.errorText}
                  >
                    {errors.isNewToBaseAndCenter.message}
                  </Text>
                )}
              </div>
            )}
            {(empType === EMPTYPES.Civilian ||
              empType === EMPTYPES.Military) && (
              <div className={classes.fieldContainer}>
                <Label
                  htmlFor="isTravelerId"
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
                  rules={{
                    required: "Selection is required",
                  }}
                  render={({ field }) => (
                    <RadioGroup
                      {...field}
                      aria-describedby="isTravelerErr"
                      id="isTravelerId"
                    >
                      <Radio key={"yes"} value={"yes"} label="Yes" />
                      <Radio key={"no"} value={"no"} label="No" />
                    </RadioGroup>
                  )}
                />
                {errors.isTraveler && (
                  <Text id="isTravelerErr" className={classes.errorText}>
                    {errors.isTraveler.message}
                  </Text>
                )}
              </div>
            )}
            {empType === EMPTYPES.Contractor && (
              <>
                <div className={classes.fieldContainer}>
                  <Label
                    htmlFor="hasExistingCACId"
                    size="small"
                    weight="semibold"
                    className={classes.fieldLabel}
                    required
                  >
                    <ToggleLeftRegular className={classes.fieldIcon} />
                    Does the Support Contractor have an Existing CAC?
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
                          id="arrivalDateId"
                          placeholder="Select CAC expiration date"
                          ariaLabel="Select CAC expiration date"
                          aria-describedby="etaErr"
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
              <Button appearance="secondary" onClick={props.onEditCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </FluentProvider>
      </Panel>
    </>
  );
};
