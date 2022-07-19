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
  /** Required - If 'true' the employee is full-time teleworking, otherwise they report to base  */
  isRemote: boolean;
  /** Required - The Employee's Office */
  office: string;
  /** Required - Can only be 'true' if it is a New to USAF Civilain.  Must be 'false' if it is a 'mil' or 'ctr' */
  isNewCiv: boolean;
}
const cancelIcon: IIconProps = { iconName: "Cancel" };
const useStyles = makeStyles({
  formContainer: { display: "grid", paddingLeft: "1em", paddingRight: "1em" },
});

export const InForm: React.FunctionComponent<any> = (props) => {
  const classes = useStyles();
  const defaultInForm: IInForm = {
    empName: "Doe, Jane A",
    empType: "civ",
    isRemote: true,
    gradeRank: "",
    office: "",
    isNewCiv: false,
  };
  const [formData, setFormData] = useState<IInForm>(defaultInForm);
  const [gradeRankOptions, setGradeRankOptions] = React.useState<
    IComboBoxOption[]
  >([]);

  const onEmpTypeChange = (
    ev: FormEvent<HTMLElement>,
    data: RadioGroupOnChangeData
  ) => {
    setFormData((f: IInForm) => {
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
      return { ...f, empType: data.value as emptype };
    });
  };

  const onLocalRemote = (
    ev: ChangeEvent<HTMLElement>,
    data: SwitchOnChangeData
  ) => {
    setFormData((f: IInForm) => {
      return { ...f, isRemote: data.checked };
    });
  };

  const onNewCiv = (ev: ChangeEvent<HTMLElement>, data: SwitchOnChangeData) => {
    setFormData((f: IInForm) => {
      return { ...f, isNewCiv: data.checked };
    });
  };

  const onEmpNameChange = (
    event: ChangeEvent<HTMLInputElement>,
    data?: InputOnChangeData
  ) => {
    const empNameVal = data?.value ? data.value : "";
    setFormData((f: IInForm) => {
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
    setFormData((f: IInForm) => {
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
    setFormData((f: IInForm) => {
      return { ...f, office: officeVal };
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
            return <Radio value={empType.value} label={empType.label} />;
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
        <Label htmlFor="localRemoteId">Local or Remote?</Label>
        <Switch
          id="localRemoteId"
          label={formData.isRemote ? "Remote" : "Local"}
          checked={formData.isRemote}
          onChange={onLocalRemote}
        />
        <Label htmlFor="arrivalDateId">Select estimated arrival date</Label>
        <DatePicker
          id="arrivalDateId"
          placeholder="Select estimated arrival date"
          ariaLabel="Select an estimated arrival date"
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
