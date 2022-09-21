import { Panel } from "@fluentui/react";
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
  Tooltip,
} from "@fluentui/react-components";
import { ComboBox, DatePicker, IComboBoxOption } from "@fluentui/react";
import { Info16Filled } from "@fluentui/react-icons";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { EMPTYPES } from "constants/EmpTypes";
import {
  GS_GRADES,
  MIL_GRADES,
  NH_GRADES,
  OFFICES,
} from "constants/GradeRanks";
import { WORKLOCATIONS } from "constants/WorkLocations";
import { IInRequest, RequestApiConfig } from "api/RequestApi";

/* FluentUI Styling */
const useStyles = makeStyles({
  formContainer: { display: "grid", paddingLeft: "1em", paddingRight: "1em" },
  floatRight: {
    float: "right",
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
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

  // Setup watches
  const empType = watch("empType");
  const isNewCivMil = watch("isNewCivMil");
  const hasExistingCAC = watch("hasExistingCAC");
  const eta = watch("eta");

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
    const transRes = {
      ...props.data,
      hasExistingCAC: props.data?.hasExistingCAC ? "yes" : "no",
      isNewCivMil: props.data?.isNewCivMil ? "yes" : "no",
      isNewToBaseAndCenter: props.data?.isNewToBaseAndCenter ? "yes" : "no",
      isTraveler: props.data?.isTraveler ? "yes" : "no",
    };
    //Populate the React-Hook-Form with the transformed data
    reset(transRes);
  };

  const updateRequest: SubmitHandler<IInRequest> = (data) => {
    const requestApi = RequestApiConfig.getApi();
    /* Validation has passed, so update the request */

    // Transform "yes" / "no" to true/false
    const hasExistingCAC = data?.hasExistingCAC ? true : false;
    const isNewCivMil = data?.isNewCivMil ? true : false;
    const isNewToBaseAndCenter = data?.isNewToBaseAndCenter ? true : false;
    const isTraveler = data?.isTraveler ? true : false;

    let dataCopy = {
      ...data,
      hasExistingCAC,
      isNewCivMil,
      isNewToBaseAndCenter,
      isTraveler,
    };

    // If it isn't a Civ/Mil, ensure values depending on Civ/Mil only are set correctly
    if (
      dataCopy.empType !== EMPTYPES.Civilian &&
      dataCopy.empType !== EMPTYPES.Military
    ) {
      dataCopy.isNewCivMil = false;
      dataCopy.prevOrg = "";
      dataCopy.isNewToBaseAndCenter = false;
      dataCopy.isTraveler = false;
    } else {
      // If it is a new Civ/Mil then ensure prevOrg is set to ""
      if (dataCopy.isNewCivMil === false) {
        dataCopy.prevOrg = "";
      }
    }

    if (dataCopy.empType !== EMPTYPES.Contractor) {
      // If Employee is not a CTR then we should set hasExistingCAC to false and CACExpiration to undefined
      dataCopy.hasExistingCAC = false;
      dataCopy.CACExpiration = undefined;
    } else {
      if (!dataCopy.hasExistingCAC) {
        // If the CTR doesn't have an Existing CAC, set the CACExpiration to undefined
        dataCopy.CACExpiration = undefined;
      }
    }
    requestApi.updateItem(dataCopy);
    //setFormData(dataCopy);
    props.onEditSave();
  };

  // The footer of the EditPanel, containing the "Save" and "Cancel" buttons
  const onRenderFooterContent = () => (
    <FluentProvider theme={webLightTheme}>
      <div>
        {/*<Button appearance="primary" onClick={props.onEditSave}>*/}
        <Button appearance="primary" onClick={handleSubmit(updateRequest)}>
          Save
        </Button>
        <Button appearance="secondary" onClick={props.onEditCancel}>
          Cancel
        </Button>
      </div>
    </FluentProvider>
  );

  return (
    <>
      <Panel
        isOpen={props.isEditPanelOpen}
        onOpen={onOpen}
        isBlocking={true}
        onDismiss={props.onEditCancel}
        headerText="Edit Request"
        isFooterAtBottom={true}
        onRenderFooterContent={onRenderFooterContent}
      >
        <FluentProvider theme={webLightTheme}>
          <>
            <form id="inReqForm" className={classes.formContainer}>
              <Label htmlFor="empNameId">Employee Name</Label>
              <Controller
                name="empName"
                control={control}
                rules={{
                  required: "Employee Name is required",
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    aria-describedby="empNameErr"
                    id="empNameId"
                  />
                )}
              />
              {errors.empName && (
                <Text id="empNameErr" className={classes.errorText}>
                  {errors.empName.message}
                </Text>
              )}
              <Label htmlFor="empTypeId">Employee Type</Label>
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
                      /* If they change employee type, clear out the selected grade */
                      setValue("gradeRank", "");
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
              <Label htmlFor="gradeRankId">Grade/Rank</Label>
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
              <Label htmlFor="MPCNId">
                MPCN
                <Tooltip
                  content="The MPCN is a 7 digit number located on the UMD"
                  relationship="label"
                  appearance="inverted"
                  withArrow={true}
                  positioning={"after"}
                >
                  <span>
                    <Info16Filled />
                  </span>
                </Tooltip>
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
              <Label htmlFor="SARId">
                SAR
                <Tooltip
                  content="The SAR is a 1 digit number located on the UMD"
                  relationship="label"
                  appearance="inverted"
                  withArrow={true}
                  positioning={"after"}
                >
                  <span>
                    <Info16Filled />
                  </span>
                </Tooltip>
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
              <Label htmlFor="workLocationId">Local or Remote?</Label>
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
              <Label htmlFor="arrivalDateId">
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
              <Label htmlFor="completionDateId">
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
              <Label htmlFor="officeId">Office</Label>
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
              <Label>Supervisor/Government Lead</Label>
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
                    defaultValue={value}
                    updatePeople={(items) => {
                      if (items[0]) {
                        onChange(items[0]);
                      } else {
                        onChange();
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
              {(empType === EMPTYPES.Civilian ||
                empType === EMPTYPES.Military) && (
                <>
                  <Label htmlFor="newCivId">
                    Is Employee a New Air Force{" "}
                    {empType === EMPTYPES.Civilian ? "Civilian" : "Military"}?
                  </Label>
                  <Controller
                    name="isNewCivMil"
                    control={control}
                    rules={{
                      required: "Selection is required",
                    }}
                    render={({ field }) => (
                      <RadioGroup
                        {...field}
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
                  {isNewCivMil === "no" && (
                    <>
                      <Label htmlFor="prevOrgId">Previous Organization</Label>
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
                    </>
                  )}
                </>
              )}
              {(empType === EMPTYPES.Civilian ||
                empType === EMPTYPES.Military) && (
                <>
                  <Label htmlFor="newToBaseAndCenterId">
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
                </>
              )}
              {(empType === EMPTYPES.Civilian ||
                empType === EMPTYPES.Military) && (
                <>
                  <Label htmlFor="isTravelerId">
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
                </>
              )}
              {empType === EMPTYPES.Contractor && (
                <>
                  <Label htmlFor="hasExistingCACId">
                    Does the Support Contractor have an Existing CAC?
                  </Label>
                  <Controller
                    name="hasExistingCAC"
                    control={control}
                    rules={{
                      required: "Selection is required",
                    }}
                    render={({ field }) => (
                      <RadioGroup
                        {...field}
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
                  {hasExistingCAC === "yes" && (
                    <>
                      <Label htmlFor="CACExpirationId">CAC Expiration</Label>
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
                        <Text
                          id="CACExpirationErr"
                          className={classes.errorText}
                        >
                          {errors.CACExpiration.message}
                        </Text>
                      )}
                    </>
                  )}
                </>
              )}
            </form>
          </>
        </FluentProvider>
      </Panel>
    </>
  );
};
