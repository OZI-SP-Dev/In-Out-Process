import { HashRouter } from "react-router-dom";
import "./App.css";
import Roles from "./Roles";
import { AppHeader } from "./components/AppHeader/AppHeader";
import { Route, Routes } from "react-router-dom";
import  Home from "./Home";
import { Item } from "./Item";
import { InForm } from "./components/InForm/InForm";
import { CheckListTest } from "./components/CheckList/CheckListTest";
import { ThemeProvider } from "fluentui/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";

function App() {
  return (
    <FluentProvider theme={webLightTheme}>
      <ThemeProvider>
        <HashRouter>
          <AppHeader />
          <Routes>
            <Route index element={<Home />} />
            <Route path="roles" element={<Roles />} />
            <Route path="item/:itemNum" element={<Item />} />
            <Route path="new" element={<InForm />} />
            <Route path="checklist" element={<CheckListTest />} />
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </FluentProvider>
  );
}

export default App;
