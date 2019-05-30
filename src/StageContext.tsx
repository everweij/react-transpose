import * as React from "react";

type StageContextType = {
  setStage?: (stage: string) => void;
};

const StageContext = React.createContext({} as StageContextType);

export default StageContext;
