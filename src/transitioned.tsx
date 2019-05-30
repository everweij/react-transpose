import * as React from "react";
import { TransitionContextType, withContext } from "./Context";
import { Action, ColdSubscription, styler } from "popmotion";
import { Styler } from "stylefire";
import { composeRefs } from "./util";

import { PathTransition } from "./Group";

export type SharedElements = {
  from: HTMLElement;
  to: HTMLElement;
};

type TransitionProps = {
  path: PathTransition;
  elements: SharedElements;
  isFirst: boolean;
  __styleCache: any;
};

type Config<P> = {
  enter?:
    | ((
        transitionProps: TransitionProps & { isFirst: boolean },
        props: P
      ) => Action | null)
    | Action;
  exit?:
    | ((
        transitionProps: { path: PathTransition; __wasEntering: boolean },
        props: P
      ) => Action | null)
    | Action;
  reEnter?: (
    transitionProps: {
      elements: SharedElements;
      path: PathTransition;
      __styleCache: any;
    },
    props: P
  ) => Action | null;
  sharedKey?: string | ((props: P) => string);
};

type InnerProps<P> = P & {
  innerRef: any;
  ctx: TransitionContextType;
  children?: any;
};

/**
 * Helper functions
 */

function getSharedKey<P>(sharedKey: Config<P>["sharedKey"], props: P) {
  return sharedKey
    ? typeof sharedKey === "function"
      ? sharedKey(props)
      : sharedKey
    : undefined;
}

/**
 * transitioned
 * -------------------
 * Responsibilities:
 * - Communicating with parent Group and pass leaveHandler and optionally
 *   a dom-ref of sharedElement
 * - Act on various state changes (enter, exit, re-enter) by looking at the
 *   configuration given by the user
 */
