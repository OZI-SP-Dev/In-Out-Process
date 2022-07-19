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
import { makeStyles } from "@fluentui/react-components";
import React, { ChangeEvent, FormEvent, useState } from "react";
import { PeoplePicker } from "../PeoplePicker/PeoplePicker";
import { useBoolean } from "@fluentui/react-hooks";
import { OFFICES } from "../../constants/Offices";
import { GS_GRADES, NH_GRADES, MIL_GRADES } from "../../constants/GradeRanks";
import { emptype, EMPTYPES } from "../../constants/EmpTypes";
import { worklocation, WORKLOCATIONS } from "../../constants/WorkLocations";
import {
  Button,
  Input,
  InputOnChangeData,
  Label,
  Radio,
  RadioGroup,
  RadioGroupOnChangeData,
  Switch,
  SwitchOnChangeData,
} from "@fluentui/react-components";

interface IInForm {
  /** Required - Contains the Employee's Name */
  empName: string;
  /** Required - Employee's Type valid values are:
   * 'civ' - for Civilian Employees
   * 'mil' - for Military Employees
   * 'ctr' - for Contracted Employees
   */
  empType: emptype;
  /** Required - The Employee's Grade/Rank.  Not applicable if 'ctr' */
  gradeRank: string;
  /** Required - Possible values are 'local' and 'remote'  */
  workLocation: worklocation;
  /** Required - The Employee's Office */
  office: string;
  /** Required - Can only be 'true' if it is a New to USAF Civilain.  Must be 'false' if it is a 'mil' or 'ctr' */
  isNewCiv: boolean;
  /** Required - The user's previous organization.  Will be "" if isNewCiv is false */
  prevOrg: string;
  /** Required - The user's Estimated Arrival Date */
  eta: Date;
}

/** For new forms, allow the empType and workLocation to be blank strings to support controlled components */
interface INewInForm extends Omit<IInForm, "empType" | "workLocation"> {
  empType: emptype | "";
  workLocation: worklocation | "";
}

const cancelIcon: IIconProps = { iconName: "Cancel" };
const useStyles = makeStyles({
  formContainer: { display: "grid", paddingLeft: "1em", paddingRight: "1em" },
});

export const InForm: React.FunctionComponent<any> = (props) => {
  const classes = useStyles();

  const defaultInForm: INewInForm = {
    empName: "",
    empType: "",
    workLocation: "",
    gradeRank: "",
    office: "",
    isNewCiv: false,
    prevOrg: "",
    eta: new Date(),
  };

  const [formData, setFormData] = useState<INewInForm>(defaultInForm);

  const [gradeRankOptions, setGradeRankOptions] = React.useState<
    IComboBoxOption[]
  >([]);

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

  function reviewRecord() {
    showModal();
  }

  return (
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
        <Label htmlFor="arrivalDateId">Select estimated arrival date</Label>
        <DatePicker
          id="arrivalDateId"
          placeholder="Select estimated arrival date"
          ariaLabel="Select an estimated arrival date"
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
        <Label htmlFor="supervisorId">Supervisor/Government Lead</Label>
        <PeoplePicker id="supervisorId" />
        {formData.empType === "civ" && (
          <>
            <Label htmlFor="newCivId">
              Is Employee a New to Air Force Civilian?
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
