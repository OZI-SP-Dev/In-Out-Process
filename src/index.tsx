import { StrictMode } from "react";
import ReactDOM from "react-dom";
import "index.css";
import App from "App";
import { initializeIcons } from "@fluentui/font-icons-mdl2";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Initialize from a location we have access to, default location is blocked so using alternate
//  see https://github.com/microsoft/fluentui/wiki/Using-icons
initializeIcons();

async function prepareMSW() {
  if (import.meta.env.DEV) {
    const { worker } = await import("mocks/browser");

    return worker.start({
      onUnhandledRequest(
        req: { url: { pathname: string } },
        print: { warning: () => void }
      ) {
        if (
          // Ignore giving warning for things like the logo, the persona icons, etc
          req.url.pathname.startsWith("/favicon.ico") ||
          req.url.pathname.endsWith(".png") ||
          req.url.pathname.endsWith(".woff") ||
          // Ignore giving warning for dynamic imports
          req.url.pathname.endsWith(".ts") ||
          req.url.pathname.endsWith(".tsx") ||
          req.url.pathname.endsWith(".js")
        ) {
          return;
        }

        print.warning();
      },
    });
  }
}

const queryClient = new QueryClient();

prepareMSW().then(() => {
  ReactDOM.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
    document.getElementById("root")
  );
});
