import {
  ComboBox,
  DatePicker,
  IComboBox,
  IComboBoxOption,
} from "@fluentui/react";
import {
  ChangeEvent,
  FormEvent,
  FunctionComponent,
  useContext,
  useEffect,
  useState,
} from "react";
import { PeoplePicker, SPPersona } from "../PeoplePicker/PeoplePicker";
import { OFFICES } from "../../constants/Offices";
import { GS_GRADES, NH_GRADES, MIL_GRADES } from "../../constants/GradeRanks";
import { emptype, empTypeOpts, EMPTYPES } from "../../constants/EmpTypes";
import { worklocation, WORKLOCATIONS } from "../../constants/WorkLocations";
import {
  makeStyles,
  Button,
  Input,
  InputOnChangeData,
  Label,
  Radio,
  RadioGroup,
  RadioGroupOnChangeData,
} from "@fluentui/react-components";
import { UserContext } from "../../providers/UserProvider";
import { IInForm, INewInForm, RequestApiConfig } from "../../api/RequestApi";
import { InRequestViewCompact } from "./InRequestViewCompact";
import { InRequestEditPanel } from "./InRequestEditPanel";

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

  const [gradeRankOptions, setGradeRankOptions] = useState<IComboBoxOption[]>(
    []
  );

  const updateGradeRankOpt = (empType: emptype) => {
    if (empType) {
      switch (empType) {
        case EMPTYPES.CIV:
          setGradeRankOptions([...GS_GRADES, ...NH_GRADES]);
          break;
        case EMPTYPES.MIL:
          setGradeRankOptions([...MIL_GRADES]);
          break;
        case EMPTYPES.CTR:
          setGradeRankOptions([]);
          break;
      }

      if (empType !== EMPTYPES.CIV) {
        setFormData((f: INewInForm) => {
          return { ...f, isNewCiv: "no" };
        });
        setFormData((f: INewInForm) => {
          return { ...f, prevOrg: "" };
        });
      }
    }
  };

  const onEmpTypeChange = (
    ev: FormEvent<HTMLElement>,
    data: RadioGroupOnChangeData
  ) => {
    let empType: emptype = data.value as emptype;
    setFormData((f: INewInForm) => {
      return { ...f, empType: empType as emptype };
    });
  };

  const onWorkLocationChange = (
    ev: FormEvent<HTMLElement>,
    data: RadioGroupOnChangeData
  ) => {
    setFormData((f: INewInForm) => {
      return { ...f, workLocation: data.value as worklocation };
    });
  };

  const onETADateChange = (date: Date | null | undefined) => {
    if (date) {
      setFormData((f: INewInForm) => {
        return { ...f, eta: date };
      });
    }
  };

  const onNewCiv = (
    ev: FormEvent<HTMLElement>,
    data: RadioGroupOnChangeData
  ) => {
    if (data.value === "yes" || data.value === "no")
      setFormData((f: INewInForm) => {
        return { ...f, isNewCiv: data.value as "yes" | "no" };
      });

    if (!(data.value === "true")) {
      setFormData((f: INewInForm) => {
        return { ...f, prevOrg: "" };
      });
    }
  };

  const onEmpNameChange = (
    event: ChangeEvent<HTMLInputElement>,
    data?: InputOnChangeData
  ) => {
    const empNameVal = data?.value ? data.value : "";
    setFormData((f: INewInForm) => {
      return { ...f, empName: empNameVal };
    });
  };

  const onSupvGovLeadChange = (items: SPPersona[]) => {
    if (items) {
      // If People Picker returns items then set to the first since we only have 1 supGovLead
      setFormData((f: INewInForm) => {
        return { ...f, supGovLead: items[0] };
      });
    }
  };

  const onGradeChange = (
    event: FormEvent<IComboBox>,
    option?: IComboBoxOption,
    index?: number,
    value?: string
  ): void => {
    const gradeRankVal = option?.key ? option.key.toString() : "";
    setFormData((f: INewInForm) => {
      return { ...f, gradeRank: gradeRankVal };
    });
  };

  const onOfficeChange = (
    event: FormEvent<IComboBox>,
    option?: IComboBoxOption,
    index?: number,
    value?: string
  ): void => {
    const officeVal = option?.key ? option.key.toString() : "";
    setFormData((f: INewInForm) => {
      return { ...f, office: officeVal };
    });
  };

  const onPrevOrgChange = (
    event: ChangeEvent<HTMLInputElement>,
    data?: InputOnChangeData
  ) => {
    const prevOrgVal = data?.value ? data.value : "";
    setFormData((f: INewInForm) => {
      return { ...f, prevOrg: prevOrgVal };
    });
  };

  useEffect(() => {
    // Only set the supGovLead if this is a New request
    if (props.view === INFORMVIEWS.NEW) {
      let persona: SPPersona = {};
      persona = { ...userContext.user };

      setFormData((f: INewInForm) => {
        return { ...f, supGovLead: persona };
      });
    }
  }, [userContext.user, props.view]);

  /* If the parent component updates prop to indicate a save or cancel event, then peform appropriate actions,
      and call the passed in parents function.  If we are successfully saving then pass the formData back to the
      parent's callback function, otherwise, don't pass it back so that it leaves the panel open for action */
  useEffect(() => {
    if (props.saveCancelEvent === "save") {
      /* TODO - Evaluate if the user has valid data to update the record with, and update the record.  If it isn't valid
        then call the parent's callback passing no return value so that it leaves panel open */
      if (true /*Is Data Valid? */) {
        props.onEditSaveCancel(formData);
      } else {
        /* Data not valid, so tell parent not to close panel  */
        //props.onEditSaveCancel();
      }
    } else if (props.saveCancelEvent === "cancel") {
      props.onEditSaveCancel();
    }
  }, [props.saveCancelEvent, formData, props]);

  /* The data based on the ReqId prop that is passed in */
  useEffect(() => {
    const loadRequest = async () => {
      const res = await requestApi.getItemById(props.ReqId);
      if (res) {
        setFormData(res);
      }
    };

    loadRequest();
  }, [props.ReqId, requestApi]);

  useEffect(() => {
    updateGradeRankOpt(formData?.empType as emptype);
  }, [formData.empType]);

  /* Temporarily show a Loading screen if we don't have the current user info yet. */
  if (userContext.loadingUser) {
    return <>Loading...</>;
  }

  /* Callback function to be provided to the EditPanel component for action on Save/Cancel*/
  const onEditSaveCancel = (formEdits: IInForm | undefined): void => {
    // If the form was edited, then update the formData with this new data, otherwise no action needed
    if (formEdits) setFormData(formEdits);
  };

  /* This view serves up the form fields as editable.  It is utilied by both NEW and EDIT forms */
  const formView = (
    <>
      <form id="inReqForm" className={classes.formContainer}>
        <Label htmlFor="empNameId">Employee Name</Label>
        <Input
          id="empNameId"
          value={formData.empName}
          onChange={onEmpNameChange}
        />
        <Label htmlFor="empTypeId">Employee Type</Label>
        <RadioGroup
          id="empTypeId"
          value={formData.empType}
          onChange={onEmpTypeChange}
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
        <Label htmlFor="gradeRankId">Grade/Rank</Label>
        <ComboBox
          id="gradeRankId"
          selectedKey={formData.gradeRank}
          autoComplete="on"
          options={gradeRankOptions}
          onChange={onGradeChange}
          dropdownWidth={100}
          disabled={formData.empType === EMPTYPES.CTR}
        />
        <Label htmlFor="workLocationId">Local or Remote?</Label>
        <RadioGroup
          id="workLocationId"
          value={formData.workLocation}
          onChange={onWorkLocationChange}
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
        <Label htmlFor="arrivalDateId">Select estimated on-boarding date</Label>
        <DatePicker
          id="arrivalDateId"
          placeholder="Select estimated on-boarding date"
          ariaLabel="Select an estimated on-boarding date"
          value={formData.eta}
          onSelectDate={onETADateChange}
        />
        <Label htmlFor="officeId">Office</Label>
        <ComboBox
          id="officeId"
          selectedKey={formData.office}
          autoComplete="on"
          options={OFFICES}
          onChange={onOfficeChange}
          dropdownWidth={100}
        />
        <Label>Supervisor/Government Lead</Label>
        <PeoplePicker
          ariaLabel="Supervisor/Government Lead"
          defaultValue={formData.supGovLead}
          updatePeople={onSupvGovLeadChange}
        />
        {formData.empType === EMPTYPES.CIV && (
          <>
            <Label htmlFor="newCivId">
              Is Employee a New Air Force Civilian?
            </Label>
            <RadioGroup
              id="newCivId"
              value={formData.isNewCiv}
              onChange={onNewCiv}
            >
              <Radio key={"yes"} value={"yes"} label="Yes" />
              <Radio key={"no"} value={"no"} label="No" />
            </RadioGroup>
            {formData.isNewCiv === "no" && (
              <>
                <Label htmlFor="prevOrgId">Previous Organization</Label>
                <Input
                  id="prevOrgId"
                  value={formData.prevOrg}
                  onChange={onPrevOrgChange}
                />
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
              alert("Feature coming");
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
            <InRequestEditPanel
              formData={formData}
              onEditSaveCancel={onEditSaveCancel}
            />
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
