import * as React from "react";
import styled from "styled-components";
import { RouteComponentProps } from "react-router-dom";
import { transposed, transposedShared } from "react-transpose";
import Item from "./Item";
import data from "./data";

const Wrapper = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
`;

const Title = transposed(styled.div`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 24px;
  color: #333;
`)({
  enter: {
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  },
  exit: {
    opacity: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }
});

const Items = styled.div`
  & > * {
    margin-bottom: 16px;
  }
`;

const AnimatedItem = transposedShared(Item)({
  sharedKey: props => props.id,
  animationProps: ["y"],
  transition: {
    type: "spring",
    stiffness: 600,
    damping: 40
  },
  whenNotShared: {
    enter: {
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 600,
        damping: 40
      }
    },
    exit: {
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 600,
        damping: 40
      }
    }
  }
});

function List({ history }: RouteComponentProps) {
  return (
    <Wrapper>
      <div style={{ padding: 32 }}>
        <Title>Overview</Title>
        <Items>
          {data.map((item, index) => {
            return (
              <AnimatedItem
                id={item.id}
                key={item.id}
                index={index}
                title={item.title}
                onClick={() => history.push(`/listdetail/${item.id}`)}
                style={{ cursor: "pointer" }}
              />
            );
          })}
        </Items>
      </div>
    </Wrapper>
  );
}

export default List;
