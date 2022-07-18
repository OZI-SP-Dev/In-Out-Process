import { PrimaryButton, Separator, Stack } from "@fluentui/react";
import { Link, useNavigate } from "react-router-dom";

function Home() {
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
      <Separator alignContent="start">
        <h2>Overview</h2>
      </Separator>
      <Stack.Item align="stretch">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum
        </p>
      </Stack.Item>
      <Separator alignContent="start">
        <h2>Instructions</h2>
      </Separator>
      <Stack.Item align="baseline">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum
        </p>
      </Stack.Item>

      <Stack.Item align="center">
        <PrimaryButton
          text="Create New Item"
          onClick={createNewItem}
        ></PrimaryButton>
      </Stack.Item>
      <Link to="item/1">Item 1</Link>
      <br />
      <Link to="item/2">Item 2</Link>
    </Stack>
  );
}

export default Home;
