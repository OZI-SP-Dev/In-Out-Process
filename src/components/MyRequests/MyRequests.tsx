import { useContext } from "react";
import { UserContext } from "providers/UserProvider";
import { useMyRequests } from "api/RequestApi";
import { Link } from "react-router-dom";

export const MyRequests = () => {
  const { user } = useContext(UserContext);
  const { data, isLoading } = useMyRequests(user?.Id);

  if (user?.Id === undefined) {
    return <>Loading current user...</>;
  }

  if (isLoading) {
    return <>Loading Data...</>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Employee Name</th>
          <th>Estimated On-Boarding</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {data?.map((item) => {
          return (
            <tr key={item.Id}>
              <td>{item.Id}</td>
              <td>
                <Link to={"item/" + item.Id}>{item.empName}</Link>
              </td>
              <td>{item.eta.toLocaleDateString()}</td>
              {/*TODO: Change to show some sort of status field once established */}
              <td>{item.eta.toLocaleDateString()}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
