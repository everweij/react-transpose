import * as React from "react";
import { Title, Wrapper, AnimatedBox } from "./common";

function RouteA({}) {
  return (
    <Wrapper>
      <Title>Route A</Title>
      <AnimatedBox
        id="a"
        style={{ width: 100, height: 100, backgroundColor: "#ff0000" }}
      />
    </Wrapper>
  );
}

export default RouteA;
