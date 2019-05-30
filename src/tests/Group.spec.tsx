import * as React from "react";
import { render, fireEvent, cleanup } from "react-testing-library";
import { SwitchGroup, Stage, transposed } from "../";

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

afterEach(cleanup);

const StageOne = transposed.div({
  enter: { opacity: 1 },
  exit: { opacity: 0 }
});

const StageTwo = transposed.div({
  enter: { opacity: 1 },
  exit: { opacity: 0 }
});

/**
 * NOTE!
 * For time sake, animations in test environment are hard-coded to 10ms
 */

test("waits for a stage to unmount untill animation is complete", async () => {
  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <SwitchGroup stage={stage}>
        <Stage
          stage="one"
          render={() => (
            <StageOne onClick={() => setStage("two")}>one</StageOne>
          )}
        />
        <Stage stage="two" render={() => <div>two</div>} />
      </SwitchGroup>
    );
  }

  const { getByText, queryByText } = render(<Test />);

  // trigger stage change
  fireEvent.click(getByText("one"));

  // confirm that stage changed
  getByText("two");

  // wait for the leave-animation of 'one' to finish
  await wait(15);

  // confirm that stage 'one' old stage is unmounted
  expect(queryByText("one")).toBeFalsy();
});

test("Re-enters when stage is activated while in the middle of leaving", async () => {
  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <>
        <button onClick={() => setStage(stage === "one" ? "two" : "one")}>
          toggle_stage
        </button>
        <SwitchGroup stage={stage}>
          <Stage stage="one" render={() => <StageOne>one</StageOne>} />
          <Stage stage="two" render={() => <div>two</div>} />
        </SwitchGroup>
      </>
    );
  }

  const { getByText, queryByText } = render(<Test />);

  // trigger stage change
  fireEvent.click(getByText("toggle_stage"));
  // wait for next frame...
  await wait(0);

  // confirm that stage changed
  getByText("two");

  // confirm that exit animation of stage "one" started
  expect(getByText("one").style.opacity).toEqual("0");

  // half-way, go back to 'one'
  await wait(5);
  fireEvent.click(getByText("toggle_stage"));

  // wait a bit...
  await wait(10);

  // should be back on "one"
  getByText("one");
  expect(getByText("one").style.opacity).toEqual("1");

  // confirm that stage "two" is unmounted
  expect(queryByText("two")).toBeFalsy();
});

test("Leaves when stage is de-activated while in the middle of entering", async () => {
  function Test() {
    const [stage, setStage] = React.useState("one");

    return (
      <>
        <button onClick={() => setStage(stage === "one" ? "two" : "one")}>
          toggle_stage
        </button>
        <SwitchGroup stage={stage}>
          <Stage stage="one" render={() => <StageOne>one</StageOne>} />
          <Stage stage="two" render={() => <StageTwo>two</StageTwo>} />
        </SwitchGroup>
      </>
    );
  }

  const { getByText, queryByText } = render(<Test />);

  // goto "two"
  fireEvent.click(getByText("toggle_stage"));

  // half-way, go back to 'one'
  await wait(5);
  fireEvent.click(getByText("toggle_stage"));

  // wait for next frame
  await wait(0);

  // stage "two" was entering, but should exit now
  getByText("two");
  expect(getByText("two").style.opacity).toEqual("0");

  // wait for leave animation to  finish
  await wait(15);
  // confirm that stage "two" is unmounted
  expect(queryByText("two")).toBeFalsy();
});
