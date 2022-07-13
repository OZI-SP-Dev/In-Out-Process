import { ChoiceGroup, ComboBox, DatePicker, FontWeights, getTheme, IChoiceGroupOption, IComboBox, IComboBoxOption, IconButton, IIconProps, IToggle, Label, mergeStyleSets, Modal, PrimaryButton, SelectableOptionMenuItemType, Stack, TextField, Toggle } from '@fluentui/react';
import React, { useState } from "react";
import { PeoplePicker } from '../PeoplePicker/PeoplePicker';
import { useId, useBoolean } from '@fluentui/react-hooks';

const cancelIcon: IIconProps = { iconName: 'Cancel' };

const GS_GRADES: IComboBoxOption[] = [
  { key: 'GS', text: 'GS', itemType: SelectableOptionMenuItemType.Header },
  { key: 'GS-01', text: 'GS-01' },
  { key: 'GS-02', text: 'GS-02' },
  { key: 'GS-03', text: 'GS-03' },
  { key: 'GS-04', text: 'GS-04' },
  { key: 'GS-05', text: 'GS-05' },
  { key: 'GS-06', text: 'GS-06' },
  { key: 'GS-07', text: 'GS-07' },
  { key: 'GS-08', text: 'GS-08' },
  { key: 'GS-09', text: 'GS-09' },
  { key: 'GS-10', text: 'GS-10' },
  { key: 'GS-11', text: 'GS-11' },
  { key: 'GS-12', text: 'GS-12' },
  { key: 'GS-13', text: 'GS-13' },
  { key: 'GS-14', text: 'GS-14' },
  { key: 'GS-15', text: 'GS-15' },
];

const NH_GRADES: IComboBoxOption[] = [
  { key: 'divider', text: '-', itemType: SelectableOptionMenuItemType.Divider },
  { key: 'NH', text: 'NH', itemType: SelectableOptionMenuItemType.Header },
  { key: 'NH-02', text: 'NH-03' },
  { key: 'NH-03', text: 'NH-04' },
  { key: 'NH-04', text: 'NH-05' },
  { key: 'NH-05', text: 'NH-06' },
];

const MIL_GRADES: IComboBoxOption[] = [
  { key: 'Enlisted', text: 'Enlisted', itemType: SelectableOptionMenuItemType.Header },
  { key: 'E-1', text: 'E-1' },
  { key: 'E-2', text: 'E-2' },
  { key: 'E-3', text: 'E-3' },
  { key: 'E-4', text: 'E-4' },
  { key: 'E-5', text: 'E-5' },
  { key: 'E-6', text: 'E-6' },
  { key: 'E-7', text: 'E-7' },
  { key: 'E-8', text: 'E-8' },
  { key: 'E-9', text: 'E-9' },
  { key: 'divider', text: '-', itemType: SelectableOptionMenuItemType.Divider },
  { key: 'Officer', text: 'Officer', itemType: SelectableOptionMenuItemType.Header },
  { key: 'O-1', text: 'O-1' },
  { key: 'O-2', text: 'O-2' },
  { key: 'O-3', text: 'O-3' },
  { key: 'O-4', text: 'O-4' },
  { key: 'O-5', text: 'O-5' },
  { key: 'O-6', text: 'O-6' },
  { key: 'O-7', text: 'O-7' },
  { key: 'O-8', text: 'O-8' },
  { key: 'O-9', text: 'O-9' },
  { key: 'O-10', text: 'O-10' },
];

const OFFICES: IComboBoxOption[] = [
  { key: 'XP-OZ', text: 'XP-OZ' },
  { key: 'divider', text: '-', itemType: SelectableOptionMenuItemType.Divider },
  { key: 'OZA', text: 'OZA' },
  { key: 'divider', text: '-', itemType: SelectableOptionMenuItemType.Divider },
  { key: 'OZI', text: 'OZI' },
  { key: 'OZIC', text: 'OZIC' },
  { key: 'OZIF', text: 'OZIF' },
  { key: 'OZIP', text: 'OZIP' },
  { key: 'divider', text: '-', itemType: SelectableOptionMenuItemType.Divider },
  { key: 'OZJ', text: 'OZJ' },
  { key: 'divider', text: '-', itemType: SelectableOptionMenuItemType.Divider },
  { key: 'OZJ', text: 'OZJ', itemType: SelectableOptionMenuItemType.Header },
  { key: 'divider', text: '-', itemType: SelectableOptionMenuItemType.Divider },
  { key: 'OZO', text: 'OZO' },
  { key: 'divider', text: '-', itemType: SelectableOptionMenuItemType.Divider },
  { key: 'OZT', text: 'OZT' },
  { key: 'divider', text: '-', itemType: SelectableOptionMenuItemType.Divider },
  { key: 'OZZ', text: 'OZZ' },
];

const EMPTYPES: IChoiceGroupOption[] = [
  { key: 'civ', text: 'Civilian' },
  { key: 'mil', text: 'Military' },
  { key: 'ctr', text: 'Contractor' }
];

