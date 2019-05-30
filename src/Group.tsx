import * as React from "react";
import { TransitionContext } from "./Context";

export type AnimationCanceller = (path: PathTransition) => void;
export type AnimationPromise = Promise<void>;
export type PathTransition = { from: string | null; to: string | null };
export type LeaveAnimationHandler = (
  path: PathTransition
) => {
  promise: AnimationPromise;
  cancel: AnimationCanceller;
};
export type SharedElementsMap = Record<string, Record<string, HTMLElement>>;
export type RegisterConfig = {
  sharedKey?: string;
  element?: HTMLElement;
  leaveHandler: LeaveAnimationHandler;
};

type Route = {
  path: string;
  element: React.ReactElement;
  isLeaving: boolean;
};

type LeaveAnimationMap = Record<
  string,
  {
    cancel: AnimationCanceller[];
    leaveHandlers: LeaveAnimationHandler[];
  }
>;

type State = {
  routes: Route[];
  isFirst: boolean;
  previousPath: string | null;
};

type Props = {
  children: React.ReactElement<any>;
  currentPath: string;
};

/**
 * Group Component
 * ---------------
 * Responsibilities:
 * - Keeping track which routes (re-)enter and leave
 * - Delegate which kind of animation should be applied to a given route
 * - Keeping track of DOM references of shared-elements between routes
 *
 * General flow:
 * 1. A route-change takes place
 * 2. If new route is already preset but leaving -> cancel and re-enter
 * 3. Push new route, and set other routes to leaving
 * 4. Call leave-handlers on leaving routes
 * 5. Wait for each leave-handler to resolve
 * 6. Delete route from stack -> route unmounts
 */

class Group extends React.Component<Props, State> {
  // store for the routes' cancel and leave handlers
  leaveAnimations: LeaveAnimationMap = {};
  // store for references to dom-nodes for each route
  sharedElements: SharedElementsMap = {};

  state = {
    routes: [
      {
        element: this.props.children,
        isLeaving: false,
        path: this.props.currentPath
      }
    ],
    // property that describes whether the current route is the first route
    isFirst: true,
    // tracks the previous route for animating purposes
    previousPath: null
  };

  // check whether new route is already preset and currently leaving
  // if so, cancel the leaving process, and re-enter
  cancelLeavingIfExists = (nextPath: string, prevPath: string) => {
    const isNextRouteInState = this.state.routes.find(
      route => route.path === nextPath
    );
    const nextRouteHasLeaveAnimations = nextPath in this.leaveAnimations;

    if (isNextRouteInState && nextRouteHasLeaveAnimations) {
      const cancelCallbacks = this.leaveAnimations[nextPath].cancel;
      if (cancelCallbacks) {
        // cancel leaving animations
        cancelCallbacks.forEach(callback =>
          callback({
            from: prevPath,
            to: nextPath
          })
        );

        // reset cancellers, preventing them from being called again
        this.leaveAnimations[nextPath].cancel = [];
      }
    }
  };

  componentDidUpdate(prevProps: Props) {
    const pathDidChange = prevProps.currentPath !== this.props.currentPath;
    if (pathDidChange) {
      const nextPath = this.props.currentPath;
      const prevPath = prevProps.currentPath;
      const nextElement = this.props.children;
      this.cancelLeavingIfExists(nextPath, prevPath);
      this.handlePushRoute(
        nextPath,
        prevPath,
        nextElement,
        this.handleLeavingRoutes
      );
    }
  }

  // sets new state based on new route
  handlePushRoute = (
    nextPath: string,
    prevPath: string,
    element: React.ReactElement<any>,
    onReady: () => void
  ) => {
    this.setState(({ routes }) => {
      return {
        routes: routes
          // Remove new path if that same path is already in stack
          .filter(route => route.path !== nextPath)
          // set all to leaving
          .map(route => ({
            ...route,
            isLeaving: true
          }))
          // bootstrap newly pushed route
          .concat([
            {
              path: nextPath,
              element,
              isLeaving: false
            }
          ]),
        // from now on, every route change is not first anymore
        isFirst: false,
        // degrade current path -> previous path
        previousPath: prevPath
      };
    }, onReady);
  };

