import * as React from "react";
import { Omit } from "utility-types";

import { RegisterConfig, SharedElementsMap, PathTransition } from "./Group";

export type TransitionContextType = {
  isLeaving: boolean;
  isFirst: boolean;
  path: PathTransition;
  register: (config: RegisterConfig) => void;
  sharedElements: SharedElementsMap;
};

export const TransitionContext = React.createContext(
  {} as TransitionContextType
);

export function withContext<P extends { ctx: TransitionContextType }>(
  Component: React.ComponentType<P>
): React.ComponentType<Omit<P, "ctx">> {
  return function WithContext(props: Omit<P, "ctx">) {
    return (
      <TransitionContext.Consumer>
        {ctx => <Component {...props as any} ctx={ctx} />}
      </TransitionContext.Consumer>
    );
  };
}