export const InForm: React.FunctionComponent<any> = (props) => {
  //TODO - Set up a type for InForm
  let defaultInForm: any = { empName: 'Doe, Jane A', isRemote: true };
  const [formData, setFormData] = useState(defaultInForm)
  const [gradeRankOptions, setGradeRankOptions] = React.useState<IComboBoxOption[]>([]);  

  const onEmpTypeChange = React.useCallback((ev: React.SyntheticEvent<HTMLElement> | undefined, option?: IChoiceGroupOption) => {
    if (option)
      setFormData((f: any) => {
        let availGradeRank = []
        switch (option.key) {
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
        return { ...f, empType: option.key }
      });
  }, []);

  const onLocalRemote = React.useCallback((ev: React.FormEvent<IToggle>, checked: boolean | undefined) => {
    setFormData((f: any) => {
      return { ...f, isRemote: checked }
    });
  }, []);

  const onNewCiv = React.useCallback((ev: React.FormEvent<IToggle>, checked: boolean | undefined) => {
    setFormData((f: any) => {
      return { ...f, isNewCiv: checked }
    });
  }, []);

  const onEmpNameChange = React.useCallback(
    (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
      setFormData((f: any) => {
        return { ...f, empName: newValue }
      });
    },
    [],
  );

  const onGradeChange = React.useCallback(
    (event: React.FormEvent<IComboBox>, option?: IComboBoxOption, index?: number, value?: string): void => {
      setFormData((f: any) => {
        return { ...f, gradeRank: option?.key }
      });
    },
    [],
  );

  const onOfficeChange = React.useCallback(
    (event: React.FormEvent<IComboBox>, option?: IComboBoxOption, index?: number, value?: string): void => {
      setFormData((f: any) => {
        return { ...f, office: option?.key }
      });
    },
    [],
  );

  const [isModalOpen, { setTrue: showModal, setFalse: hideModal }] = useBoolean(false);


  // Use useId() to ensure that the IDs are unique on the page.
  // (It's also okay to use plain strings and manually ensure uniqueness.)
  const titleId = useId('title');

  function reviewRecord() {
    showModal();
  }

  return (
    <div>
    <Stack>
      <Stack.Item>
        <TextField
          label="Employee Name"
          value={formData.empName}
          onChange={onEmpNameChange}
        />
        <ChoiceGroup selectedKey={formData.empType} options={EMPTYPES} onChange={onEmpTypeChange} label="Employee Type" />
        <ComboBox
          selectedKey={formData.gradeRank}
          label="Grade/Rank"
          autoComplete="on"
          options={gradeRankOptions}
          onChange={onGradeChange}
          dropdownWidth={100}
          disabled={formData.empType === "ctr"}
        />
        <Toggle label="Local or Remote" onText="Remote" offText="Local" checked={formData.isRemote} onChange={onLocalRemote} />
        <DatePicker
          placeholder="Select estimated arrival date"
          ariaLabel="Select an estimated arrival date"
          label="Select estimated arrival date"
        />
        <ComboBox
          selectedKey={formData.office}
          label="Office"
          autoComplete="on"
          options={OFFICES}
          onChange={onOfficeChange}
          dropdownWidth={100}
        />
        <Label>Supervisor/Government Lead</Label>
        <PeoplePicker
        
        />
        {formData.empType === 'civ' ? <Toggle label="Is Employee a New to Air Force Civilian?" onText="Yes" offText="No" onChange={onNewCiv} /> : null}
        <PrimaryButton text="Create In Processing Record" onClick={reviewRecord}></PrimaryButton>
      </Stack.Item>
    </Stack>
        <Modal
        titleAriaId={titleId}
        isOpen={isModalOpen}
        onDismiss={hideModal}
        isModeless={true}
        containerClassName={contentStyles.container}
      >
        <div className={contentStyles.header}>
          <span id={titleId}>Review Information</span>
          <IconButton
            styles={iconButtonStyles}
            iconProps={cancelIcon}
            ariaLabel="Close popup modal"
            onClick={hideModal}
          />
        </div>

        <div className={contentStyles.body}>
          <p>
            Please review the below information:  If corect continue processing, if something needs adjusted, cancel and make changes.
          </p>
        </div>
      </Modal>
      </div>
  );
}

const theme = getTheme();
const contentStyles = mergeStyleSets({
  container: {
    display: 'flex',
    flexFlow: 'column nowrap',
    alignItems: 'stretch',
  },
  header: [
    theme.fonts.xxLarge,
    {
      flex: '1 1 auto',
      borderTop: `4px solid ${theme.palette.themePrimary}`,
      color: theme.palette.neutralPrimary,
      display: 'flex',
      alignItems: 'center',
      fontWeight: FontWeights.semibold,
      padding: '12px 12px 14px 24px',
    },
  ],
  body: {
    flex: '4 4 auto',
    padding: '0 24px 24px 24px',
    overflowY: 'hidden',
    selectors: {
      p: { margin: '14px 0' },
      'p:first-child': { marginTop: 0 },
      'p:last-child': { marginBottom: 0 },
    },
  },
});

const iconButtonStyles = {
  root: {
    color: theme.palette.neutralPrimary,
    marginLeft: 'auto',
    marginTop: '4px',
    marginRight: '2px',
  },
  rootHovered: {
    color: theme.palette.neutralDark,
  },
};