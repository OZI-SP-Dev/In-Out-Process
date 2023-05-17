import { DatePicker } from "@fluentui/react";
import { useContext } from "react";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { EMPTYPES } from "constants/EmpTypes";
import {
  makeStyles,
  Button,
  Text,
  Label,
  Radio,
  RadioGroup,
  tokens,
  Spinner,
  Tooltip,
  Badge,
  Combobox,
  Option,
  Input,
  OptionGroup,
} from "@fluentui/react-components";
import { IOutRequest, useAddRequest } from "api/RequestApi";
import { useForm, Controller } from "react-hook-form";
import { Navigate } from "react-router-dom";
import {
  NumberFieldIcon,
  CalendarIcon,
  DropdownIcon,
  ContactIcon,
  AlertSolidIcon,
  TextFieldIcon,
} from "@fluentui/react-icons-mdl2";
import { RadioButtonFilled, ToggleLeftRegular } from "@fluentui/react-icons";
import { UserContext } from "providers/UserProvider";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";
import { SAR_CODES } from "constants/SARCodes";
import { worklocation, WORKLOCATIONS } from "constants/WorkLocations";
import { OFFICES } from "constants/Offices";
import { OUT_PROCESS_REASONS } from "constants/OutProcessReasons";

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
  listBox: { maxHeight: "15em" },
});

type IRHFIPerson = {
  Id: number;
  Title: string;
  EMail: string;
  text: string;
  imageUrl?: string;
};

// Create a type to handle the IOutRequest type within React Hook Form (RHF)
// This will allow for better typechecking on the RHF without it running into issues with the special IPerson type
type IRHFOutRequest = Omit<
  IOutRequest,
  "empType" | "supGovLead" | "employee" | "workLocation"
> & {
  /* Allow these to be "" so that RHF can set as Controlled rather than Uncontrolled that becomes Controlled */
  empType: EMPTYPES | "";
  workLocation: worklocation | "";
  /* Make of special type to prevent RHF from erroring out on typechecking -- but allow for better form typechecking on all other fields */
  supGovLead: IRHFIPerson;
  employee: IRHFIPerson;
};

