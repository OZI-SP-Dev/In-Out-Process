import {
  ComboBox,
  DatePicker,
  IComboBox,
  IComboBoxOption,
  Panel,
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
import { useBoolean } from "@fluentui/react-hooks";
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
  Text,
  webLightTheme,
  FluentProvider,
} from "@fluentui/react-components";
import { UserContext } from "../../providers/UserProvider";
import { IInForm, INewInForm, RequestApiConfig } from "../../api/RequestApi";

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
  compactContainer: {
    display: "grid",
    paddingLeft: "1em",
    paddingRight: "1em",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))",
    gridAutoRows: "minmax(50px, auto)",
  },
  floatRight: {
    float: "right",
  },
});

/* TODO - Break into subcomponents for different views */
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

  const [formData, setFormData] = useState<INewInForm | IInForm>(defaultInForm);
  const [saveCancelEvent, setSaveCancelEvent] = useState<string>("");

  /* Boolean state for determining whether or not the Edit Panel is shown */
  const [isEditPanelOpen, { setTrue: showEditPanel, setFalse: hideEditPanel }] =
    useBoolean(false);

  /* Function to handle the save or cancel */
  const onEditSaveCancel = (formEdits: IInForm | undefined): void => {
    // If they chose to save the Edits, then update the formData
    if (formEdits) {
      setFormData({ ...formEdits });
    }
    hideEditPanel();
    setSaveCancelEvent("");
  };

  const [gradeRankOptions, setGradeRankOptions] = useState<IComboBoxOption[]>(
    []
  );

  const displayEmpType = (): string => {
    let displayValue = "";
    switch (formData.empType) {
      case EMPTYPES.CIV:
        displayValue =
          "Civilian - " + (formData.isNewCiv === "yes" ? "New" : "Existing");
        break;
      case EMPTYPES.MIL:
        displayValue = "Military";
        break;
      case EMPTYPES.CTR:
        displayValue = "Contractor";
        break;
    }
    return displayValue;
  };

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

      setFormData((f: INewInForm) => {
        return { ...f, empType: empType as emptype };
      });
    }
  };

  const onEmpTypeChange = (
    ev: FormEvent<HTMLElement>,
    data: RadioGroupOnChangeData
  ) => {
    let empType: emptype = data.value as emptype;
    updateGradeRankOpt(empType);
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

  const onRenderFooterContent = () => (
    <FluentProvider theme={webLightTheme}>
      <div>
        <Button
          appearance="primary"
          onClick={() => {
            setSaveCancelEvent("save");
          }}
        >
          Save
        </Button>
        <Button
          appearance="secondary"
          onClick={() => {
            setSaveCancelEvent("cancel");
          }}
        >
          Cancel
        </Button>
      </div>
    </FluentProvider>
  );

  function editRecord() {
    showEditPanel();
  }

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

        //Update the available grade options dropdown based on the incoming record
        updateGradeRankOpt(res?.empType);
      }
    };

    loadRequest();
  }, [props.ReqId, requestApi]);

  /* Temporarily show a Loading screen if we don't have the current user info yet. */
  if (userContext.loadingUser) {
    return <>Loading...</>;
  }

  const editPanel = (
    <Panel
      isOpen={isEditPanelOpen}
      isBlocking={true}
      onDismiss={hideEditPanel}
      headerText="Edit Request"
      isFooterAtBottom={true}
      onRenderFooterContent={onRenderFooterContent}
    >
      <FluentProvider theme={webLightTheme}>
        {/* TODO - Determine if this
        compoent should retrieve the form data again from the source, or pass it
        what is currently on the currently loaded form. For now it is reading in
        the form data again from the source */}
        {/* Recursively embed the component inside */}
        <InRequest
          ReqId={props.ReqId}
          view={INFORMVIEWS.EDIT}
          onEditSaveCancel={onEditSaveCancel}
          saveCancelEvent={saveCancelEvent}
        />
      </FluentProvider>
    </Panel>
  );

  /* This view renders a compact view of the items as simple Text elements (not fields) */
  const compactView = (
    <>
      <div id="inForm" className={classes.compactContainer}>
        <div>
          <Label weight="semibold" htmlFor="empNameId">
            Employee Name:
          </Label>
          <br />
          <Text id="empNameId">{formData.empName}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="empTypeId">
            Employee Type
          </Label>
          <br />
          <Text id="empTypeId">{displayEmpType}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="gradeRankId">
            Grade/Rank
          </Label>
          <br />
          <Text id="gradeRankId">{formData.gradeRank}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="workLocationId">
            Local or Remote?
          </Label>
          <br />
          <Text id="workLocationId">{formData.workLocation}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="arrivalDateId">
            Select estimated on-boarding date
          </Label>
          <br />
          <Text id="arrivalDateId">{formData.eta?.toLocaleDateString()}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="officeId">
            Office
          </Label>
          <br />
          <Text id="officeId">{formData.office}</Text>
        </div>
        <div>
          <Label weight="semibold" htmlFor="supGovLeadId">
            Supervisor/Government Lead
          </Label>
          <br />
          <Text id="supGovLeadId">{formData.supGovLead?.text}</Text>
        </div>
        {formData.empType === EMPTYPES.CIV && formData.isNewCiv === "no" && (
          <div>
            <Label weight="semibold" htmlFor="prevOrgId">
              Previous Organization
            </Label>
            <br />
            <Text>{formData.prevOrg}</Text>
          </div>
        )}
      </div>
      <Button appearance="primary" className="floatRight" onClick={editRecord}>
        Edit
      </Button>
      {editPanel}
    </>
  );

  /* This view serves up the form fields as editable.  It is utilied by both NEW and EDIT forms */
  const formView = (
    <>
      <form id="inForm" className={classes.formContainer}>
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
        return compactView;
      case INFORMVIEWS.NEW:
      case INFORMVIEWS.EDIT:
      default:
        return formView;
    }
  })();

  return <>{selectedView}</>;
};
