import { FunctionComponent } from "react";
import { Button } from "@fluentui/react-components";
import { InRequestViewCompact } from "components/InRequest/InRequestViewCompact";
import { InRequestEditPanel } from "components/InRequest/InRequestEditPanel";
import { useBoolean } from "@fluentui/react-hooks";
import { IInRequest } from "api/RequestApi";
import { RoleType } from "api/RolesApi";

interface IInRequestComp {
  request: IInRequest;
  roles: RoleType[];
}

export const InRequest: FunctionComponent<IInRequestComp> = (props) => {
  /* Boolean state for determining whether or not the Edit Panel is shown */
  const [isEditPanelOpen, { setTrue: showEditPanel, setFalse: hideEditPanel }] =
    useBoolean(false);

  //** Is the Current User the Superviosr/Gov Lead of this Request */
  const isSupervisor = props.roles.includes(RoleType.Supervisor);

  return (
    <>
      <InRequestViewCompact formData={props.request} />
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
            data={props.request}
          />
        </>
      )}
    </>
  );
};
