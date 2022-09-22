import { ComboBox, DatePicker, IComboBoxOption } from "@fluentui/react";
import { Info16Filled } from "@fluentui/react-icons";
import { useMemo } from "react";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { OFFICES } from "constants/Offices";
import { GS_GRADES, NH_GRADES, MIL_GRADES } from "constants/GradeRanks";
import { EMPTYPES } from "constants/EmpTypes";
import { WORKLOCATIONS } from "constants/WorkLocations";
import {
  makeStyles,
  Button,
  Input,
  Text,
  Label,
  Radio,
  RadioGroup,
  tokens,
  Tooltip,
  Checkbox,
} from "@fluentui/react-components";
import { useCurrentUser } from "api/UserApi";
import { IInRequest, useAddRequest } from "api/RequestApi";
import { useAddTasks } from "api/CreateChecklistItems";
import { useForm, Controller } from "react-hook-form";
import { useEmail } from "hooks/useEmail";
import { useNavigate } from "react-router-dom";

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
  const currentUser = useCurrentUser();
  const email = useEmail();
  const addRequest = useAddRequest();
  const addTasks = useAddTasks();
  const navigate = useNavigate();

  // TODO -- Look to see if when v8 of react-hook-form released if you can properly set useForm to use the type IInRequest
  //  See -  https://github.com/react-hook-form/react-hook-form/issues/6679
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<any>();

  // Set up watches
  const empType = watch("empType");
  const isNewCivMil = watch("isNewCivMil");
  const hasExistingCAC = watch("hasExistingCAC");
  const eta = watch("eta");
  const isEmpNotInGAL = watch("isEmpNotInGAL");

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

  const createNewRequest = (data: IInRequest) => {
    email.sendInRequestSubmitEmail(data);
    addRequest.mutate(data, {
      onSuccess: (newData) => {
        addTasks.mutate(newData.data, {
          onSuccess: () => {
            navigate("/item/" + newData.data.Id);
          },
        });
      },
    });
  };

  return (
    <form
      id="inReqForm"
      className={classes.formContainer}
      onSubmit={handleSubmit(createNewRequest)}
    >
      <Label htmlFor="empNameId" weight="semibold" required>
        Employee Name
      </Label>
      {!isEmpNotInGAL && (
        <>
          <Controller
            name="employee"
            control={control}
            rules={{
              required: "Employee Name is required",
            }}
            render={({ field: { onBlur, onChange, value } }) => (
              <PeoplePicker
                ariaLabel="Employee"
                aria-describedby="employeeErr"
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
          {errors.employee && (
            <Text id="employeeErr" className={classes.errorText}>
              {errors.employee.message}
            </Text>
          )}
        </>
      )}
      <Controller
        name="isEmpNotInGAL"
        control={control}
        render={({ field }) => (
          <Checkbox {...field} label="Employee is not in the GAL"></Checkbox>
        )}
      />
      {isEmpNotInGAL && (
        <>
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
        </>
      )}
      <Label htmlFor="empTypeId" weight="semibold" required>
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
      <Label htmlFor="gradeRankId" weight="semibold" required>
        Grade/Rank
      </Label>
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
      <Label htmlFor="MPCNId" weight="semibold" required>
        MPCN
        <Tooltip
          content="The MPCN is a 7 digit number located on the UMD"
          relationship="label"
          appearance="inverted"
          withArrow={true}
          positioning={"after"}
        >
          <span id="MPCNInfoId">
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
      <Label htmlFor="SARId" weight="semibold" required>
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
      <Label htmlFor="workLocationId" weight="semibold" required>
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
      <Label htmlFor="arrivalDateId" weight="semibold" required>
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
      <Label htmlFor="completionDateId" weight="semibold" required>
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
      <Label htmlFor="officeId" weight="semibold" required>
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
      <Label weight="semibold" required>
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
          <Label htmlFor="newCivId" weight="semibold" required>
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
          {isNewCivMil === "no" && (
            <>
              <Label htmlFor="prevOrgId" weight="semibold" required>
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
            </>
          )}
        </>
      )}
      {(empType === EMPTYPES.Civilian || empType === EMPTYPES.Military) && (
        <>
          <Label htmlFor="newToBaseAndCenterId" weight="semibold" required>
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
      {(empType === EMPTYPES.Civilian || empType === EMPTYPES.Military) && (
        <>
          <Label htmlFor="isTravelerId" weight="semibold" required>
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
          <Label htmlFor="hasExistingCACId" weight="semibold" required>
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
          {hasExistingCAC === "yes" && (
            <>
              <Label htmlFor="CACExpirationId" weight="semibold" required>
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
            </>
          )}
        </>
      )}

      <Button appearance="primary" type="submit">
        Create In Processing Record
      </Button>
    </form>
  );
};