function transitioned<P extends {}>(
  Component: React.ComponentType<P> | string
) {
  return function withTransitioned(config: Config<P>) {
    const Transitioned = withContext(
      class Transitioned extends React.PureComponent<InnerProps<P>> {
        // a ref to the wrapped components' dom-node
        elementRef = React.createRef<HTMLElement>();

        // handler for cancelling enter animation
        cancelEnterAnimation: ColdSubscription | null = null;

        // handler for cancelling re-enter animation
        cancelReEnterAnimation: ColdSubscription | null = null;

        // handler for cancelling leave animation
        leaveAnimation: ColdSubscription | null = null;

        // popmotion's styler
        elementStyler: Styler;

        // style-cache - for determining which style to re-enter to
        styleCache: any = {};

        componentDidMount() {
          if (!this.elementRef.current) {
            throw new Error(
              "A transitioned component should provide a valid ref"
            );
          }

          this.elementStyler = styler(this.elementRef.current!);
          this.handleRegistration();
          this.handleEnter();
        }

        componentWillUnmount() {
          if (this.cancelEnterAnimation) {
            this.cancelEnterAnimation.stop();
          }
          if (this.cancelReEnterAnimation) {
            this.cancelReEnterAnimation.stop();
          }
          if (this.leaveAnimation) {
            this.leaveAnimation.stop();
          }
        }

        // communicate with Group and give relevant information
        handleRegistration = () => {
          const element = this.elementRef.current!;

          const sharedKey = getSharedKey(config.sharedKey, this.props);

          this.props.ctx.register({
            sharedKey,
            element: sharedKey ? element : undefined,
            leaveHandler: this.handleLeaving
          });
        };

        handleEnter = () => {
          const { isFirst, path, sharedElements } = this.props.ctx;
          const element = this.elementRef.current!;

          // if user didn't define a enter animation, stop
          if (!config.enter) {
            element.style.visibility = null;
            return;
          }

          // get the Popmotion's Action from config
          let action: Action;
          if (typeof config.enter === "function") {
            const sharedKey = getSharedKey(config.sharedKey, this.props);

            // get dom-nodes of shared-element
            const elements = {
              from: sharedKey ? sharedElements[sharedKey][path.from!] : null,
              to: element
            } as SharedElements;

            // Get action | null
            const result = config.enter(
              { isFirst, path, elements, __styleCache: this.styleCache },
              this.props
            );
            if (!result) {
              return;
            }
            action = result;
          } else {
            action = config.enter;
          }

          // start animation
          this.cancelEnterAnimation = action.start({
            complete: () => (this.cancelEnterAnimation = null),
            update: (x: any) => {
              if (process.env.NODE_ENV === "test") {
                Object.assign(element.style, x);
              } else {
                /* istanbul ignore next */
                this.elementStyler.set(x);
              }
            }
          });
        };

        handleLeaving = (path: PathTransition) => {
          // if component is still (re-)entering but must now leave -> __wasEntering = true
          // it means that if user set a delay, that delay must be skipped, so leave should happen immediately
          // tslint:disable-next-line: variable-name
          let __wasEntering = false;

          // cancel enter animation
          if (this.cancelEnterAnimation) {
            this.cancelEnterAnimation.stop();
            this.cancelEnterAnimation = null;
            __wasEntering = true;
          }
          // cancel re-enter animation
          if (this.cancelReEnterAnimation) {
            this.cancelReEnterAnimation.stop();
            this.cancelReEnterAnimation = null;
            __wasEntering = true;
          }

          const element = this.elementRef.current!;

          // define default response in case there is no exit configured
          // or exit config return nothing;
          const sendDefaults = () => {
            element.style.visibility = "hidden";

            return {
              promise: Promise.resolve(),
              cancel: this.handleReEnter
            };
          };

          if (!config.exit) {
            return sendDefaults();
          }

          // get the Popmotion's Action from config
          let action: Action;
          if (typeof config.exit === "function") {
            const result = config.exit(
              {
                path,
                __wasEntering
              },
              this.props
            );
            if (!result) {
              return sendDefaults();
            }
            action = result;
          } else {
            action = config.exit;
          }

          // create promise
          const promise = new Promise<void>(resolve => {
            this.leaveAnimation = action.start({
              complete: resolve,
              update: (value: any) => {
                if (process.env.NODE_ENV === "test") {
                  Object.assign(element.style, value);
                } else {
                  /* istanbul ignore next */
                  this.elementStyler.set(value);
                }
              }
            });
          });

          return {
            promise,
            cancel: this.handleReEnter
          };
        };

        handleReEnter = (path: PathTransition) => {
          const { sharedElements } = this.props.ctx;

          // re-register
          this.handleRegistration();

          if (this.leaveAnimation) {
            this.leaveAnimation.stop();
            this.leaveAnimation = null;
          }

          // set visibility to browser default.
          // (visibility === "hidden" when user also didn't define a exit animation)
          this.elementRef.current!.style.visibility = null;

          if (config.reEnter) {
            const sharedKey = getSharedKey(config.sharedKey, this.props);

            const result = config.reEnter(
              {
                path,
                __styleCache: this.styleCache,
                elements: {
                  from: sharedKey
                    ? sharedElements[sharedKey][path.from!]
                    : null,
                  to: this.elementRef.current!
                } as SharedElements
              },
              this.props
            );

            if (result) {
              this.cancelReEnterAnimation = result.start({
                complete: () => (this.cancelReEnterAnimation = null),
                update: (value: any) => {
                  if (process.env.NODE_ENV === "test") {
                    Object.assign(this.elementRef.current!.style, value);
                  } else {
                    /* istanbul ignore next */
                    this.elementStyler.set(value);
                  }
                }
              });
            }
          }
        };

        render() {
          const { innerRef, ctx, ...props } = this.props;

          return React.createElement(Component, {
            ...(props as any),
            ref: composeRefs(innerRef, this.elementRef)
          });
        }
      }
    );

    return React.forwardRef((props: P, ref: any) => {
      return <Transitioned innerRef={ref} {...props as any} />;
    });
  };
}

export default transitioned;
