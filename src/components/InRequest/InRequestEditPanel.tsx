import { Panel } from "@fluentui/react";
import { FunctionComponent } from "react";
import {
  Button,
  webLightTheme,
  FluentProvider,
} from "@fluentui/react-components";

export const InRequestEditPanel: FunctionComponent<any> = (props) => {
  // The footer of the EditPanel, containing the "Save" and "Cancel" buttons
  const onRenderFooterContent = () => (
    <FluentProvider theme={webLightTheme}>
      <div>
        <Button
          appearance="primary"
          onClick={() => {
            props.onEditSaveCancel("save");
          }}
        >
          Save
        </Button>
        <Button
          appearance="secondary"
          onClick={() => {
            props.onEditSaveCancel("cancel");
          }}
        >
          Cancel
        </Button>
      </div>
    </FluentProvider>
  );

  return (
    <>
      <Panel
        isOpen={props.isEditPanelOpen}
        isBlocking={true}
        onDismiss={() => {
          props.onEditSaveCancel("cancel");
        }}
        headerText="Edit Request"
        isFooterAtBottom={true}
        onRenderFooterContent={onRenderFooterContent}
      >
        <FluentProvider theme={webLightTheme}>
          {/* Pass in the form nodes */}
          {props.children}
        </FluentProvider>
      </Panel>
    </>
  );
};
