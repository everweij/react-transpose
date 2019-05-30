import * as React from "react";
import transitioned, { SharedElements } from "./transitioned";
import { Omit } from "utility-types";
import { PathTransition } from "./Group";
import { omit } from "./util";
import supportedElements from "./supportedElements";

import {
  TweenProps,
  PhysicsProps,
  SpringProps,
  DecayProps,
  KeyframesProps,
  spring,
  physics,
  tween,
  decay,
  keyframes,
  chain,
  delay,
  styler,
  action
} from "popmotion";

const testFactory = (props: { from: any; to: any }) =>
  action(({ update, complete }) => {
    update(props.to);

    const id = setTimeout(() => {
      complete();
    }, 10);

    return {
      stop: () => clearTimeout(id)
    };
  });

export const actionFactories = {
  spring,
  tween,
  keyframes,
  decay,
  physics
};

type Easingtype =
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "circIn"
  | "circOut"
  | "circInOut"
  | "backIn"
  | "backOut"
  | "backInOut"
  | "anticipate";

type NoEase = {
  ease?: undefined;
};
type CubicBezierArgs = [number, number, number, number];
type TransitionDefinitionCommonProps = {
  delay?: number;
  min?: number;
  max?: number;
  round?: boolean;
};
type DecayDefinition = {
  type: "decay";
} & TransitionDefinitionCommonProps &
  Omit<DecayProps, "from" | "to"> &
  NoEase;
type KeyframesDefinition = {
  type: "keyframes";
} & TransitionDefinitionCommonProps &
  Omit<KeyframesProps, "from" | "to">;
type PhysicsDefinition = {
  type: "physics";
} & TransitionDefinitionCommonProps &
  Omit<PhysicsProps, "from" | "to"> &
  NoEase;
type SpringDefinition = {
  type: "spring";
} & TransitionDefinitionCommonProps &
  Omit<SpringProps, "from" | "to"> &
  NoEase;
type TweenDefinition = {
  type: "tween";
} & TransitionDefinitionCommonProps &
  Omit<TweenProps, "ease" | "from" | "to"> & {
    ease: TweenProps["ease"] | Easingtype | CubicBezierArgs;
  };
// type TestDefinition = {
//   type: "__test";
// } & TransitionDefinitionCommonProps

export type TransitionDefinition =
  | TweenDefinition
  | PhysicsDefinition
  | SpringDefinition
  | DecayDefinition
  | KeyframesDefinition;

export type TransitionStateConfig = {
  transition?: TransitionDefinition;
} & { [key: string]: any };

export type TransitionStateProps<P> = {
  props: P;
  path: PathTransition;
  direction: "in" | "out";
};

export type TransitionStateConfigurer<P, D = {}> =
  | TransitionStateConfig
  | ((props: TransitionStateProps<P> & D) => TransitionStateConfig);

type Config<P> = {
  enter: TransitionStateConfigurer<P>;
  exit: TransitionStateConfigurer<P>;
  animatedFirst?: boolean;
};

function getStyleMapOfElement(element: Element, config: TransitionStateConfig) {
  const get = styler(element).get;

  return Object.keys(config)
    .filter(key => key !== "transition")
    .reduce((styles, key) => ({ ...styles, [key]: get(key) }), {});
}

// gets popmotion animation config based on:
// - state: i.e. enter / exit
// - component props
// - path (from / to)
// - direction ("in" means: exit config is used to determine initial styles, "out" the opposite)
export function getConfig<P>(
  state: TransitionStateConfigurer<P, { direction: "in" | "out" }>,
  path: PathTransition,
  props: P,
  direction: "in" | "out"
) {
  const result =
    typeof state === "function" ? state({ path, props, direction }) : state;

  return {
    ...result,
    transition: result.transition || {
      type: "tween",
      delay: 0
    }
  };
}

export function setInitialStyles(
  element: Element,
  config: TransitionStateConfig
) {
  // create styles object from config
  const styles = Object.keys(config)
    .filter(key => key !== "transition")
    .reduce((styles, key) => ({ ...styles, [key]: config[key] }), {});

  // apply styles to element
  styler(element).set(styles);
}

// util function to get actionFactory with fallback for test env
export function getActionFactory(type: keyof typeof actionFactories) {
  if (process.env.NODE_ENV === "test") {
    return testFactory;
  }

  /* istanbul ignore next */
  return actionFactories[type];
}

