import * as React from "react";
import { render, fireEvent, cleanup } from "react-testing-library";
import { SwitchGroup, Stage } from "../";

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

test("renders the correct stage on mount", async () => {
  function Test() {
    const [stage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage stage="one" render={() => <div>one</div>} />
        <Stage stage="two" render={() => <div>two</div>} />
      </SwitchGroup>
    );
  }

  const { getByText, queryByText } = render(<Test />);

  getByText("one");
  expect(queryByText("two")).toBeFalsy();
});

test("renders the correct stage on stage change", async () => {
  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage
          stage="one"
          render={() => <div onClick={() => setStage("two")}>one</div>}
        />
        <Stage stage="two" render={() => <div>two</div>} />
      </SwitchGroup>
    );
  }

  const { getByText, queryByText } = render(<Test />);

  // trigger stage change
  fireEvent.click(getByText("one"));

  // confirm that stage changed, and old stage is unmounted
  getByText("two");
  expect(queryByText("one")).toBeFalsy();
});

test("throws error when stage cannot be found", async () => {
  function Test() {
    const [stage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage stage="two" render={() => <div>two</div>} />
      </SwitchGroup>
    );
  }

  expect(() => render(<Test />)).toThrowError(
    /Could not find element with stage/
  );
});

test("throws error when stage has got no `render` and `component` prop", async () => {
  function Test() {
    const [stage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage stage="one" />
      </SwitchGroup>
    );
  }

  expect(() => render(<Test />)).toThrowError(
    /Please provide a 'component' or 'render' prop/
  );
});

test("renders a component passed to the 'component' props", async () => {
  function Route() {
    return <div>Route</div>;
  }

  function Test() {
    const [stage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage stage="one" component={Route} />
      </SwitchGroup>
    );
  }

  render(<Test />).getByText("Route");
});
