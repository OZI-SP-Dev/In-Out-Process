import { FunctionComponent, useContext } from "react";
import { Title1 } from "@fluentui/react-components";
import { useParams } from "react-router-dom";
import { CheckList } from "components/CheckList/CheckList";
import { InRequest } from "components/InRequest/InRequest";
import { UserContext } from "providers/UserProvider";
import { useRequest } from "api/RequestApi";
import { RoleType } from "api/RolesApi";
export const Item: FunctionComponent = (props) => {
  const { itemNum } = useParams();
  const currentUser = useContext(UserContext);
  const request = useRequest(Number(itemNum));
  let requestRoles: RoleType[];

  if (currentUser.roles === undefined) {
    return <>Loading...</>;
  } else {
    requestRoles = [...currentUser.roles];
    if (request?.data?.supGovLead.Id === currentUser.user?.Id) {
      requestRoles.push(RoleType.SUPERVISOR);
      // If the current user is the Supervisor of the Request, then they also get the Employee role
      requestRoles.push(RoleType.EMPLOYEE);
    } else if (request?.data?.employee?.Id === currentUser.user?.Id) {
      requestRoles.push(RoleType.EMPLOYEE);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        paddingLeft: ".5em",
        paddingRight: ".5em",
        gridTemplateColumns: "repeat(1, minmax(250px, 1fr)",
      }}
    >
      <div>
        <Title1
          truncate
          title={
            "In Processing Request for " + (request.data?.empName || "....")
          }
          wrap={false}
          style={{
            display: "block",
          }}
        >
          In Processing Request for {request.data?.empName || "...."}
        </Title1>
      </div>
      {request.data ? (
        <>
          <div>
            <InRequest request={request.data} roles={requestRoles} />
          </div>
          <div>
            <CheckList
              ReqId={Number(itemNum)}
              Roles={requestRoles}
              Request={request.data}
            />
          </div>
        </>
      ) : (
        <div>Loading...</div>
      )}
      {request?.error && <div>"An error has occured: " + request.error</div>}
    </div>
  );
};
