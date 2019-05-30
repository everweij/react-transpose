import * as React from "react";

import { SwitchGroup, Stage } from "react-transpose";

import RouteA from "./A";
import RouteB from "./B";
import RouteC from "./C";

const routes = ["a", "b", "c"];

export default function Boxes() {
  const [stage, setStage] = React.useState("a");

  return (
    <div style={{ position: "relative" }}>
      <button
        style={{ marginLeft: 400, marginTop: 16 }}
        onClick={() => {
          const currentIndex = routes.indexOf(stage);
          if (currentIndex + 1 > routes.length - 1) {
            setStage(routes[0]);
          } else {
            setStage(routes[currentIndex + 1]);
          }
        }}
      >
        Toggle Stage
      </button>
      <SwitchGroup stage={stage} setStage={setStage}>
        <Stage stage="a" render={() => <RouteA />} />
        <Stage stage="b" component={RouteB} />
        <Stage stage="c" component={RouteC} />
      </SwitchGroup>
    </div>
  );
}
