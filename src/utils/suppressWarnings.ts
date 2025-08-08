// Utility to suppress specific warnings in development
export const suppressWarnings = () => {
  if (__DEV__) {
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = (...args) => {
      // Suppress styled-components dynamic creation warnings
      // TODO Frontend issue - figure out if this is leading to performance issues
      if (
        typeof args[0] === "string" &&
        (args[0].includes("has been created dynamically") ||
          args[0].includes("styled-components"))
      ) {
        return;
      }
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      // Suppress React Hooks errors
      if (
        typeof args[0] === "string" &&
        args[0].includes("Do not call Hooks inside useEffect")
      ) {
        return;
      }
      originalError.apply(console, args);
    };
  }
};
