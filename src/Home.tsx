import { Stack } from "@fluentui/react";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
} from "@fluentui/react-components";
import { FunctionComponent } from "react";
import { MyRequests } from "components/MyRequests/MyRequests";
import { Link } from "react-router-dom";

const Home: FunctionComponent = (props) => {
  return (
    <Stack>
      <Stack.Item align="center">
        <h1>Welcome to the In/Out Processing Tool</h1>
      </Stack.Item>
      <Accordion multiple defaultOpenItems={["overview", "instructions"]}>
        <AccordionItem value="overview">
          <AccordionHeader as="h2" size="extra-large">
            Overview
          </AccordionHeader>
          <AccordionPanel>
            <p>
              XP-OZ is updating and automating the on-boarding checklists, with
              goal to eliminate paper copies and make it easier to track the
              status of the employees that are in-processing or out-processing
              in the directorate. The on-boarding tool will be accessible to new
              employees to the government, employees rotating into XP-OZ from
              other AFLCMC directorates and support contractors. This tool was
              developed by AFLCMC/XP-OZI and utilizes SharePoint to accomplish
              and track the employee's progress. The SharePoint site will be
              accessible to new employees, their supervisors and different
              section points of contact. The main in-processing sections include
              Information Technology (computer and access to AFNet), Automated
              Time Attendance and Production System (ATAAPs), Defense Travel
              System (DTS) and the Government Travel Card (GTC). The goal is to
              on-board all employees (new and rotating) and support contractors
              into XP-OZ within 5 workdays.
            </p>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="instructions">
          <AccordionHeader as="h2" size="extra-large">
            Instructions
          </AccordionHeader>
          <AccordionPanel>
            <p>
              This tool will allow the supervisor and employee to be able to
              track the status of the employee's on-boarding versus continuously
              asking the new employee if their checklist is complete. When
              informed of an incoming or outgoing employee with AFLCMC/XP-OZ,
              the supervisor will open a record to initiate the process. Each
              section in the automated process will require assigned leads to
              ensure the respective sections are completed and then acknowledge
              when completed. The supervisor will select the add record button
              and then input the information requested. Saving the file will
              initiate the respective in-out processing and inform the leads via
              email of a section they must complete with the employee.
            </p>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      <MyRequests />
      <br />
      <h2 style={{ paddingLeft: "1em" }}>
        <Link to="/myCheckListItems">View My Checklist Items</Link>
      </h2>
    </Stack>
  );
};

export default Home;
