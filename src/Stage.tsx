import * as React from "react";

export type StageProps = {
  stage: string;
  render?: () => React.ReactElement;
  component?: React.ComponentType<any>;
};

// tslint:disable-next-line: no-empty
function Stage({  }: StageProps): any {}

export default Stage as React.ComponentType<StageProps>;
