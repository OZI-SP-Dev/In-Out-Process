import { useContext, useState } from "react";
import { RoleType } from "api/RolesApi";
import { UserContext } from "providers/UserProvider";
import {
  SelectTabData,
  SelectTabEvent,
  Tab,
  TabList,
  TabValue,
} from "@fluentui/react-components";
import { RolesByRole } from "components/Roles/RolesByRole";
import { RolesByUser } from "components/Roles/RolesByUser";
import { Navigate } from "react-router-dom";
import { AddUserRole } from "./AddUserRole";

export const Roles: React.FunctionComponent = () => {
  const userContext = useContext(UserContext);
  // Which tab is selected
  const [selectedValue, setSelectedValue] = useState<TabValue>("ByRole");

  // Event when they change to "By Role" or "By User" tab
  const onTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setSelectedValue(data.value);
  };

  // Ensure we have a roles object before determining whether or not to redirect
  if (userContext.roles) {
    if (!userContext.roles.includes(RoleType.ADMIN)) {
      // If they are not an ADMIN, redirect to the Homepage
      return <Navigate to="/" replace={true} />;
    }
  }

  return (
    <>
      <h2>Current Assigned Roles</h2>
      <TabList selectedValue={selectedValue} onTabSelect={onTabSelect}>
        <Tab value="ByRole">By Role</Tab>
        <Tab value="ByUser">By User</Tab>
      </TabList>
      {selectedValue === "ByRole" && <RolesByRole />}
      {selectedValue === "ByUser" && <RolesByUser />}
      <hr />
      <h2>Add User to Role</h2>
      <AddUserRole />{" "}
    </>
  );
};
