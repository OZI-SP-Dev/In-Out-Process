import { ComboBox, DatePicker, IComboBoxOption } from "@fluentui/react";
import { useContext, useEffect, useMemo } from "react";
import { PeoplePicker } from "../PeoplePicker/PeoplePicker";
import { OFFICES } from "../../constants/Offices";
import { GS_GRADES, NH_GRADES, MIL_GRADES } from "../../constants/GradeRanks";
import { EMPTYPES } from "../../constants/EmpTypes";
import { WORKLOCATIONS } from "../../constants/WorkLocations";
import {
  makeStyles,
  Button,
  Input,
  Text,
  Label,
  Radio,
  RadioGroup,
  tokens,
} from "@fluentui/react-components";
import { UserContext } from "../../providers/UserProvider";
import { IInRequest, RequestApiConfig } from "../../api/RequestApi";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { useEmail } from "../../hooks/useEmail";

/**
 * Enum for holding the possible views of the In Request form view
 * @readonly
 * @enum {number}
 */
export enum INFORMVIEWS {
  //* Compact view for use within other components, to view details of the In Processing Request */
  COMPACT,
  //* Full page view for entering a new In Processing request */
  NEW,
  //* Popup/Inline view for editing details of an exisiting In Processing Request */
  EDIT,
}

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

export const InRequestNewForm = () => {
  const classes = useStyles();
  const userContext = useContext(UserContext);
  const email = useEmail();

  // TODO -- Look to see if when v8 of react-hook-form released if you can properly set useForm to use the type IInRequest
  //  See -  https://github.com/react-hook-form/react-hook-form/issues/6679
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    resetField,
    setValue,
  } = useForm<any>();

  // Set up watches
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

  useEffect(() => {
    if (userContext?.user) {
      const persona = { ...userContext.user };
      resetField("supGovLead", { defaultValue: persona });
    }
  }, [userContext.user, resetField]);

  /* Temporarily show a Loading screen if we don't have the current user info yet. */
  if (!userContext.user) {
    return <>Loading...</>;
  }

  const createNewRequest: SubmitHandler<IInRequest> = async (data) => {
    /* Validation has passed, so create the new Request */
    await email.sendInRequestSubmitEmail(data);

    /* TODO - Save the New Request */
    alert("Notification Staged -- Create feature coming");
    console.log(JSON.stringify(data));
  };

  return (
    <form id="inReqForm" className={classes.formContainer}>
      <Label htmlFor="empNameId">Employee Name</Label>
      <Controller
        name="empName"
        control={control}
        rules={{
          required: "Employee Name is required",
        }}
        render={({ field }) => (
          <Input {...field} aria-describedby="empNameErr" id="empNameId" />
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
            empType !== EMPTYPES.Contractor ? "Grade/Rank is required" : "",
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
      <Label htmlFor="arrivalDateId">Select estimated on-boarding date</Label>
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
                newCompletionDate.setDate(newCompletionDate.getDate() + 28);
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
      <Label htmlFor="completionDateId">Select target completion date</Label>
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
      {(empType === EMPTYPES.Civilian || empType === EMPTYPES.Military) && (
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
      {(empType === EMPTYPES.Civilian || empType === EMPTYPES.Military) && (
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
            <Text id="isNewToBaseAndCenterErr" className={classes.errorText}>
              {errors.isNewToBaseAndCenter.message}
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
                <Text id="CACExpirationErr" className={classes.errorText}>
                  {errors.CACExpiration.message}
                </Text>
              )}
            </>
          )}
        </>
      )}

      {/*-- Button to show if it is a New Form */}
      {/* TODO: Implement Saving In Processing Request */}
      <Button
        appearance="primary"
        onClick={() => {
          handleSubmit(createNewRequest)();
        }}
      >
        Create In Processing Record
      </Button>
    </form>
  );
};
