import { Stack } from "@fluentui/react";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Button,
  makeStyles,
} from "@fluentui/react-components";
import { FunctionComponent } from "react";
import { Link } from "react-router-dom";
import { MyRequests } from "components/MyRequests/MyRequests";

/* FluentUI Styling */
const useStyles = makeStyles({
  createButtons: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingTop: "1.5em",
    paddingBottom: "1.5em",
  },
});

export const Home: FunctionComponent = (props) => {
  const classes = useStyles();
  function createNewOutRequest() {
    window.alert("This feature will be coming on a later release");
    return true;
  }

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
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum
            </p>
          </AccordionPanel>
        </AccordionItem>
        <AccordionItem value="instructions">
          <AccordionHeader as="h2" size="extra-large">
            Instructions
          </AccordionHeader>
          <AccordionPanel>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum
            </p>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
      <div className={classes.createButtons}>
        <Link to="/new" style={{ textDecorationLine: "none" }}>
          <Button appearance="primary" size="large">
            Create New In Processing Request
          </Button>
        </Link>
        <Button appearance="primary" size="large" onClick={createNewOutRequest}>
          Create New Out Processing Request
        </Button>
      </div>
      <MyRequests />
    </Stack>
  );
};