export function handleEnter<P>(
  enter: TransitionStateConfigurer<P>,
  exit: TransitionStateConfigurer<P>,
  path: PathTransition,
  props: P,
  elements: SharedElements
) {
  const enterConfig = getConfig(enter, path, props, "in");
  const { transition, ...enterStyleProps } = enterConfig;

  // get factory (i.e. spring / tween / etc..) based on transition config
  const actionFactory = getActionFactory(transition.type);

  const exitConfig = getConfig(exit, path, props, "in");

  // set initial exit styles before potential delay
  setInitialStyles(elements.to, exitConfig as TransitionStateConfig);

  return chain(
    delay(transition.delay || 0),
    actionFactory({
      from: omit(exitConfig, ["transition"]),
      to: enterStyleProps,
      ...omit(transition, ["delay", "type"]) // i.e. animaition-type specific props
    } as any)
  );
}

export function handleExit<P>(
  enter: TransitionStateConfigurer<P>,
  exit: TransitionStateConfigurer<P>,
  path: PathTransition,
  props: P,
  // tslint:disable-next-line: variable-name
  __wasEntering: boolean
) {
  const enterConfig = getConfig(enter, path, props, "out");
  const exitConfig = getConfig(exit, path, props, "out");
  const { transition, ...exitStyleProps } = exitConfig;
  const actionFactory = getActionFactory(transition.type);

  return chain(
    // skip delay when component was (re-)entering
    delay(__wasEntering ? 0 : exitConfig.transition.delay || 0),
    actionFactory({
      from: omit(enterConfig, ["transition"]),
      to: exitStyleProps,
      ...omit(transition, ["delay", "type"])
    } as any)
  );
}

export function getReEnterStyles<P>(
  enter: TransitionStateConfigurer<P>,
  props: P,
  path: PathTransition,
  elements: SharedElements
) {
  const { transition, ...enterStyleProps } = getConfig(
    enter,
    path,
    props,
    "out"
  );

  const from = getStyleMapOfElement(elements.to, enterStyleProps);

  return {
    from,
    to: enterStyleProps
  };
}

export function handleReEnter<P>(
  enter: TransitionStateConfigurer<P>,
  props: P,
  path: PathTransition,
  elements: SharedElements
) {
  const { transition } = getConfig(enter, path, props, "out");
  const { type, delay: delayInMs, ...actionProps } = transition;
  const actionFactory = getActionFactory(type);

  const styles = getReEnterStyles(enter, props, path, elements);

  return actionFactory({
    ...styles,
    ...actionProps
  } as any);
}

export type InferProps<
  C extends React.ComponentType<any> | keyof JSX.IntrinsicElements
> = C extends React.ComponentType<infer P> ? P : React.HTMLAttributes<C>;
export type InferReturnType<
  C extends React.ComponentType<any> | keyof JSX.IntrinsicElements
> = React.ForwardRefExoticComponent<InferProps<C> & React.RefAttributes<{}>>;

function transposed<
  C extends React.ComponentType<any> | keyof JSX.IntrinsicElements
>(Component: C) {
  return function WithTransposed({
    enter,
    exit,
    animatedFirst = false
  }: Config<InferProps<C>>): InferReturnType<C> {
    return transitioned(Component)({
      enter: ({ isFirst, path, elements }, props) => {
        if (isFirst && !animatedFirst) {
          const enterConfig = getConfig(enter, path, props, "in");
          setInitialStyles(elements.to, enterConfig as TransitionStateConfig);
          return null;
        }

        return handleEnter(enter, exit, path, props, elements);
      },
      exit: ({ path, __wasEntering }, props) => {
        return handleExit(enter, exit, path, props, __wasEntering);
      },
      reEnter: ({ elements, path }, props) => {
        return handleReEnter(enter, props, path, elements);
      }
    }) as any;
  };
}

// create factory-functions -> transposed.div({})
supportedElements.forEach(element => {
  transposed[element] = transposed(element as any);
});

type TransposeFactories = {
  [TTag in keyof JSX.IntrinsicElements]: (
    config: Config<InferProps<TTag>>
  ) => InferReturnType<TTag>
};

interface Transposed extends TransposeFactories {
  <C extends React.ComponentType<any> | keyof JSX.IntrinsicElements>(
    component: C
  ): (config: Config<InferProps<C>>) => InferReturnType<C>;
}

export default transposed as Transposed;
