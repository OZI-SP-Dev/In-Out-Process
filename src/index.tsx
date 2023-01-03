import { StrictMode } from "react";
import ReactDOM from "react-dom";
import "index.css";
import App from "App";
import reportWebVitals from "reportWebVitals";
import { initializeIcons } from "@fluentui/font-icons-mdl2";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Initialize from a location we have access to, default location is blocked so using alternate
//  see https://github.com/microsoft/fluentui/wiki/Using-icons
initializeIcons();

if (process.env.NODE_ENV === "development") {
  const { worker } = require("./mocks/browser");
  worker.start({
    onUnhandledRequest(
      req: { url: { pathname: string } },
      print: { warning: () => void }
    ) {
      if (
        req.url.pathname.startsWith("/favicon.ico") ||
        req.url.pathname.startsWith("/manifest.json") ||
        req.url.pathname.endsWith(".png") // Ignore giving warning for things like the logo, the persona icons, etc
      ) {
        return;
      }

      print.warning();
    },
  });
}

const queryClient = new QueryClient();

ReactDOM.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
