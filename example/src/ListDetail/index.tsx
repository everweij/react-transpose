import * as React from "react";
import useReactRouter from "use-react-router";
import { Switch, Route } from "react-router-dom";

import { Group } from "react-transpose";

import List from "./List";
import Detail from "./Detail";

export default function Boxes() {
  const { location, match } = useReactRouter();

  return (
    <div
      style={{
        position: "relative",
        backgroundColor: "#d7e0e4",
        width: "100vw",
        minHeight: "100vh",
        margin: 0
      }}
    >
      <Group currentPath={location.pathname}>
        <Switch location={location}>
          <Route exact path={match.url + "/"} component={List} />
          <Route exact path={match.url + "/:id"} component={Detail} />
        </Switch>
      </Group>
    </div>
  );
}
