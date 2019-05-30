import * as React from "react";
import { Title, Wrapper, AnimatedBox } from "./common";

function RouteB({}) {
  return (
    <Wrapper>
      <Title>Route B</Title>
      <AnimatedBox
        id="b"
        style={{
          marginLeft: 200,
          width: 200,
          height: 200,
          backgroundColor: "#0000ff"
        }}
      />
    </Wrapper>
  );
}

export default RouteB;
