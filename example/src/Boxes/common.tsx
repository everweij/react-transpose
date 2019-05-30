import styled from "styled-components";
import { transposed, transposedShared } from "react-transpose";

const paths = ["a", "b", "c"];

export const Title = transposed(styled.div`
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 4rem;
`)({
  enter: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
      delay: 0
    }
  },
  exit: ({ path, direction }) => {
    const indexFrom = paths.indexOf(path.from!);
    const indexTo = paths.indexOf(path.to!);

    const factor = direction === "in" ? 1 : -1;

    return {
      opacity: 0,
      x: indexFrom < indexTo ? 200 * factor : -200 * factor,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
        delay: 0
      }
    };
  },
  animatedFirst: false
});

export const Wrapper = styled.div`
  position: absolute;
  top: 32px;
  left: 400px;
  padding: 2rem;
`;

export const AnimatedBox = transposedShared.div({
  sharedKey: "box",
  transition: {
    type: "spring",
    damping: 25,
    stiffness: 200,
    delay: 0
  },
  animationProps: ["x", "y", "width", "height", "backgroundColor"]
});
