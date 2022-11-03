import { useEffect, useState } from "react";
import { useRoleManagement, useAllUserRolesByUser, SPRole } from "api/RolesApi";
import { PeoplePicker } from "components/PeoplePicker/PeoplePicker";
import { IPerson } from "api/UserApi";
import {
  ConstrainMode,
  DetailsList,
  IColumn,
  SelectionMode,
} from "@fluentui/react";
import { CancelIcon } from "@fluentui/react-icons-mdl2";

export const RolesByUser: React.FunctionComponent = () => {
  const { data: allRolesByUser } = useAllUserRolesByUser();
  const [items, setItems] = useState<SPRole[]>([]);

  // TODO - Actually implement people picker to select the user
  const selectedUser: IPerson = { Id: 1, Title: "TEST", EMail: "TEST" };

  useEffect(() => {
    const newItems = allRolesByUser?.get(selectedUser.Id);
    if (newItems === undefined) {
      setItems([]);
    } else {
      setItems(newItems);
    }
  }, [allRolesByUser, selectedUser.Id]);

  const columns: IColumn[] = [
    {
      key: "name",
      name: "Role",
      minWidth: 100,
      isResizable: true,
      onRender: (item) => item.Title,
    },
    {
      key: "action",
      name: "",
      minWidth: 20,
      maxWidth: 20,
      isResizable: false,
      onRender: (item) => (
        <CancelIcon onClick={() => removeRoleClick(item.Id)} />
      ),
    },
  ];

  // Get the hook with functions to perform Role Management
  const { removeRole } = useRoleManagement();

  // Function to test removing a Role
  const removeRoleClick = (role: number) => {
    removeRole.mutate(role);
  };

  return (
    <>
      <PeoplePicker
        ariaLabel={"Select the user to view the roles of"}
        updatePeople={function (p: IPerson[]): void {
          throw new Error("Function not implemented.");
        }}
        selectedItems={selectedUser}
      ></PeoplePicker>
      <DetailsList
        items={items}
        columns={columns}
        selectionMode={SelectionMode.none}
        constrainMode={ConstrainMode.unconstrained}
      ></DetailsList>
    </>
  );
};
