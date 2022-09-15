import { HashRouter } from "react-router-dom";
import "./App.css";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { Route, Routes } from "react-router-dom";
import { Home } from "./Home";
import { Item } from "./Item";
import { InRequest, INFORMVIEWS } from "./components/InRequest/InRequest";
import { CheckListTest } from "./components/CheckList/CheckListTest";
import { ThemeProvider } from "@fluentui/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";
import { ErrorProvider } from "./providers/ErrorProvider";
import { ErrorNotification } from "./components/ErrorNotification/ErrorNotification";
import { UserProvider } from "providers/UserProvider";
import { Roles } from "components/Roles/Roles";

function App() {
  return (
    <UserProvider>
      <FluentProvider theme={webLightTheme}>
        <ThemeProvider>
          <HashRouter>
            <AppHeader />
            <ErrorProvider>
              <ErrorNotification />
              <Routes>
                <Route index element={<Home />} />
                <Route path="roles" element={<Roles />} />
                <Route path="item/:itemNum" element={<Item />} />
                <Route
                  path="new"
                  element={<InRequest view={INFORMVIEWS.NEW} />}
                />
                <Route path="checklist" element={<CheckListTest />} />
              </Routes>
            </ErrorProvider>
          </HashRouter>
        </ThemeProvider>
      </FluentProvider>
    </UserProvider>
  );
}

export default App;
