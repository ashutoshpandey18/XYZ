import { RouterProvider } from "react-router-dom";
import { router } from "./router/routes";
import "./index.css";

import React from "react";
import ReactDOM from "react-dom/client";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
