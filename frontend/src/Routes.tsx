import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import App from "./App";

export default function Routes() {
  return (
    <Router>
      <Switch>
        <Route path={["/app/:boxId", "/app"]}>
          <App />
        </Route>
        <Route path="/">
          <LandingPage />
        </Route>
      </Switch>
    </Router>
  );
}
