import * as React from "react";
import { render, fireEvent, cleanup } from "react-testing-library";
import { SwitchGroup, Stage, useStage } from "../";

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

test("provides access to setStage inside components", async () => {
  function One() {
    const { setStage } = useStage();

    return <div onClick={() => setStage("two")}>one</div>;
  }

  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <SwitchGroup stage={stage} setStage={setStage}>
        <Stage stage="one" component={One} />
        <Stage stage="two" render={() => <div>two</div>} />
      </SwitchGroup>
    );
  }

  const { getByText, queryByText } = render(<Test />);

  fireEvent.click(getByText("one"));

  getByText("two");
  expect(queryByText("one")).toBeFalsy();
});

test("throws when setStage prop was not set", async () => {
  function One() {
    const { setStage } = useStage();

    return <div onClick={() => setStage("two")}>one</div>;
  }

  function Test() {
    const [stage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage stage="one" component={One} />
        <Stage stage="two" render={() => <div>two</div>} />
      </SwitchGroup>
    );
  }

  expect(() => {
    render(<Test />);
  }).toThrow(/setStage is undefined/);
});
