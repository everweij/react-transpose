export type BoxInfo = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const getBoxDifference = (
  from: HTMLElement,
  to: HTMLElement
): { from: BoxInfo; to: BoxInfo } => {
  const boxFrom = from.getBoundingClientRect();
  const boxTo = to.getBoundingClientRect();

  return {
    from: {
      x: boxFrom.left - boxTo.left,
      y: boxFrom.top - boxTo.top,
      width: boxFrom.width,
      height: boxFrom.height
    },
    to: {
      x: 0,
      y: 0,
      width: boxTo.width,
      height: boxTo.height
    }
  };
};

export function composeRefs(...args: any[]) {
  return (ref: any) => {
    args.forEach(arg => {
      if (!arg) {
        return;
      }

      if (typeof arg === "function") {
        arg(ref);
        return;
      }

      arg.current = ref;
    });
  };
}

export function omit<P extends {}>(obj: P, keys: Array<keyof P>) {
  return Object.keys(obj).reduce(
    (result, key: any) => {
      if (keys.indexOf(key) === -1) {
        result[key] = obj[key];
      }

      return result;
    },
    {} as any
  );
}
