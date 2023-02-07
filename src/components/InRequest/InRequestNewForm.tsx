import { ComboBox, DatePicker, IComboBoxOption } from "@fluentui/react";
import { useContext, useMemo } from "react";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { OFFICES } from "constants/Offices";
import { GS_GRADES, NH_GRADES, MIL_GRADES } from "constants/GradeRanks";
import { EMPTYPES } from "constants/EmpTypes";
import { worklocation, WORKLOCATIONS } from "constants/WorkLocations";
import {
  makeStyles,
  Button,
  Input,
  Text,
  Label,
  Radio,
  RadioGroup,
  tokens,
  Spinner,
  Tooltip,
  Badge,
} from "@fluentui/react-components";
import { IInRequest, useAddRequest } from "api/RequestApi";
import { useAddTasks } from "api/CreateChecklistItems";
import { useForm, Controller } from "react-hook-form";
import { useSendInRequestSubmitEmail } from "api/EmailApi";
import { useNavigate } from "react-router-dom";
import {
  TextFieldIcon,
  NumberFieldIcon,
  CalendarIcon,
  DropdownIcon,
  ContactIcon,
  AlertSolidIcon,
} from "@fluentui/react-icons-mdl2";
import { ToggleLeftRegular, RadioButtonFilled } from "@fluentui/react-icons";
import { UserContext } from "providers/UserProvider";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";

/* FluentUI Styling */
const useStyles = makeStyles({
  formContainer: { display: "grid" },
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
  fieldDescription: {
    display: "block",
  },
  createButton: {
    display: "grid",
    justifyContent: "end",
    marginLeft: "1em",
    marginRight: "1em",
    marginTop: ".5em",
    marginBottom: ".5em",
  },
});

type IRHFIPerson = {
  Id: number;
  Title: string;
  EMail: string;
  text: string;
  imageUrl?: string;
};

// Create a type to handle the IInRequest type within React Hook Form (RHF)
// This will allow for better typechecking on the RHF without it running into issues with the special IPerson type
type IRHFInRequest = Omit<
  IInRequest,
  "empType" | "workLocation" | "supGovLead" | "employee"
> & {
  /* Allowthese to be "" so that RHF can set as Controlled rather than Uncontrolled that becomes Controlled */
  empType: EMPTYPES | "";
  workLocation: worklocation | "";
  /* Make of special type to prevent RHF from erroring out on typechecking -- but allow for better form typechecking on all other fields */
  supGovLead: IRHFIPerson;
  employee: IRHFIPerson;
};

