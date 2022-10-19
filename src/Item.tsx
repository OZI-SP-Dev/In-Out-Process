import { FunctionComponent, useContext } from "react";
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
    <div>
      <h1>Welcome to the Item Page</h1>
      {request.data ? (
        <InRequest request={request.data} roles={requestRoles} />
      ) : (
        <>Loading...</>
      )}
      {request.error && <>"An error has occured: " + {request.error}</>}
      <CheckList ReqId={Number(itemNum)} Roles={requestRoles} />
    </div>
  );
};
