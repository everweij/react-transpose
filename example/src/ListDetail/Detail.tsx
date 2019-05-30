import * as React from "react";
import styled from "styled-components";
import { RouteComponentProps } from "react-router-dom";

import { transposed, transposedShared } from "react-transpose";

import data from "./data";

import Item from "./Item";
import Info from "./Info";

const Wrapper = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
`;

const Header = transposed(styled.div`
  padding: 16px 32px;
`)({
  enter: {
    backgroundColor: "rgba(105, 141, 179, 1)"
  },
  exit: {
    backgroundColor: "rgba(105, 141, 179, 0)"
  }
});

const Body = transposed(styled.div`
  background-color: white;
  padding: 16px 32px;
  opacity: 0;

  & > * {
    margin-bottom: 16px;
  }
`)({
  enter: {
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 25
    }
  },
  exit: {
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 25
    }
  }
});

const AnimatedItem = transposedShared(Item)({
  sharedKey: props => props.id,
  transition: {
    type: "spring",
    stiffness: 500,
    damping: 70,
    delay: 300
  },
  animationProps: ["y"]
});

const AnimatedInfo = transposed(Info)({
  enter: ({ props }) => ({
    x: 0,
    opacity: 1,
    transition: {
      stiffness: 200,
      damping: 30,
      type: "spring",
      delay: 300 + props.index * 50
    }
  }),
  exit: {
    x: 50,
    opacity: 0,
    transition: {
      stiffness: 200,
      damping: 30,
      type: "spring"
    }
  }
});

const Button = transposed(styled.button`
  margin-bottom: 6px;
`)({
  enter: {
    opacity: 1,
    transition: {
      type: "tween",
      duration: 500
    } as any
  },
  exit: {
    opacity: 0,
    transition: {
      type: "tween",
      duration: 500
    } as any
  }
});

const infos = ["Info A", "Info B", "Info C", "Info D"];

function Detail({ match, history }: RouteComponentProps<{ id: string }>) {
  const id = match.params.id;
  const item = data.find(x => x.id === id);

  return (
    <Wrapper>
      <Header>
        <Button onClick={() => history.push("/listdetail")}>Back</Button>
        <AnimatedItem id={id} index={0} title={item!.title} />
      </Header>
      <Body>
        {infos.map((title, index) => (
          <AnimatedInfo key={title} title={title} index={index} />
        ))}
      </Body>
    </Wrapper>
  );
}

export default Detail;