export const InRequestNewForm = () => {
  const classes = useStyles();
  const currentUser = useContext(UserContext).user;
  const sendSubmitEmail = useSendInRequestSubmitEmail();
  const addRequest = useAddRequest();
  const addTasks = useAddTasks();
  const navigate = useNavigate();

  // TODO -- Look to see if when v8 of react-hook-form released if you can properly set useForm to use the type IInRequest
  //  See -  https://github.com/react-hook-form/react-hook-form/issues/6679
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    register,
  } = useForm<IRHFInRequest>();

  // Set up watches
  const empType = watch("empType");
  const isNewCivMil = watch("isNewCivMil");
  const hasExistingCAC = watch("hasExistingCAC");
  const eta = watch("eta");
  const employee = watch("employee");

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

  const createNewRequest = async (data: IRHFInRequest) => {
    /* Use the mutateAsync calls for the first 2, as these will return
        a Promise, which will get caught if it errors, and exit submitting. 
        For email, we don't need to trap the error, so no need to mutateAsync*/

    try {
      // Create the Request first
      let newRequest = await addRequest.mutateAsync(data as IInRequest);

      // If successful, then Create the tasks using that new Request Id
      await addTasks.mutateAsync(newRequest.data);

      // If successful, then send the Email
      await sendSubmitEmail.mutate(newRequest.data as IInRequest);

      // If the first 2 were successful, then navigate even if email fails, as it gets added to banner
      navigate("/item/" + newRequest.data.Id);
    } catch {
      // TODO - Add some advance handling to try just recreating the tasks if it was the tasks that failed
    }
  };

  return (
    <form
      id="inReqForm"
      className={classes.formContainer}
      onSubmit={handleSubmit(createNewRequest)}
    >
      <div className={classes.fieldContainer}>
        <Label size="small" weight="semibold" className={classes.fieldLabel}>
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
          defaultValue={""}
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
              disabled={employee?.text ? true : false}
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
          defaultValue={""}
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
                  setValue("isSupervisor", "");
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
          defaultValue={""}
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
        <Input
          {...register("MPCN", {
            required: "MPCN is required",
            pattern: {
              value: /^\d{7}$/i,
              message: "MPCN must be 7 digits",
            },
          })}
          aria-describedby="MPCNErr"
          id="MPCNId"
        />
        {errors.MPCN && (
          <Text id="MPCNErr" className={classes.errorText}>
            {errors.MPCN.message}
          </Text>
        )}
        <Text weight="regular" size={200} className={classes.fieldDescription}>
          If you do not know the MPCN, please reference the UMD or contact your
          HR liaison.
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
        <Input
          {...register("SAR", {
            required: "SAR is required",
            min: { value: 0, message: "SAR must be 1 digit" },
            max: { value: 9, message: "SAR must be 1 digit" },
            valueAsNumber: true,
          })}
          aria-describedby="SARErr"
          type="number"
          id="SARId"
        />
        {errors.SAR && (
          <Text id="SARErr" className={classes.errorText}>
            {errors.SAR.message}
          </Text>
        )}
        <Text weight="regular" size={200} className={classes.fieldDescription}>
          If you do not know the SAR, please reference the UMD or contact your
          HR liaison.
        </Text>
      </div>
      <div className={classes.fieldContainer}>
        <Label
          htmlFor="sensitivityCodeId"
          size="small"
          weight="semibold"
          className={classes.fieldLabel}
          required
        >
          <DropdownIcon className={classes.fieldIcon} />
          Position Sensitivity Code
        </Label>
        <Controller
          name="sensitivityCode"
          control={control}
          rules={{
            required: "Position Sensitivity Code is required",
          }}
          render={({ field: { onBlur, onChange, value } }) => (
            <ComboBox
              id="sensitivityCodeId"
              aria-describedby="sensitivityCodeErr"
              autoComplete="on"
              selectedKey={value}
              onChange={(_, option) => {
                if (option?.key) {
                  onChange(option.key);
                }
              }}
              onBlur={onBlur}
              options={SENSITIVITY_CODES}
            />
          )}
        />
        {errors.sensitivityCode && (
          <Text id="sensitivityCode" className={classes.errorText}>
            {errors.sensitivityCode.message}
          </Text>
        )}
        <Text weight="regular" size={200} className={classes.fieldDescription}>
          If you do not know the code, please reference the position documents
          or contact your HR liason.
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
          defaultValue={""}
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
          defaultValue={currentUser}
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
      {(empType === EMPTYPES.Civilian || empType === EMPTYPES.Military) && (
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
              defaultValue={""}
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
                defaultValue={""}
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
      {(empType === EMPTYPES.Civilian || empType === EMPTYPES.Military) && (
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
            defaultValue={""}
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
        </div>
      )}
      {(empType === EMPTYPES.Civilian || empType === EMPTYPES.Military) && (
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
            defaultValue={""}
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
      {(empType === EMPTYPES.Civilian || empType === EMPTYPES.Military) && (
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
            rules={{
              required: "Selection is required",
            }}
            render={({ field }) => (
              <RadioGroup
                {...field}
                aria-describedby="isSupervisorErr"
                id="isSupervisorId"
              >
                <Radio key={"yes"} value={"yes"} label="Yes" />
                <Radio key={"no"} value={"no"} label="No" />
              </RadioGroup>
            )}
          />
          {errors.isSupervisor && (
            <Text id="isSupervisorErr" className={classes.errorText}>
              {errors.isSupervisor.message}
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
              defaultValue=""
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
                    id="CACExpirationId"
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

      <div className={classes.createButton}>
        <div>
          {addRequest.isLoading && (
            <Spinner
              style={{ justifyContent: "flex-start" }}
              size="small"
              label="Creating Request..."
            />
          )}
          {addTasks.isLoading && (
            <Spinner
              style={{ justifyContent: "flex-start" }}
              size="small"
              label="Adding Checklist Items..."
            />
          )}
          {sendSubmitEmail.isLoading && (
            <Spinner
              style={{ justifyContent: "flex-start" }}
              size="small"
              label="Sending Notification..."
            />
          )}
          {!isSubmitting && !(addRequest.isError || addTasks.isError) && (
            <Button appearance="primary" type="submit">
              Create In Processing Request
            </Button>
          )}
          {!isSubmitting && (addRequest.isError || addTasks.isError) && (
            /* TODO -- Replace with some fine grain error handling, so you can retry
                just the failed piece instead of total resubmission */
            <Button appearance="primary" type="submit">
              Retry
            </Button>
          )}
          {!isSubmitting && addRequest.isError && (
            <Tooltip
              content={
                addRequest.error instanceof Error
                  ? addRequest.error.message
                  : "An error occurred."
              }
              relationship="label"
            >
              <Badge
                size="extra-large"
                appearance="ghost"
                color="danger"
                style={{ verticalAlign: "middle" }}
                icon={<AlertSolidIcon />}
              />
            </Tooltip>
          )}
          {!isSubmitting && addTasks.isError && (
            <Tooltip
              content={
                addTasks.error instanceof Error
                  ? addTasks.error.message
                  : "An error occurred."
              }
              relationship="label"
            >
              <Badge
                size="extra-large"
                appearance="ghost"
                color="danger"
                style={{ verticalAlign: "middle" }}
                icon={<AlertSolidIcon />}
              />
            </Tooltip>
          )}
        </div>
      </div>
    </form>
  );
};
