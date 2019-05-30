import * as React from "react";
import StageContext from "./StageContext";

function useStage() {
  const { setStage } = React.useContext(StageContext);

  if (!setStage) {
    throw new Error(
      "setStage is undefined. Please set the 'setStage' prop on <SwitchGroup />"
    );
  }

  return {
    setStage
  };
}

export default useStage;
