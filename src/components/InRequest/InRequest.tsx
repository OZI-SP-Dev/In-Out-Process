import { FunctionComponent } from "react";
import { Button } from "@fluentui/react-components";
import { useCurrentUser } from "api/UserApi";
import { useRequest } from "api/RequestApi";
import { InRequestViewCompact } from "components/InRequest/InRequestViewCompact";
import { InRequestEditPanel } from "components/InRequest/InRequestEditPanel";
import { useBoolean } from "@fluentui/react-hooks";

interface IInRequest {
  ReqId: number;
}
export const InRequest: FunctionComponent<IInRequest> = (props) => {
  const currentUser = useCurrentUser();
  const request = useRequest(props.ReqId);

  /* Boolean state for determining whether or not the Edit Panel is shown */
  const [isEditPanelOpen, { setTrue: showEditPanel, setFalse: hideEditPanel }] =
    useBoolean(false);

  //** Is the Current User the Superviosr/Gov Lead of this Request */
  const isSupervisor = request.data?.supGovLead.SPUserId === currentUser.Id;

  if (request.data) {
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
              onEditCancel={hideEditPanel}
              isEditPanelOpen={isEditPanelOpen}
              data={request.data}
            />
          </>
        )}
      </>
    );
  }

  if (request.error) {
    return <>"An error has occured: " + {request.error}</>;
  }

  return <>Loading...</>;
};
