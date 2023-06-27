import { useContext } from "react";
import { makeStyles, Title1 } from "@fluentui/react-components";
import { useParams } from "react-router-dom";
import { UserContext } from "providers/UserProvider";
import { isInRequest, useRequest } from "api/RequestApi";
import { RoleType } from "api/RolesApi";
import { InRequest } from "components/InRequest/InRequest";
import { OutRequest } from "components/OutRequest/OutRequest";
import { CheckList } from "components/CheckList/CheckList";

/* FluentUI Styling */
const useStyles = makeStyles({
  requestItem: {
    display: "grid",
    paddingLeft: ".5em",
    paddingRight: ".5em",
    gridTemplateColumns: "minmax(250px, 1fr)",
    scrollbarGutter: "stable",
    maxHeight: "calc(100vh - 3em)", // Reserve 3em for NavHeader height
    overflowY: "auto",
  },
  requestTitle: {
    // Text (Title1) component requires it to be set as a block for elipsis to work
    display: "block",
  },
  checkList: {
    marginLeft: ".5em", // Add some margins to keep DataGrid
    marginRight: ".5em", // from displaying the horizontal scrollbar with Resize
  },
});

const Item = () => {
  const { itemNum } = useParams();
  const currentUser = useContext(UserContext);
  const request = useRequest(Number(itemNum));
  const classes = useStyles();

  if (currentUser.roles === undefined) {
    return <div className={classes.requestItem}>Loading...</div>;
  }

  let requestRoles = [...currentUser.roles];
  if (request.data?.supGovLead?.Id === currentUser.user.Id) {
    requestRoles.push(RoleType.SUPERVISOR);
    // If the current user is the Supervisor of the Request, then they also get the Employee role
    requestRoles.push(RoleType.EMPLOYEE);
  } else if (request.data?.employee?.Id === currentUser.user.Id) {
    requestRoles.push(RoleType.EMPLOYEE);
  }

  return (
    <div className={classes.requestItem}>
      {request.data ? (
        <>
          <div>
            <Title1
              truncate
              className={classes.requestTitle}
              title={
                request.data.reqType +
                " Processing Request for " +
                request.data.empName
              }
              wrap={false}
            >
              {request.data.reqType} Processing Request for{" "}
              {request.data.empName}
            </Title1>
          </div>
          <div>
            {isInRequest(request.data) ? (
              <InRequest request={request.data} roles={requestRoles} />
            ) : (
              <OutRequest request={request.data} roles={requestRoles} />
            )}
          </div>
          <div className={classes.checkList}>
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
      {request.error && request.error instanceof Error && (
        <div>An error has occured: ${request.error.message}</div>
      )}
    </div>
  );
};

export default Item;
