import * as React from "react";
import {
  TransitionStateConfigurer,
  TransitionStateProps,
  TransitionDefinition,
  getActionFactory,
  handleEnter,
  handleExit,
  handleReEnter,
  getReEnterStyles,
  InferProps,
  InferReturnType
} from "./transposed";
import transitioned, { SharedElements } from "./transitioned";
import { styler, chain, delay } from "popmotion";
import { getBoxDifference, BoxInfo } from "./util";
import supportedElements from "./supportedElements";

const BOX_KEYS = ["x", "y", "width", "height"];

function createStyleMap(element: Element, boxInfo: BoxInfo, keys: string[]) {
  const styleGetter = styler(element).get;

  return keys.reduce((styles, key) => {
    const isBoxKey = BOX_KEYS.indexOf(key) > -1;
    return {
      ...styles,
      [key]: isBoxKey ? boxInfo[key] : styleGetter(key)
    };
  }, {});
}

function getStyles(elements: SharedElements, keys: string[]) {
  const boxDiff = getBoxDifference(elements.from, elements.to);

  const from = createStyleMap(elements.from, boxDiff.from, keys);
  const to = createStyleMap(elements.to, boxDiff.to, keys);

  return {
    from,
    to
  };
}

type Config<P> = {
  sharedKey: string | ((props: P) => string);
  animationProps: string[];
  transition:
    | TransitionDefinition
    | ((props: TransitionStateProps<P>) => TransitionDefinition);
  whenNotShared?: {
    enter: TransitionStateConfigurer<P>;
    exit: TransitionStateConfigurer<P>;
    animatedFirst?: boolean;
  };
};

function transposedShared<
  C extends React.ComponentType<any> | keyof JSX.IntrinsicElements
>(Component: C) {
  return function WithTransposedShared({
    animationProps,
    sharedKey,
    transition,
    whenNotShared
  }: Config<InferProps<C>>): InferReturnType<C> {
    return transitioned(Component)({
      sharedKey,
      enter: ({ isFirst, path, elements, __styleCache }, props) => {
        const shouldNotAnimateEnter =
          isFirst &&
          (!whenNotShared || (whenNotShared && whenNotShared.animatedFirst));

        if (shouldNotAnimateEnter) {
          // set style-cache in case of later re-entering
          const { width, height } = elements.to!.getBoundingClientRect();
          __styleCache[path.to!] = createStyleMap(
            elements.to!,
            { x: 0, y: 0, width, height },
            animationProps
          );

          return null;
        }

        const isSharedTransition = Boolean(elements.from && elements.to);

        if (isSharedTransition) {
          const { type, delay: delayInMs, ...actionProps } =
            typeof transition === "function"
              ? transition({ direction: "in", path, props })
              : transition;
          const actionFactory = getActionFactory(type);

          const styles = getStyles(elements, animationProps);
          __styleCache[path.to!] = styles.to;

          // set initial exit styles before potential delay
          if (process.env.NODE_ENV === "test") {
            Object.assign(elements.to.style, styles.from);
          } else {
            /* istanbul ignore next */
            styler(elements.to).set(styles.from);
          }

          return chain(
            delay(delayInMs || 0),
            actionFactory({
              ...styles,
              ...actionProps
            } as any)
          );
        }

        if (whenNotShared) {
          return handleEnter(
            whenNotShared.enter,
            whenNotShared.exit,
            path,
            props,
            elements
          );
        }

        return null;
      },
      exit: ({ path, __wasEntering }, props) => {
        if (whenNotShared) {
          return handleExit(
            whenNotShared.enter,
            whenNotShared.exit,
            path,
            props,
            __wasEntering
          );
        }

        return null;
      },
      reEnter: ({ elements, path, __styleCache }, props) => {
        const isSharedTransition = Boolean(elements.from && elements.to);

        if (isSharedTransition) {
          const { type, delay: delayInMs, ...actionProps } =
            typeof transition === "function"
              ? transition({
                  direction: "in",
                  path,
                  props
                })
              : transition;
          const actionFactory = getActionFactory(type);

          const whenNotSharedStyles = whenNotShared
            ? getReEnterStyles(whenNotShared.enter, props, path, elements)
            : { from: {}, to: {} };

          const styles = getStyles(elements, animationProps);

          return actionFactory({
            from: {
              ...whenNotSharedStyles.from,
              ...styles.from
            },
            to: {
              ...whenNotSharedStyles.to,
              ...__styleCache[path.to!]
            },
            ...actionProps
          } as any);
        }

        if (whenNotShared) {
          return handleReEnter(whenNotShared.enter, props, path, elements);
        }

        return null;
      }
    }) as any;
  };
}

// create factory-functions -> transposedShared.div({})
supportedElements.forEach(element => {
  transposedShared[element] = transposedShared(element as any);
});

type TransposeFactories = {
  [TTag in keyof JSX.IntrinsicElements]: (
    config: Config<InferProps<TTag>>
  ) => InferReturnType<TTag>
};

interface TransposedShared extends TransposeFactories {
  <C extends React.ComponentType<any> | keyof JSX.IntrinsicElements>(
    component: C
  ): (config: Config<InferProps<C>>) => InferReturnType<C>;
}

export default transposedShared as TransposedShared;
