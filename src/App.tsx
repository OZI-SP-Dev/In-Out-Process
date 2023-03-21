import {
  createHashRouter,
  createRoutesFromElements,
  Outlet,
  RouterProvider,
  ScrollRestoration,
} from "react-router-dom";
import "App.css";
import { AppHeader } from "components/AppHeader/AppHeader";
import { Route } from "react-router-dom";
import { Home } from "Home";
import { Item } from "Item";
import { ThemeProvider } from "@fluentui/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { ErrorProvider } from "providers/ErrorProvider";
import { ErrorNotification } from "components/ErrorNotification/ErrorNotification";
import { UserProvider } from "providers/UserProvider";
import { Roles } from "components/Roles/Roles";
import { InRequestNewForm } from "components/InRequest/InRequestNewForm";
import { MyCheckListItems } from "components/MyCheckListItems/MyCheckListItems";

/** Create a React Router with the needed Routes using the Data API */
const router = createHashRouter(
  createRoutesFromElements(
    <Route element={<MainLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="roles" element={<Roles />} />
      <Route path="item/:itemNum" element={<Item />} />
      <Route path="new" element={<InRequestNewForm />} />
      <Route path="myCheckListItems" element={<MyCheckListItems />} />
    </Route>
  )
);

/** Create the main structure for the app, so the React Router has an Outlet to put the content for the selected Route */
function MainLayout() {
  return (
    <>
      <ScrollRestoration /> {/* Scroll window back to top on navigation */}
      <UserProvider>
        <FluentProvider theme={webLightTheme}>
          <ThemeProvider>
            <AppHeader />
            <ErrorProvider>
              <ErrorNotification />
              <Outlet />
            </ErrorProvider>
          </ThemeProvider>
        </FluentProvider>
      </UserProvider>
    </>
  );
}

function App() {
  return (
    <>
      <RouterProvider router={router}></RouterProvider>
    </>
  );
}

export default App;
