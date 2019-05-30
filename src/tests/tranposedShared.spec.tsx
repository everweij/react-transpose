import * as React from "react";
import { render, fireEvent, cleanup } from "react-testing-library";
import { SwitchGroup, Stage, transposedShared, transposed } from "../";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

beforeEach(() => {
  jest.spyOn(console, "error");
  // @ts-ignore
  console.error.mockImplementation(() => null);
});

afterEach(() => {
  cleanup();
  // @ts-ignore
  console.error.mockRestore();
});

test("should animate backgroundColor of box between stages", async () => {
  const Box = transposedShared.div({
    animationProps: ["backgroundColor"],
    sharedKey: "test",
    transition: {
      type: "spring",
      delay: 10
    }
  });

  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <>
        <button onClick={() => setStage(stage === "one" ? "two" : "one")}>
          toggle_stage
        </button>
        <SwitchGroup stage={stage}>
          <Stage
            stage="one"
            render={() => (
              <div>
                one
                <Box
                  style={{ width: 10, height: 10, backgroundColor: "red" }}
                />
              </div>
            )}
          />
          <Stage
            stage="two"
            render={() => (
              <div>
                two
                <Box
                  style={{ width: 10, height: 10, backgroundColor: "blue" }}
                />
              </div>
            )}
          />
        </SwitchGroup>
      </>
    );
  }

  const { getByText } = render(<Test />);

  // trigger stage change
  fireEvent.click(getByText("toggle_stage"));

  // wait for next frame
  await wait(0);

  // confirm that stage changed
  const two = getByText("two");
  expect(two.querySelector("div")!.style.backgroundColor).toEqual("red");

  // wait for animation to finish
  await wait(50);

  expect(two.querySelector("div")!.style.backgroundColor).toEqual("blue");
});

test("should animate backgroundColor when re-entering to previous stage", async () => {
  const Box = transposedShared.div({
    animationProps: ["backgroundColor"],
    sharedKey: "test",
    transition: {
      type: "spring",
      delay: 10
    }
  });

  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <>
        <button onClick={() => setStage(stage === "one" ? "two" : "one")}>
          toggle_stage
        </button>
        <SwitchGroup stage={stage}>
          <Stage
            stage="one"
            render={() => (
              <div>
                one
                <Box
                  style={{ width: 10, height: 10, backgroundColor: "red" }}
                />
              </div>
            )}
          />
          <Stage
            stage="two"
            render={() => (
              <div>
                two
                <Box
                  style={{ width: 10, height: 10, backgroundColor: "blue" }}
                />
              </div>
            )}
          />
        </SwitchGroup>
      </>
    );
  }

  const { getByText } = render(<Test />);

  // trigger stage change
  fireEvent.click(getByText("toggle_stage"));

  // half-way the transition...
  await wait(10);

  // back to 'one'
  fireEvent.click(getByText("toggle_stage"));

  await wait(0);
  // from 'blue'
  expect(getByText("one").querySelector("div")!.style.backgroundColor).toEqual(
    "blue"
  );

  // wait for transition to complete
  await wait(30);
  // to "red"
  expect(getByText("one").querySelector("div")!.style.backgroundColor).toEqual(
    "red"
  );
});

test("should animate a component that is shared, and animate the ones that are not shared differently", async () => {
  const Box = React.forwardRef(function Box(
    props: { id: string; bg: string; stage: string },
    ref: any
  ) {
    return (
      <div
        ref={ref}
        style={{ width: 10, height: 10, backgroundColor: props.bg }}
      >
        Box {props.id} on stage {props.stage}
      </div>
    );
  });

  const AnimatedBox = transposedShared(Box)({
    animationProps: ["backgroundColor"],
    sharedKey: props => props.id,
    transition: {
      type: "spring",
      delay: 10
    },
    whenNotShared: {
      enter: { opacity: 1 },
      exit: { opacity: 0 }
    }
  });

  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <>
        <button onClick={() => setStage(stage === "one" ? "two" : "one")}>
          toggle_stage
        </button>
        <SwitchGroup stage={stage}>
          <Stage
            stage="one"
            render={() => (
              <div>
                <AnimatedBox id="1" bg="red" stage="one" />
                <AnimatedBox id="2" bg="green" stage="one" />
                <AnimatedBox id="3" bg="blue" stage="one" />
                <AnimatedBox id="4" bg="yellow" stage="one" />
              </div>
            )}
          />
          <Stage
            stage="two"
            render={() => (
              <div>
                <AnimatedBox id="3" bg="orange" stage="two" />
              </div>
            )}
          />
        </SwitchGroup>
      </>
    );
  }

  const { getByText } = render(<Test />);

  // trigger stage change
  fireEvent.click(getByText("toggle_stage"));

  // wait for next frame
  await wait(0);

  // confirm that stage changed
  const boxTwo = getByText("Box 3 on stage two");
  expect(boxTwo.style.backgroundColor).toEqual("blue");

  // other boxes on "one" should animate leaving
  const boxOne = getByText("Box 1 on stage one");
  expect(boxOne.style.opacity).toEqual("0");

  // wait for animation to finish
  await wait(50);

  expect(boxTwo.style.backgroundColor).toEqual("orange");
});

test("should animate a component that is shared, and animate the ones that are not shared differently - with re-enter", async () => {
  const Box = React.forwardRef(function Box(
    props: { id: string; bg: string; stage: string },
    ref: any
  ) {
    return (
      <div
        ref={ref}
        style={{ width: 10, height: 10, backgroundColor: props.bg }}
      >
        Box {props.id} on stage {props.stage}
      </div>
    );
  });

  const AnimatedBox = transposedShared(Box)({
    animationProps: ["backgroundColor"],
    sharedKey: props => props.id,
    transition: {
      type: "spring",
      delay: 10
    },
    whenNotShared: {
      enter: { opacity: 1 },
      exit: { opacity: 0 }
    }
  });

  const SlowElement = transposed("div")({
    enter: {
      color: "red",
      transition: {
        type: "spring",
        delay: 200
      }
    },
    exit: {
      color: "blue",
      transition: {
        type: "spring",
        delay: 200
      }
    }
  });

  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <>
        <button onClick={() => setStage(stage === "one" ? "two" : "one")}>
          toggle_stage
        </button>
        <SwitchGroup stage={stage}>
          <Stage
            stage="one"
            render={() => (
              <div>
                <SlowElement />
                <AnimatedBox id="1" bg="red" stage="one" />
                <AnimatedBox id="2" bg="green" stage="one" />
                <AnimatedBox id="3" bg="blue" stage="one" />
                <AnimatedBox id="4" bg="yellow" stage="one" />
              </div>
            )}
          />
          <Stage
            stage="two"
            render={() => (
              <div>
                <SlowElement />
                <AnimatedBox id="3" bg="orange" stage="two" />
              </div>
            )}
          />
        </SwitchGroup>
      </>
    );
  }

  const { getByText } = render(<Test />);

  // goto "two"
  fireEvent.click(getByText("toggle_stage"));

  // half-way => go back to "one"
  await wait(20);
  fireEvent.click(getByText("toggle_stage"));

  await wait(10);

  // other boxes on "one" should animate leaving
  const boxOne = getByText("Box 1 on stage one");
  expect(boxOne.style.opacity).toEqual("1");
});