  // determines which routes are eligible for leaving
  handleLeavingRoutes = () => {
    const { routes, previousPath } = this.state;
    const leavingRoutes = routes.filter(route => route.isLeaving);

    const hasLeaveAnimation = (route: Route) => {
      return (
        this.leaveAnimations[route.path] &&
        this.leaveAnimations[route.path].leaveHandlers.length > 0
      );
    };

    // in case a route does not have any animations
    const notAnimatedLeavingRoutes = leavingRoutes.filter(
      r => !hasLeaveAnimation(r)
    );
    notAnimatedLeavingRoutes.forEach(({ path }) => {
      delete this.leaveAnimations[path];
      this.handleDeleteRoute(path);
      this.handleCleanupSharedElements(path);
    });

    // in case a route got animations
    const animatedLeavingRoutes = leavingRoutes.filter(hasLeaveAnimation);
    animatedLeavingRoutes.forEach(({ path }) => {
      const leaveAnimationData = this.leaveAnimations[path];

      // keep list of running animation so we can react when they resolve
      const promises: AnimationPromise[] = [];

      // for each leave-animation, add promise to list, together with cancel-handlers
      leaveAnimationData.leaveHandlers.forEach(leaveHandler => {
        const { promise, cancel } = leaveHandler({
          from: previousPath,
          to: this.props.currentPath
        });
        promises.push(promise);
        leaveAnimationData.cancel.push(cancel);
      });

      // reset leaveHandlers, preventing them from being called again
      leaveAnimationData.leaveHandlers = [];

      // when all leave-animation are done, remove route from state
      Promise.all(promises).then(() => {
        // we should not remove the route if that same route is now the current route
        // i.e.: back-button -> forward-button
        /* istanbul ignore next */
        if (path === this.props.currentPath) {
          return;
        }

        // clean up
        delete this.leaveAnimations[path];
        this.handleDeleteRoute(path);
        this.handleCleanupSharedElements(path);
      });
    });
  };

  handleDeleteRoute = (path: string) => {
    this.setState(({ routes }) => ({
      routes: routes.filter(route => route.path !== path)
    }));
  };

  handleCleanupSharedElements = (path: string) => {
    Object.keys(this.sharedElements).forEach(sharedKey => {
      if (path in this.sharedElements[sharedKey]) {
        delete this.sharedElements[sharedKey][path];
        if (Object.keys(this.sharedElements[sharedKey]).length === 0) {
          delete this.sharedElements[sharedKey];
        }
      }
    });
  };

  // gets called by children of route to set refs to shared elements and
  // register leaveHandlers
  handleRegister = (path: string) => ({
    sharedKey,
    element,
    leaveHandler
  }: RegisterConfig) => {
    if (sharedKey) {
      const alreadyHasSharedKey = sharedKey in this.sharedElements;
      if (!alreadyHasSharedKey) {
        this.sharedElements[sharedKey] = {};
      }
      this.sharedElements[sharedKey][path] = element!;
    }

    const alreadyHasLeaveAnimation = path in this.leaveAnimations;
    if (!alreadyHasLeaveAnimation) {
      this.leaveAnimations[path] = {
        cancel: [],
        leaveHandlers: []
      };
    }

    this.leaveAnimations[path].leaveHandlers.push(leaveHandler);
  };

  render() {
    const { routes, isFirst, previousPath } = this.state;
    const { currentPath } = this.props;

    return routes.map(route => (
      <TransitionContext.Provider
        key={route.path}
        value={{
          register: this.handleRegister(route.path),
          isFirst,
          isLeaving: route.isLeaving,
          sharedElements: this.sharedElements,
          path: {
            from: previousPath,
            to: currentPath
          }
        }}
      >
        {route.element}
      </TransitionContext.Provider>
    ));
  }
}

export default Group;
