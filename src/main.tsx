import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { seedIfEmpty } from "./domain/db";
import "./styles/global.css";

seedIfEmpty().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});
