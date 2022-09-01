import { IColumn } from "@fluentui/react";
import { ShimmeredDetailsList } from "@fluentui/react/lib/ShimmeredDetailsList";
import { useContext } from "react";
import { UserContext } from "providers/UserProvider";
import { useMyRequests } from "api/RequestApi";

export const MyRequests = () => {
  const { user } = useContext(UserContext);
  const { data, isLoading, isError } = useMyRequests(user?.Id);

  if (user?.Id === undefined) {
    return <>Loading current user</>;
  }

  // Define columns for details list
  const columns: IColumn[] = [
    {
      key: "myRequestsId",
      name: "Item",
      fieldName: "Id",
      minWidth: 40,
      maxWidth: 40,
      isResizable: false,
    },
    {
      key: "myRequestsEmpName",
      name: "Employee Name",
      fieldName: "empName",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: "myRequestsTargetOnBoard",
      name: "Estimated On-boarding",
      fieldName: "eta",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: "myRequestsStatus",
      name: "Status",
      fieldName: "completionDate",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
    },
  ];

  console.log(data);
  return (
    <div>
      <ShimmeredDetailsList
        items={data || []}
        columns={columns}
        enableShimmer={isLoading || isError}
      />
    </div>
  );
};
