import { ComboBox, DatePicker, IComboBoxOption } from "@fluentui/react";
import {
  FunctionComponent,
  useContext,
  useEffect,
  useState,
  useMemo,
} from "react";
import { PeoplePicker, SPPersona } from "../PeoplePicker/PeoplePicker";
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
import { IInForm, RequestApiConfig } from "../../api/RequestApi";
import { InRequestViewCompact } from "./InRequestViewCompact";
import { InRequestEditPanel } from "./InRequestEditPanel";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { useBoolean } from "@fluentui/react-hooks";

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

export const InRequest: FunctionComponent<any> = (props) => {
  const classes = useStyles();
  const requestApi = RequestApiConfig.getApi();
  const userContext = useContext(UserContext);

  const [formData, setFormData] = useState<IInForm | undefined>(undefined);

  /* Boolean state for determining whether or not the Edit Panel is shown */
  const [isEditPanelOpen, { setTrue: showEditPanel, setFalse: hideEditPanel }] =
    useBoolean(false);

  // TODO -- Look to see if when v8 of react-hook-form released if you can properly set useForm to use the type IInForm
  //  See -  https://github.com/react-hook-form/react-hook-form/issues/6679
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    resetField,
    reset,
    setValue,
  } = useForm<any>();

  // Set up a RHF watch to drive change to empType depeding on the value selected
  const empType = watch("empType");
  // Set up a RHF watch to drive change to isNewCivMil depending on the value selcected
  const isNewCivMil = watch("isNewCivMil");
  // Set up a RHF watch to drive change to hasExistingCAC depending on the value selcected
  const hasExistingCAC = watch("hasExistingCAC");
  // Set up a RHF watch to monitor eta, and set the min date for completionDate to eta + 28
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
    // Only set the supGovLead if this is a New request
    if (props.view === INFORMVIEWS.NEW) {
      let persona: SPPersona = {};
      persona = { ...userContext.user };
      // TODO - Set this to use setValue instead, and move it from being a useEffect
      //  to just being after the if statement for determing current user
      //  Set value only causes rerender under specific conditions, where resetField re-rerenders
      //  more frequently.  setValue isn't working for SPPersona due to TS issues in v7 of RHF
      resetField("supGovLead", { defaultValue: persona });
    }
  }, [userContext.user, props.view, resetField]);

  /* Get the data based on the ReqId prop that is passed in */
  /* TODO - Move this into the RequestAPI so all data handling is there to avoid stale data in future use cases */
  useEffect(() => {
    let ignore = false;
    const loadRequest = async () => {
      const res = await requestApi.getItemById(props.ReqId);
      if (!ignore && res) {
        setFormData(res);
        // Populate the React-Hook-Form with the data
        reset(res);
      }
    };
    loadRequest();
    /* Cleanup function to avoid stale data - https://beta.reactjs.org/learn/you-might-not-need-an-effect#fetching-data */
    return () => {
      ignore = true;
    };
  }, [props.ReqId, requestApi, reset]);

  /* Temporarily show a Loading screen if we don't have the current user info yet. */
  if (props.view === INFORMVIEWS.NEW && !userContext.user) {
    return <>Loading...</>;
  }

  if (props.view === INFORMVIEWS.COMPACT && !formData) {
    return <>Loading...</>;
  }

  const createNewRequest: SubmitHandler<IInForm> = (data) => {
    /* Validation has passed, so create the new Request */
    /* TODO - Save the New Request */
    alert("Feature coming");
    console.log(JSON.stringify(data));
  };

  const updateRequest: SubmitHandler<IInForm> = (data) => {
    /* Validation has passed, so update the request */
    let dataCopy = { ...data };
    if (dataCopy.empType) {
      // If it isn't a Civ/Mil, ensure values depending on Civ/Mil only are set correctly
      if (empType !== EMPTYPES.Civilian && empType !== EMPTYPES.Military) {
        data.isNewCivMil = "no";
        dataCopy.prevOrg = "";
        dataCopy.isNewToBaseAndCenter = "no";
      } else {
        // If it is a new Civ/Mil then ensure prevOrg is set to ""
        if (dataCopy.isNewCivMil === "yes") {
          dataCopy.prevOrg = "";
        }
      }
    }
    if (empType !== EMPTYPES.Contractor) {
      // If Employee is not a CTR then we should set hasExistingCAC to false and CACExpiration to undefined
      dataCopy.hasExistingCAC = "no";
      dataCopy.CACExpiration = undefined;
    } else {
      if ((dataCopy.hasExistingCAC = "no")) {
        // If the CTR doesn't have an Existing CAC, set the CACExpiration to undefined
        dataCopy.CACExpiration = undefined;
      }
    }
    setFormData(dataCopy);
    hideEditPanel();
  };

  /* Callback function to be provided to the EditPanel component for action on Save */
  const onEditSave = () => {
    // If the save button was clicked, then run validation
    handleSubmit(updateRequest)();
  };

  /* Callback function to be provided to the EditPanel component for action on Save */
  const onEditCancel = () => {
    // If the user cancels, set the form back to what was passed in orginally
    reset();
    hideEditPanel();
  };

  /* This view serves up the form fields as editable.  It is utilied by both NEW and EDIT forms */
  const formView = (
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
        {props.view === INFORMVIEWS.NEW && (
          <Button
            appearance="primary"
            onClick={() => {
              handleSubmit(createNewRequest)();
            }}
          >
            Create In Processing Record
          </Button>
        )}
      </form>
    </>
  );

  const selectedView = (() => {
    switch (props.view) {
      case INFORMVIEWS.COMPACT:
        return (
          <>
            <InRequestViewCompact formData={formData as IInForm} />{" "}
            <Button
              appearance="primary"
              className="floatRight"
              onClick={showEditPanel}
            >
              Edit
            </Button>
            <InRequestEditPanel
              onEditSave={onEditSave}
              onEditCancel={onEditCancel}
              isEditPanelOpen={isEditPanelOpen}
            >
              {formView}
            </InRequestEditPanel>
          </>
        );
      case INFORMVIEWS.NEW:
      case INFORMVIEWS.EDIT:
      default:
        return formView;
    }
  })();

  return <>{selectedView}</>;
};
