import { DatePicker } from "@fluentui/react";
import { useContext, useMemo, useState } from "react";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { OFFICES } from "constants/Offices";
import { CIV_GRADES, MIL_RANKS } from "constants/GradeRanks";
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
  Combobox,
  Option,
  OptionGroup,
  InfoLabel,
} from "@fluentui/react-components";
import { IInRequest, useAddRequest } from "api/RequestApi";
import { useForm, Controller } from "react-hook-form";
import { Navigate } from "react-router-dom";
import {
  TextFieldIcon,
  NumberFieldIcon,
  CalendarIcon,
  DropdownIcon,
  ContactIcon,
  AlertSolidIcon,
} from "@fluentui/react-icons-mdl2";
import {
  ToggleLeftRegular,
  RadioButtonFilled,
  Eye16Regular,
  Eye16Filled,
} from "@fluentui/react-icons";
import { UserContext } from "providers/UserProvider";
import { SENSITIVITY_CODES } from "constants/SensitivityCodes";
import { SAR_CODES } from "constants/SARCodes";
import { useAddAdditionalInfo } from "api/AdditionalInfoApi";

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

// Create a type to handle the IInRequest type within React Hook Form (RHF)
type IRHFInRequest = Omit<IInRequest, "empType" | "workLocation"> & {
  /* Allowthese to be "" so that RHF can set as Controlled rather than Uncontrolled that becomes Controlled */
  empType: EMPTYPES | "";
  workLocation: worklocation | "";
  SSN: string;
};

