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
import { ThemeProvider } from "@fluentui/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { ErrorProvider } from "providers/ErrorProvider";
import { ErrorNotification } from "components/ErrorNotification/ErrorNotification";
import { UserProvider } from "providers/UserProvider";
import { lazy, Suspense } from "react";

const Home = lazy(() => import("Home"));
const Roles = lazy(() => import("components/Roles/Roles"));
const Item = lazy(() => import("Item"));
const InRequestNewForm = lazy(
  () => import("components/InRequest/InRequestNewForm")
);
const MyCheckListItems = lazy(
  () => import("components/MyCheckListItems/MyCheckListItems")
);

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
              <Suspense fallback={<div>Loading...</div>}>
                <Outlet />
              </Suspense>
            </ErrorProvider>
          </ThemeProvider>
        </FluentProvider>
      </UserProvider>
    </>
  );
}

function App() {
  return <RouterProvider router={router}></RouterProvider>;
}

export default App;
