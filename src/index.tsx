import { StrictMode } from "react";
import ReactDOM from "react-dom";
import "index.css";
import App from "App";
import { initializeIcons } from "@fluentui/font-icons-mdl2";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Initialize from a location we have access to, default location is blocked so using alternate
//  see https://github.com/microsoft/fluentui/wiki/Using-icons
initializeIcons();

if (import.meta.env.DEV) {
  const browser = await import("./mocks/browser.js" as any);
  browser.worker.start({
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
