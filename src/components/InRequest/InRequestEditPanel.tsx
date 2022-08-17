import { Panel } from "@fluentui/react";
import { FunctionComponent, useState } from "react";
import { useBoolean } from "@fluentui/react-hooks";
import {
  Button,
  webLightTheme,
  FluentProvider,
} from "@fluentui/react-components";
import { IInForm } from "../../api/RequestApi";
import { INFORMVIEWS, InRequest } from "./InRequest";

export const InRequestEditPanel: FunctionComponent<any> = (props) => {
  const [saveCancelEvent, setSaveCancelEvent] = useState<string>("");

  /* Boolean state for determining whether or not the Edit Panel is shown */
  const [isEditPanelOpen, { setTrue: showEditPanel, setFalse: hideEditPanel }] =
    useBoolean(props.isEditPanelOpen);

  /* Function to handle the save or cancel */
  const onEditSaveCancel = (formEdits: IInForm | undefined): void => {
    // Call the callback function provided as a prop to update the parent component
    props.onEditSaveCancel(formEdits);

    hideEditPanel();

    // Clear the event type
    setSaveCancelEvent("");
  };

  // The footer of the EditPanel, containing the "Save" and "Cancel" buttons
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

  return (
    <>
      {/* TODO -- Allow this to be a passed in styled component for showing/hiding the Edit panel*/}
      <Button
        appearance="primary"
        className="floatRight"
        onClick={showEditPanel}
      >
        Edit
      </Button>
      <Panel
        isOpen={isEditPanelOpen}
        isBlocking={true}
        onDismiss={hideEditPanel}
        headerText="Edit Request"
        isFooterAtBottom={true}
        onRenderFooterContent={onRenderFooterContent}
      >
        <FluentProvider theme={webLightTheme}>
          {/* Pass in the current formData with no ReqId so it doesn't re-read from the source */}
          <InRequest
            view={INFORMVIEWS.EDIT}
            formData={props.formData}
            onEditSaveCancel={onEditSaveCancel}
            saveCancelEvent={saveCancelEvent}
          />
        </FluentProvider>
      </Panel>
    </>
  );
};
