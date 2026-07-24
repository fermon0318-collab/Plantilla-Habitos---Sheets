import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { seedIfEmpty, dedupeChecks } from "./domain/db";
import "./styles/global.css";

Promise.all([seedIfEmpty(), dedupeChecks()]).finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
