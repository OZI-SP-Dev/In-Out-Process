import {
  ComboBox,
  DatePicker,
  FontWeights,
  getTheme,
  IComboBox,
  IComboBoxOption,
  IconButton,
  IIconProps,
  mergeStyleSets,
  Modal,
} from "@fluentui/react";
import React, { ChangeEvent, FormEvent, useContext, useState } from "react";
import { PeoplePicker, SPPersona } from "../PeoplePicker/PeoplePicker";
import { useBoolean } from "@fluentui/react-hooks";
import { OFFICES } from "../../constants/Offices";
import { GS_GRADES, NH_GRADES, MIL_GRADES } from "../../constants/GradeRanks";
import { emptype, EMPTYPES } from "../../constants/EmpTypes";
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
  Switch,
  SwitchOnChangeData,
  Text,
} from "@fluentui/react-components";
import { UserContext } from "../../providers/UserProvider";
import { INewInForm, RequestApiConfig } from "../../api/RequestApi";

const cancelIcon: IIconProps = { iconName: "Cancel" };
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

export const InForm: React.FunctionComponent<any> = (props) => {
  const classes = useStyles();
  const requestApi = RequestApiConfig.getApi();
  const userContext = useContext(UserContext);
  const [user, setUser] = useState<SPPersona[]>();
  const defaultInForm: INewInForm = {
    Id: -1,
    empName: "",
    empType: "",
    workLocation: "",
    gradeRank: "",
    office: "",
    isNewCiv: false,
    prevOrg: "",
    eta: undefined,
    supGovLead: undefined,
  };

  const [formData, setFormData] = useState<INewInForm>(defaultInForm);

  const [gradeRankOptions, setGradeRankOptions] = React.useState<
    IComboBoxOption[]
  >([]);

  const displayEmpType = (): string => {
    let displayValue = "";
    switch (formData.empType) {
      case "civ":
        displayValue = "Civilian - " + (formData.isNewCiv ? "New" : "Existing");
        break;
      case "mil":
        displayValue = "Militray";
        break;
      case "ctr":
        displayValue = "Contractor";
        break;
    }
    return displayValue;
  };
  const onEmpTypeChange = (
    ev: FormEvent<HTMLElement>,
    data: RadioGroupOnChangeData
  ) => {
    setFormData((f: INewInForm) => {
      switch (data.value) {
        case "civ":
          setGradeRankOptions([...GS_GRADES, ...NH_GRADES]);
          break;
        case "mil":
          setGradeRankOptions([...MIL_GRADES]);
          break;
        case "ctr":
          setGradeRankOptions([]);
          break;
      }
      if (data.value !== "civ") {
        setFormData((f: INewInForm) => {
          return { ...f, isNewCiv: false };
        });
        setFormData((f: INewInForm) => {
          return { ...f, prevOrg: "" };
        });
      }
      return { ...f, empType: data.value as emptype };
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

  const onNewCiv = (ev: ChangeEvent<HTMLElement>, data: SwitchOnChangeData) => {
    setFormData((f: INewInForm) => {
      return { ...f, isNewCiv: data.checked };
    });

    if (!data.checked) {
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
      setFormData((f: INewInForm) => {
        return { ...f, supGovLead: items };
      });
    }
  };

  const onGradeChange = (
    event: React.FormEvent<IComboBox>,
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
    event: React.FormEvent<IComboBox>,
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

  const [isModalOpen, { setTrue: showModal, setFalse: hideModal }] =
    useBoolean(false);

  const [isEditModalOpen, { setTrue: showEditModal, setFalse: hideEditModal }] =
    useBoolean(false);

  function reviewRecord() {
    showModal();
  }

  function editRecord() {
    showEditModal();
  }

  React.useEffect(() => {
    let persona: SPPersona[] = [];
    persona = [{ ...userContext.user }];

    setUser(persona);
  }, [userContext.user]);

  React.useEffect(() => {
    const loadRequest = async () => {
      const res = await requestApi.getItemById(props.ReqId);
      if (res) {
        setFormData(res);
      }
    };

    loadRequest();
  }, [props.ReqId, requestApi]);

  const editModal = (
    <Modal
      titleAriaId="titleId"
      isOpen={isEditModalOpen}
      isBlocking={true}
      onDismiss={hideEditModal}
      containerClassName={contentStyles.container}
    >
      <div className={contentStyles.header}>
        <span id="titleId">Edit Request</span>
        <IconButton
          styles={iconButtonStyles}
          iconProps={cancelIcon}
          ariaLabel="Close popup modal"
          onClick={hideEditModal}
        />
      </div>
      {/* TODO -- Ability to Edit a Request in Modal*/}
      <div className={contentStyles.body}>
        <p>This is a place holder for ability to edit the Request.</p>
      </div>
    </Modal>
  );
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
          <Text id="supGovLeadId">{formData.supGovLead}</Text>
        </div>
        {formData.empType === "civ" && formData.isNewCiv === false && (
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
      {editModal}
    </>
  );

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
        >
          {EMPTYPES.map((empType, i) => {
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
          disabled={formData.empType === "ctr"}
        />
        <Label htmlFor="workLocationId">Local or Remote?</Label>
        <RadioGroup
          id="workLocationId"
          value={formData.workLocation}
          onChange={onWorkLocationChange}
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
          defaultValue={user}
          updatePeople={onSupvGovLeadChange}
        />
        {formData.empType === "civ" && (
          <>
            <Label htmlFor="newCivId">
              Is Employee a New Air Force Civilian?
            </Label>
            <Switch
              id="newCivId"
              label={formData.isNewCiv ? "Yes" : "No"}
              onChange={onNewCiv}
            />
            {formData.isNewCiv === false && (
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
        <Button appearance="primary" onClick={reviewRecord}>
          Create In Processing Record
        </Button>
      </form>
      <Modal
        titleAriaId="titleId"
        isOpen={isModalOpen}
        isBlocking={true}
        onDismiss={hideModal}
        containerClassName={contentStyles.container}
      >
        <div className={contentStyles.header}>
          <span id="titleId">Review Information</span>
          <IconButton
            styles={iconButtonStyles}
            iconProps={cancelIcon}
            ariaLabel="Close popup modal"
            onClick={hideModal}
          />
        </div>

        <div className={contentStyles.body}>
          <p>
            Please review the below information: If corect continue processing,
            if something needs adjusted, cancel and make changes.
          </p>
        </div>
      </Modal>
    </>
  );

  return <>{props.compactView ? compactView : formView}</>;
};

const theme = getTheme();
const contentStyles = mergeStyleSets({
  container: {
    display: "flex",
    flexFlow: "column nowrap",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },
  header: [
    theme.fonts.xxLarge,
    {
      flex: "1 1 auto",
      borderTop: `4px solid ${theme.palette.themePrimary}`,
      color: theme.palette.neutralPrimary,
      display: "flex",
      alignItems: "center",
      fontWeight: FontWeights.semibold,
      padding: "12px 12px 14px 24px",
    },
  ],
  body: {
    flex: "4 4 auto",
    padding: "0 24px 24px 24px",
    overflowY: "hidden",
    selectors: {
      p: { margin: "14px 0" },
      "p:first-child": { marginTop: 0 },
      "p:last-child": { marginBottom: 0 },
    },
  },
});

const iconButtonStyles = {
  root: {
    color: theme.palette.neutralPrimary,
    marginLeft: "auto",
    marginTop: "4px",
    marginRight: "2px",
  },
  rootHovered: {
    color: theme.palette.neutralDark,
  },
};
