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
import { empTypeOpts, EMPTYPES } from "../../constants/EmpTypes";
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
import { IInForm, INewInForm, RequestApiConfig } from "../../api/RequestApi";
import { InRequestViewCompact } from "./InRequestViewCompact";
import { InRequestEditPanel } from "./InRequestEditPanel";
import { useForm, Controller } from "react-hook-form";
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

  const defaultInForm: INewInForm = {
    Id: -1,
    empName: "",
    empType: "",
    workLocation: "",
    gradeRank: "",
    office: "",
    isNewCiv: "",
    prevOrg: "",
    eta: undefined,
    supGovLead: undefined,
  };

  const [formData, setFormData] = useState<INewInForm | IInForm>(
    props.formData ? props.formData : defaultInForm
  );

  /* Boolean state for determining whether or not the Edit Panel is shown */
  const [isEditPanelOpen, { setTrue: showEditPanel, setFalse: hideEditPanel }] =
    useBoolean(false);

  // TODO -- Look to see if when v8 of react-hook-form released if you can simplify supGovLead
  //  See -  https://github.com/react-hook-form/react-hook-form/issues/6679
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    resetField,
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      empName: formData.empName,
      empType: formData.empType,
      gradeRank: formData.gradeRank,
      office: formData.office,
      workLocation: formData.workLocation,
      prevOrg: formData.prevOrg,
      eta: formData.eta,
      isNewCiv: formData.isNewCiv,
      supGovLead: {
        text: formData.supGovLead?.text,
        secondaryText: formData.supGovLead?.secondaryText,
        imageInitials: formData.supGovLead?.imageInitials,
        Email: formData.supGovLead?.Email,
        imageUrl: formData.supGovLead?.imageUrl,
      },
      //supGovLead: formData.supGovLead,
    },
  });

  const createNewRequest = (data: any) => {
    /* Validation has passed, so create the new Request */
    /* TODO - Save the New Request */
    alert("Feature coming");
  };

  const updateRequest = (data: any) => {
    /* Validation has passed, so update the request */
    let dataCopy = { ...data };
    if (dataCopy.empType) {
      // If it isn't a civilian, ensure values depending on Civ only are set correctly
      if (empType !== EMPTYPES.CIV) {
        data.isNewCiv = "no";
        dataCopy.prevOrg = "";
      } else {
        // If it is a new Civilian then ensure prevOrg is set to ""
        if (dataCopy.isNewCiv === "yes") {
          dataCopy.prevOrg = "";
        }
      }
    }
    setFormData(dataCopy);
    hideEditPanel();
  };

  // Set up a RHF watch to drive change to empType depeding on the value selected
  const empType = watch("empType");
  // Set up a RHF watch to drive change to isNewCiv depending on the value selcected
  const isNewCiv = watch("isNewCiv");

  const gradeRankOptions: IComboBoxOption[] = useMemo(() => {
    switch (empType) {
      case EMPTYPES.CIV:
        return [...GS_GRADES, ...NH_GRADES];
      case EMPTYPES.MIL:
        return [...MIL_GRADES];
      case EMPTYPES.CTR:
        return [];
      default:
        return [];
    }
  }, [empType]);

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
  useEffect(() => {
    const loadRequest = async () => {
      const res = await requestApi.getItemById(props.ReqId);
      if (res) {
        setFormData(res);
        // Populate the React-Hook-Form with the data
        reset(res);
      }
    };

    loadRequest();
  }, [props.ReqId, requestApi, reset]);

  /* If they change employee type, clear out the selected grade */
  useEffect(() => {
    setValue("gradeRank", "");
  }, [empType, setValue]);

  /* Temporarily show a Loading screen if we don't have the current user info yet. */
  if (userContext.loadingUser) {
    return <>Loading...</>;
  } else {
  }

  /* Callback function to be provided to the EditPanel component for action on Save/Cancel*/
  const onEditSaveCancel = (action: "save" | "cancel"): void => {
    if (action === "save") {
      // If the save button was clicked, then run validation
      handleSubmit(updateRequest)();
    } else if (action === "cancel") {
      // If the user cancels, set the form back to what was passed in orginally
      reset();
      hideEditPanel();
    }
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
          render={({ field }) => (
            <RadioGroup
              {...field}
              id="empTypeId"
              aria-describedby="empTypeErr"
              layout="horizontal"
            >
              {empTypeOpts.map((empType, i) => {
                return (
                  <Radio
                    key={empType.value}
                    value={empType.value}
                    label={empType.label}
                  />
                );
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
            required: empType !== EMPTYPES.CTR ? "Grade/Rank is required" : "",
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
              disabled={empType === EMPTYPES.CTR}
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
              onSelectDate={onChange}
              value={value}
            />
          )}
        />
        {errors.eta && (
          <Text id="etaErr" className={classes.errorText}>
            {errors.eta.message}
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
        {empType === EMPTYPES.CIV && (
          <>
            <Label htmlFor="newCivId">
              Is Employee a New Air Force Civilian?
            </Label>
            <Controller
              name="isNewCiv"
              control={control}
              rules={{
                required: "Selection is required",
              }}
              render={({ field }) => (
                <RadioGroup
                  {...field}
                  aria-describedby="isNewCivErr"
                  id="newCivId"
                >
                  <Radio key={"yes"} value={"yes"} label="Yes" />
                  <Radio key={"no"} value={"no"} label="No" />
                </RadioGroup>
              )}
            />
            {errors.isNewCiv && (
              <Text id="isNewCivErr" className={classes.errorText}>
                {errors.isNewCiv.message}
              </Text>
            )}
            {isNewCiv === "no" && (
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
              onEditSaveCancel={onEditSaveCancel}
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
