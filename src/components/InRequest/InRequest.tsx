import { FunctionComponent, useContext } from "react";
import { Button } from "@fluentui/react-components";
import { UserContext } from "../../providers/UserProvider";
import { useRequest } from "../../api/RequestApi";
import { InRequestViewCompact } from "./InRequestViewCompact";
import { InRequestEditPanel } from "./InRequestEditPanel";
import { useBoolean } from "@fluentui/react-hooks";

export const InRequest: FunctionComponent<any> = (props) => {
  const userContext = useContext(UserContext);
  const request = useRequest(props.ReqId);

  /* Boolean state for determining whether or not the Edit Panel is shown */
  const [isEditPanelOpen, { setTrue: showEditPanel, setFalse: hideEditPanel }] =
    useBoolean(false);

  if (request.isLoading) {
    return <>Loading...</>;
  }

  //** Is the Current User the Superviosr/Gov Lead of this Request */
  const isSupervisor =
    request.data?.supGovLead.SPUserId === userContext.user?.Id;

  /* Callback function to be provided to the EditPanel component for action on Save */
  const onEditCancel = () => {
    // If the user cancels, set the form back to what was passed in orginally
    hideEditPanel();
  };

  if (!request.isLoading && request.data) {
    return (
      <>
        <InRequestViewCompact formData={request.data} />{" "}
        {isSupervisor && (
          <>
            <Button
              appearance="primary"
              className="floatRight"
              onClick={showEditPanel}
            >
              Edit
            </Button>
            <InRequestEditPanel
              onEditSave={hideEditPanel}
              onEditCancel={onEditCancel}
              isEditPanelOpen={isEditPanelOpen}
              data={request.data}
            />
          </>
        )}
      </>
    );
  } else {
    return <>Waiting on requested data...</>;
  }
};
