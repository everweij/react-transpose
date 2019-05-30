import * as React from "react";
import { render, fireEvent, cleanup } from "react-testing-library";
import { SwitchGroup, Stage, transposed } from "../";

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

test("should set enter/leave config with an object", async () => {
  const Base = transposed.div({
    enter: {
      opacity: 1
    },
    exit: {
      opacity: 0
    }
  });

  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage
          stage="one"
          render={() => <Base onClick={() => setStage("two")}>one</Base>}
        />
        <Stage stage="two" render={() => <Base>two</Base>} />
      </SwitchGroup>
    );
  }

  const { getByText } = render(<Test />);

  // trigger stage change
  fireEvent.click(getByText("one"));

  // wait for next frame
  await wait(0);

  // confirm that stage changed
  getByText("two");
});

test("should set enter/leave config with an function", async () => {
  const Base = transposed.div({
    enter: () => ({
      opacity: 1
    }),
    exit: {
      opacity: 0
    }
  });

  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage
          stage="one"
          render={() => <Base onClick={() => setStage("two")}>one</Base>}
        />
        <Stage stage="two" render={() => <Base>two</Base>} />
      </SwitchGroup>
    );
  }

  const { getByText } = render(<Test />);

  // trigger stage change
  fireEvent.click(getByText("one"));

  // wait for next frame
  await wait(0);

  // confirm that stage changed
  getByText("two");
});

test("should pass the correct path when entering", async () => {
  let path: any;

  const Base = transposed.div({
    enter: ({ path: enterPath }) => {
      path = enterPath;

      return {
        opacity: 1
      };
    },
    exit: {
      opacity: 0
    }
  });

  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage
          stage="one"
          render={() => <Base onClick={() => setStage("two")}>one</Base>}
        />
        <Stage stage="two" render={() => <Base>two</Base>} />
      </SwitchGroup>
    );
  }

  const { getByText } = render(<Test />);

  // trigger stage change
  fireEvent.click(getByText("one"));

  expect(path).toEqual({ from: "one", to: "two" });
});

test("should pass the correct path when leaving", async () => {
  let path: any;

  const Base = transposed.div({
    enter: {
      opacity: 1
    },
    exit: ({ path: exitPath }) => {
      path = exitPath;

      return {
        opacity: 0
      };
    }
  });

  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage
          stage="one"
          render={() => <Base onClick={() => setStage("two")}>one</Base>}
        />
        <Stage stage="two" render={() => <Base>two</Base>} />
      </SwitchGroup>
    );
  }

  const { getByText } = render(<Test />);

  // trigger stage change
  fireEvent.click(getByText("one"));

  expect(path).toEqual({ from: "one", to: "two" });
});

test("should pass the components props to the config function", async () => {
  let props: any;

  const Base = transposed.div({
    enter: ({ props: enterProps }) => {
      props = enterProps;

      return {
        opacity: 1
      };
    },
    exit: {
      opacity: 0
    }
  });

  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage
          stage="one"
          render={() => (
            <Base onClick={() => setStage("two")} className="test">
              one
            </Base>
          )}
        />
        <Stage stage="two" render={() => <Base className="test">two</Base>} />
      </SwitchGroup>
    );
  }

  const { getByText } = render(<Test />);

  // trigger stage change
  fireEvent.click(getByText("one"));

  expect(props.className).toEqual("test");
});

test("should give the 'direction' to the exit-config", async () => {
  const mockFn = jest.fn(() => ({ opacity: 0 }));
  const Base = transposed.div({
    enter: {
      opacity: 1
    },
    exit: mockFn
  });

  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage
          stage="one"
          render={() => (
            <Base onClick={() => setStage("two")} className="test">
              one
            </Base>
          )}
        />
        <Stage stage="two" render={() => <Base className="test">two</Base>} />
      </SwitchGroup>
    );
  }

  const { getByText } = render(<Test />);

  // trigger stage change
  fireEvent.click(getByText("one"));

  expect((mockFn.mock.calls as any)[0][0].direction).toEqual("in");
  expect((mockFn.mock.calls as any)[1][0].direction).toEqual("out");
});

test("should throw if a component has not exposed a 'ref'", async () => {
  function Box() {
    return <div />;
  }

  const AnimatedBox = transposed(Box)({
    enter: { opacity: 1 },
    exit: { opacity: 0 }
  });

  function Test() {
    const [stage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage stage="one" component={AnimatedBox} />
      </SwitchGroup>
    );
  }

  expect(() => render(<Test />)).toThrow(
    /A transitioned component should provide a valid ref/
  );
});
