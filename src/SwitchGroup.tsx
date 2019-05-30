import * as React from "react";
import { StageProps } from "./Stage";
import Group from "./Group";
import StageContext from "./StageContext";

function findMatchingChild(
  children:
    | any
    | React.ReactElement<StageProps>
    | Array<React.ReactElement<StageProps>>,
  currentStage: string
) {
  return React.Children.toArray(children).find(
    child => child.props.stage === currentStage
  );
}

type Props = {
  stage: string;
  setStage?: (stage: string) => void;
  children:
    | React.ReactElement<StageProps>
    | Array<React.ReactElement<StageProps>>;
};

function SwitchGroup({ children, stage, setStage }: Props) {
  const [contextPayload] = React.useState({ setStage: setStage || undefined });

  const child = findMatchingChild(children, stage);

  if (!child) {
    throw new Error(`Could not find element with stage '${stage}'`);
  }

  if (!child.props.component && !child.props.render) {
    throw new Error(
      `Please provide a 'component' or 'render' prop for stage '${stage}'`
    );
  }

  let render: React.ReactElement;
  if (child.props.component) {
    render = React.createElement(child.props.component);
  } else {
    render = child.props.render!();
  }

  return (
    <StageContext.Provider value={contextPayload}>
      <Group currentPath={stage}>{render}</Group>
    </StageContext.Provider>
  );
}

export default SwitchGroup;
