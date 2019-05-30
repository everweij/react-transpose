import * as React from "react";
import { Title, Wrapper, AnimatedBox } from "./common";

function RouteC({}) {
  return (
    <Wrapper>
      <Title>Route C</Title>
      <AnimatedBox
        id="c"
        style={{
          marginLeft: 400,
          width: 100,
          height: 100,
          backgroundColor: "#00ff00"
        }}
      />
    </Wrapper>
  );
}

export default RouteC;
