import { Stack } from "@fluentui/react";
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Button,
} from "@fluentui/react-components";
import { FunctionComponent } from "react";
import { Link, useNavigate } from "react-router-dom";

export const Home: FunctionComponent = (props) => {
  let navigate = useNavigate();

  function createNewItem() {
    navigate("new");
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

      <Button appearance="primary" onClick={createNewItem}>
        Create New In Processing
      </Button>
      <Button appearance="primary" onClick={createNewItem}>
        Create New Out Processing
      </Button>

      <Link to="item/1">Item 1</Link>
      <br />
      <Link to="item/2">Item 2</Link>
    </Stack>
  );
};
