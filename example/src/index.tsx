import "./index.css";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { BrowserRouter, Switch, Route } from "react-router-dom";

import Boxes from "./Boxes";
import ListDetail from "./ListDetail";

function App() {
  return (
    <Switch>
      <Route path={"/boxes"} component={Boxes} />
      <Route path={"/listdetail"} component={ListDetail} />
    </Switch>
  );
}

ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById("root")
);
