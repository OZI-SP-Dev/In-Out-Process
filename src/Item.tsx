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

  // Initialize it as not being an open request so that the Checklist Complete buttons do not render until we know if it is or not
  let isRequestOpen: boolean = false;

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

  // Once we get data back from React Query -- check to see if the request is not Closed/Cancelled
  if (request.data && !request.data.closedOrCancelledDate) {
    isRequestOpen = true;
  }

  return (
    <>
      <h1 style={{ paddingLeft: ".5em", paddingRight: ".5em" }}>
        In Processing Request for {request.data?.empName || "...."}
      </h1>
      {request.data ? (
        <InRequest request={request.data} roles={requestRoles} />
      ) : (
        <div style={{ paddingLeft: ".5em", paddingRight: ".5em" }}>
          Loading...
        </div>
      )}
      {request.error && <>"An error has occured: " + {request.error}</>}
      <CheckList
        ReqId={Number(itemNum)}
        Roles={requestRoles}
        IsRequestOpen={isRequestOpen}
      />
    </>
  );
};