const InRequestNewForm = () => {
  const classes = useStyles();
  const currentUser = useContext(UserContext).user;
  const addRequest = useAddRequest();
  const addAdditionalInfo = useAddAdditionalInfo();
  const [showSSN, setShowSSN] = useState(false);
  // TODO -- Look to see if when v8 of react-hook-form released if you can properly set useForm to use the type IInRequest
  //  See -  https://github.com/react-hook-form/react-hook-form/issues/6679
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<IRHFInRequest>({
    criteriaMode:
      "all" /* Pass back multiple errors, so we can prioritize which one(s) to show */,
    mode: "onChange" /* Provide input directly as they input, so if entering bad data (eg letter in MPCN) it will let them know */,
  });

  // Set up watches
  const empType = watch("empType");
  const isNewCivMil = watch("isNewCivMil");
  const hasExistingCAC = watch("hasExistingCAC");
  const eta = watch("eta");
  const employee = watch("employee");
  const workLocation = watch("workLocation");
  const SAR = watch("SAR");

  const validateMPCN = (value?: string) => {
    if (!value || value === "") {
      return "MPCN must be at least 7 characters";
    } else if (
      value.length !== 0 &&
      value.length < 7 &&
      !"RAND000-".startsWith(value.toUpperCase()) &&
      !value.match(/^\d{0,6}$/)
    ) {
      return "MPCN cannot contain non-numeric characters in the first 6 positions, unless it starts with 'RAND000-'";
    } else if (
      value.length !== 0 &&
      value.length < 8 &&
      "RAND000-".startsWith(value.toUpperCase())
    ) {
      return "MPCNs starting with 'RAND000-' must be followed by 6 digits";
    } else if (value.length < 7) {
      return "MPCN must be at least 7 characters";
    } else if (
      value.length > 7 &&
      !value.toUpperCase().startsWith("RAND000-")
    ) {
      return "MPCN cannot be more than 7 characters, unless it starts with 'RAND000-'";
    } else if (value.length > 7 && !value.match(/^RAND000-\d{6}$/i)) {
      return "MPCNs starting with 'RAND000-' must be followed by 6 digits";
    } else if (value.length === 7 && !value.match(/^\d{6}[A-Z|a-z|0-9]$/i)) {
      return "MPCNs that are 7 characters must either be 7 digits, or 6 digits followed by a letter";
    }
    return;
  };

  const gradeRankOptions = useMemo(() => {
    switch (empType) {
      case EMPTYPES.Civilian:
        return CIV_GRADES;
      case EMPTYPES.Military:
        return MIL_RANKS;
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

  // If it isn't a CTR, then we need to ensure both mutates return successfully
  //  Otherwise just the addRequest needs to return successful
  if (
    addRequest.isSuccess &&
    (empType === EMPTYPES.Contractor ? true : addAdditionalInfo.isSuccess)
  ) {
    return <Navigate to={"/item/" + addRequest.data.Id} />;
  }

  const createNewRequest = async (data: IRHFInRequest) => {
    const data2 = {
      ...data,
      reqType: "In",
      SSN: undefined,
    } as IInRequest;

    const newRequest = await addRequest.mutateAsync(data2);

    if (data2.empType !== EMPTYPES.Contractor) {
      addAdditionalInfo.mutate({
        Id: -1,
        RequestId: newRequest.Id,
        Title: data.SSN,
      });
    }
  };

  return (
    <form
      id="inReqForm"
      className={classes.formContainer}
      onSubmit={handleSubmit(createNewRequest)}
    >
      <div className={classes.fieldContainer}>
        <Text align="center">CUI - PRVCY</Text>
      </div>
      <div className={classes.fieldContainer}>
        <Label size="small" weight="semibold" className={classes.fieldLabel}>
          <ContactIcon className={classes.fieldIcon} />
          Employee from GAL (skip if not in GAL)
        </Label>
        <Controller
          name="employee"
          control={control}
          rules={{
            validate: (value) => {
              return value?.EMail === currentUser.EMail
                ? "You cannot submit a request for yourself"
                : undefined;
            },
          }}
          render={({ field: { onChange, value } }) => (
            <PeoplePicker
              ariaLabel="Employee"
              aria-describedby="employeeErr"
              selectedItems={value ?? []}
              updatePeople={(items) => {
                if (items?.[0]?.text) {
                  setValue("empName", items[0].text, { shouldValidate: true });
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
          defaultValue={""}
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
                  setValue("isTraveler", "");
                  setValue("isSupervisor", "");
                  setValue("MPCN", "");
                  setValue("SAR", undefined);
                  setValue("SSN", "");
                } else {
                  setValue("hasExistingCAC", "");
                  setValue("CACExpiration", undefined);
                  setValue("contractNumber", "");
                  setValue("contractEndDate", undefined);
                }

                if (option.value !== EMPTYPES.Civilian) {
                  setValue("sensitivityCode", undefined);
                }

                if (option.value !== EMPTYPES.Military) {
                  setValue("isSCI", "");
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
          htmlFor="SSNId"
          size="small"
          weight="semibold"
          className={classes.fieldLabel}
          required={
            empType === EMPTYPES.Civilian || empType === EMPTYPES.Military
          }
        >
          <NumberFieldIcon className={classes.fieldIcon} />
          SSN
        </Label>
        <Controller
          name="SSN"
          control={control}
          defaultValue={""}
          rules={{
            required:
              (empType === EMPTYPES.Civilian ||
                empType === EMPTYPES.Military) &&
              "SSN is required",
            minLength: {
              value: 9,
              message: "SSN cannot be less than 9 digits",
            },
            maxLength: {
              value: 9,
              message: "SSN cannot be more than 9 digits",
            },
            pattern: {
              value:
                /^\d+$/ /* We don't want the pattern to enforce 9 numbers so we can have a unique error for non-numeric (eg letters/symbols) */,
              message: "SSN can only consist of numbers",
            },
          }}
          render={({ field }) => (
            <Input
              {...field}
              disabled={empType === EMPTYPES.Contractor}
              placeholder={
                empType === EMPTYPES.Contractor
                  ? "N/A"
                  : empType !== ""
                  ? ""
                  : "Select Employee Type first"
              }
              contentAfter={
                !showSSN ? (
                  <Eye16Regular
                    onClick={() => {
                      setShowSSN(true);
                    }}
                  />
                ) : (
                  <Eye16Filled
                    onClick={() => {
                      setShowSSN(false);
                    }}
                  />
                )
              }
              aria-describedby="SSNErr"
              id="SSNId"
              autoComplete="off"
              inputMode="numeric"
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value.replace(
                  /\D+/g,
                  ""
                );
              }}
              type={!showSSN ? "password" : "text"}
            />
          )}
        />
        {errors.SSN && (
          <Text id="SSNErr" className={classes.errorText}>
            {errors.SSN.message}
          </Text>
        )}
      </div>
      <div className={classes.fieldContainer}>
        <Label
          htmlFor="jobTitleId"
          size="small"
          weight="semibold"
          className={classes.fieldLabel}
          required
        >
          <NumberFieldIcon className={classes.fieldIcon} />
          Job/Duty Title
        </Label>
        <Controller
          name="jobTitle"
          control={control}
          defaultValue={""}
          rules={{
            required: "Job/Duty Title is required",
            maxLength: {
              value: 100,
              message: "Job/Duty Title cannot be longer than 100 characters",
            },
          }}
          render={({ field }) => (
            <Input {...field} aria-describedby="jobTitleErr" id="jobTitleId" />
          )}
        />
        {errors.jobTitle && (
          <Text id="jobTitleErr" className={classes.errorText}>
            {errors.jobTitle.message}
          </Text>
        )}
      </div>
      <div className={classes.fieldContainer}>
        <Label
          htmlFor="dutyPhoneId"
          size="small"
          weight="semibold"
          className={classes.fieldLabel}
          required
        >
          <NumberFieldIcon className={classes.fieldIcon} />
          Duty Phone #
        </Label>
        <Controller
          name="dutyPhone"
          control={control}
          defaultValue={""}
          rules={{
            required: "Duty Phone # is required",
            pattern: {
              value: /^\d{3}-\d{3}-\d{4}$/,
              message: "Phone number must be of the form ###-###-####",
            },
          }}
          render={({ field }) => (
            <Input
              {...field}
              aria-describedby="dutyPhoneErr"
              onInput={(e) => {
                let endsDash = false;
                if (e.currentTarget.value.match(/-$/)) {
                  endsDash = true;
                }
                e.currentTarget.value = e.currentTarget.value.replace(
                  /\D/g,
                  ""
                );
                const size = e.currentTarget.value.length;
                if (size > 3 || endsDash) {
                  // If we have more than 3 numbers, or we have either ###- or ###-###-
                  // The second condition allows them to type a dash, otherwise the code would "reject" it
                  e.currentTarget.value =
                    e.currentTarget.value.slice(0, 3) +
                    "-" +
                    e.currentTarget.value.slice(3, 11);
                }
                if (size > 6 || (size > 5 && endsDash)) {
                  e.currentTarget.value =
                    e.currentTarget.value.slice(0, 7) +
                    "-" +
                    e.currentTarget.value.slice(7);
                }
              }}
              type="tel"
              id="dutyPhoneId"
            />
          )}
        />
        {errors.dutyPhone && (
          <Text id="dutyPhoneErr" className={classes.errorText}>
            {errors.dutyPhone.message}
          </Text>
        )}
      </div>
      <div className={classes.fieldContainer}>
        <Label
          id="gradeRankId"
          size="small"
          weight="semibold"
          className={classes.fieldLabel}
          required={
            empType === EMPTYPES.Civilian || empType === EMPTYPES.Military
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
              empType !== EMPTYPES.Contractor ? "Grade/Rank is required" : "",
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
              disabled={empType === EMPTYPES.Contractor}
              placeholder={
                empType === EMPTYPES.Contractor
                  ? "N/A"
                  : empType !== ""
                  ? ""
                  : "Select Employee Type first"
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
        <InfoLabel
          htmlFor="MPCNId"
          size="small"
          weight="semibold"
          info={
            <Text>
              Acceptable formats are:
              <ul>
                <li>
                  <b>Standard:</b> 7 digits
                </li>
                <li>
                  <b>Over hire:</b> 6 digits + 1 letter
                </li>
                <li>
                  <b>PAQ/COPPER CAP:</b> 'RAND000-' + 6 digits
                </li>
              </ul>
            </Text>
          }
          className={classes.fieldLabel}
          required={
            empType === EMPTYPES.Civilian || empType === EMPTYPES.Military
          }
        >
          <NumberFieldIcon className={classes.fieldIcon} />
          MPCN
        </InfoLabel>
        <Controller
          name="MPCN"
          control={control}
          defaultValue={""}
          rules={{
            validate:
              empType === EMPTYPES.Contractor ? undefined : validateMPCN,
          }}
          render={({ field }) => (
            <Input
              {...field}
              disabled={empType === EMPTYPES.Contractor}
              aria-describedby="MPCNErr"
              id="MPCNId"
              placeholder={empType === EMPTYPES.Contractor ? "N/A" : ""}
              onChange={(_event, data) =>
                field.onChange(data.value.toUpperCase())
              }
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
        <Text weight="regular" size={200} className={classes.fieldDescription}>
          If you do not know the MPCN, please reference the UMD or contact your
          HR liaison.
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
                  aria-labelledby="isNewCivMilId"
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
                Entry should include Higher HQ / Directorate; examples AFRL/RD,
                AFLCMC/HI, SAF/AQ
              </Text>
            </div>
          )}
        </>
      )}
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
            defaultValue={""}
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
      {empType === EMPTYPES.Military && SAR === 5 && (
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
            defaultValue={""}
            rules={{
              required: "Selection is required",
            }}
            render={({ field }) => (
              <RadioGroup
                {...field}
                aria-labelledby="isSCIId"
                aria-describedby="isSCIErr"
                id="isSCIId"
              >
                <Radio key={"yes"} value={"yes"} label="Yes" />
                <Radio key={"no"} value={"no"} label="No" />
              </RadioGroup>
            )}
          />
          {errors.isSCI && (
            <Text id="isSCIErr" className={classes.errorText}>
              {errors.isSCI.message}
            </Text>
          )}
        </div>
      )}
      {empType === EMPTYPES.Contractor && (
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
              defaultValue={""}
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

      <div className={classes.createButton}>
        <div>
          {(addRequest.isLoading || addAdditionalInfo.isLoading) && (
            <Spinner
              style={{ justifyContent: "flex-start" }}
              size="small"
              label="Creating Request..."
            />
          )}
          {
            /* TODO -- Replace with some fine grain error handling, so you can retry
                just the failed piece instead of total resubmission */
            !addRequest.isLoading && !addAdditionalInfo.isLoading && (
              <Button appearance="primary" type="submit">
                {!addRequest.isError && !addAdditionalInfo.isError
                  ? "Create In Processing Request"
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
          {addAdditionalInfo.isError && (
            <Tooltip
              content={
                addAdditionalInfo.error instanceof Error
                  ? addAdditionalInfo.error.message
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
      <div className={classes.fieldContainer}>
        <Text align="center">CUI - PRVCY</Text>
      </div>
    </form>
  );
};

export default InRequestNewForm;