const OutRequestNewForm = () => {
  const classes = useStyles();
  const currentUser = useContext(UserContext).user;
  const addRequest = useAddRequest();
  // TODO -- Look to see if when v8 of react-hook-form released if you can properly set useForm to use the type IOutRequest
  //  See -  https://github.com/react-hook-form/react-hook-form/issues/6679
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<IRHFOutRequest>({
    criteriaMode:
      "all" /* Pass back multiple errors, so we can prioritize which one(s) to show */,
    mode: "onChange" /* Provide input directly as they input, so if entering bad data it will let them know */,
  });

  // Set up watches
  const empType = watch("empType");
  const workLocation = watch("workLocation");

  // Redirect the user to the newly created item, if we were able to successfully create it
  if (addRequest.isSuccess) {
    return <Navigate to={"/item/" + addRequest.data.Id} />;
  }

  /**
   * Take the RHF and pass it to the hook to create the Out Processing Request
   *
   * @param data The RHF data containing all the data from the fields the supervisor entered
   */
  const createNewRequest = async (data: IRHFOutRequest) => {
    addRequest.mutate({ ...data, reqType: "Out" } as IOutRequest);
  };

  return (
    <form
      id="outReqForm"
      className={classes.formContainer}
      onSubmit={handleSubmit(createNewRequest)}
    >
      <div className={classes.fieldContainer}>
        <Label
          size="small"
          weight="semibold"
          className={classes.fieldLabel}
          required
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
          id="outReasonId"
          size="small"
          weight="semibold"
          className={classes.fieldLabel}
          required
        >
          <DropdownIcon className={classes.fieldIcon} />
          Reason for Out-processing
        </Label>
        <Controller
          name="outReason"
          control={control}
          defaultValue={""}
          rules={{
            required: "A reason is required",
          }}
          render={({ field: { onBlur, onChange, value } }) => (
            <Combobox
              aria-describedby="outReasonErr"
              aria-labelledby="outReasonId"
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
              {OUT_PROCESS_REASONS.map((reasonGroup) => (
                <OptionGroup key={reasonGroup.key} label={reasonGroup.text}>
                  {reasonGroup.items.map((reasonOption) => (
                    <Option key={reasonOption.key} value={reasonOption.key}>
                      {reasonOption.text}
                    </Option>
                  ))}
                </OptionGroup>
              ))}
            </Combobox>
          )}
        />
        {errors.outReason && (
          <Text id="outReasonErr" className={classes.errorText}>
            {errors.outReason.message}
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
                if (option.value === EMPTYPES.Contractor) {
                  setValue("SAR", undefined);
                  setValue("isTraveler", "");
                }
                if (option.value !== EMPTYPES.Civilian) {
                  setValue("sensitivityCode", undefined);
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
          rules={{
            required:
              empType === EMPTYPES.Civilian || empType === EMPTYPES.Military
                ? "SAR is required"
                : undefined,
          }}
          render={({ field }) => (
            <Combobox
              selectedOptions={field.value ? [field.value.toString()] : [""]}
              value={field.value ? field.value.toString() : ""}
              onOptionSelect={(_event, data) => {
                if (data.optionValue) {
                  field.onChange(parseInt(data.optionValue));
                } else {
                  field.onChange(null);
                }
              }}
              aria-labelledby="SARId"
              aria-describedby="SARErr"
              disabled={empType === EMPTYPES.Contractor}
              placeholder={empType === EMPTYPES.Contractor ? "N/A" : ""}
            >
              {SAR_CODES.map((code) => (
                <Option key={code.key}>{code.text}</Option>
              ))}
            </Combobox>
          )}
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
          id="sensitivityCodeId"
          size="small"
          weight="semibold"
          className={classes.fieldLabel}
          required={empType === EMPTYPES.Civilian}
        >
          <DropdownIcon className={classes.fieldIcon} />
          Position Sensitivity Code
        </Label>
        <Controller
          name="sensitivityCode"
          control={control}
          rules={{
            required:
              empType === EMPTYPES.Civilian
                ? "Position Sensitivity Code is required"
                : undefined,
          }}
          render={({ field: { onBlur, onChange, value } }) => (
            <Combobox
              aria-describedby="sensitivityCodeErr"
              aria-labelledby="sensitivityCodeId"
              autoComplete="on"
              listbox={{ className: classes.listBox }}
              value={
                value
                  ? SENSITIVITY_CODES.find(({ key }) => key === value)?.text
                  : ""
              }
              onOptionSelect={(_event, data) => {
                if (data.optionValue) {
                  onChange(parseInt(data.optionValue));
                } else {
                  onChange(null);
                }
              }}
              onBlur={onBlur}
              disabled={
                empType === EMPTYPES.Contractor || empType === EMPTYPES.Military
              }
              placeholder={
                empType === EMPTYPES.Contractor || empType === EMPTYPES.Military
                  ? "N/A"
                  : empType !== ""
                  ? ""
                  : "Select Employee Type first"
              }
            >
              {SENSITIVITY_CODES.map(({ key, text }) => (
                <Option key={key} value={key.toString()}>
                  {text}
                </Option>
              ))}
            </Combobox>
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
          defaultValue={""}
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
              defaultValue={""}
              rules={{
                required: "Remote Location is required for Remote Employees",
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
              <Text id="workLocationDetailErr" className={classes.errorText}>
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
          htmlFor="departDateId"
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
              id="departDateId"
              placeholder="Enter the last date the employee will be with the current organization."
              ariaLabel="Enter the last date the employee will be with the current organization."
              aria-describedby="lastDayErr"
              onSelectDate={(newDate) => {
                if (newDate) {
                  let newBeginDate = new Date(newDate);
                  newBeginDate.setDate(newBeginDate.getDate() - 7);
                  setValue("beginDate", newBeginDate, { shouldValidate: true });
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
        <Text weight="regular" size={200} className={classes.fieldDescription}>
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
        <Text weight="regular" size={200} className={classes.fieldDescription}>
          Estimate date beginning employee out-processing (Default value is 7
          days prior to Last Date with current organization).
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
          defaultValue={currentUser}
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
      {(empType === EMPTYPES.Civilian || empType === EMPTYPES.Military) && (
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
            Does the employee have GTC and DTS accounts?
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
                aria-labelledby="isTravelerLabelId"
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
      <div className={classes.createButton}>
        <div>
          {addRequest.isLoading && (
            <Spinner
              style={{ justifyContent: "flex-start" }}
              size="small"
              label="Creating Request..."
            />
          )}
          {
            /* TODO -- Replace with some fine grain error handling, so you can retry
                just the failed piece instead of total resubmission */
            !addRequest.isLoading && (
              <Button appearance="primary" type="submit">
                {!addRequest.isError
                  ? "Create Out Processing Request"
                  : "Retry"}
              </Button>
            )
          }
          {addRequest.isError && (
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
                icon={<AlertSolidIcon />}
              />
            </Tooltip>
          )}
        </div>
      </div>
    </form>
  );
};

export default OutRequestNewForm;
