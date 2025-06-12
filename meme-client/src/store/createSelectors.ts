import { StoreApi, UseBoundStore } from "zustand";

/**
 * Creates a selectors object with typed methods for accessing store state
 * This helps prevent unnecessary re-renders by allowing components to
 * subscribe only to the specific parts of state they need
 */
export function createSelectors<T extends object, A extends object = object>(
  store: UseBoundStore<StoreApi<T & A>>
) {
  // Note: Type definitions for state and action keys have been removed as they were unused

  // Create a type for the use object that includes all state and action selectors
  type UseSelectors = {
    [K in keyof T]: () => T[K];
  } & {
    [K in keyof A]: () => A[K];
  } & {
    state: <K extends Array<keyof (T & A)>>(...keys: K) => { [P in K[number]]: (T & A)[P] };
    actions: <K extends Array<keyof (T & A)>>(...keys: K) => { [P in K[number]]: (T & A)[P] };
  };

  // Create an object with a getter for each state property
  const stateSelectors = Object.keys(store.getState()).reduce((selectors, key) => {
    const k = key as keyof (T & A);
    
    // Skip functions
    if (typeof store.getState()[k] === "function") {
      return selectors;
    }

    // Add a selector for this state property with proper typing
    selectors[k as string] = () => store(state => state[k]);
    
    return selectors;
  }, {} as Record<string, () => unknown>);

  // Create an object with a getter for each action
  const actionSelectors = Object.keys(store.getState()).reduce((selectors, key) => {
    const k = key as keyof (T & A);
    
    // Skip non-functions
    if (typeof store.getState()[k] !== "function") {
      return selectors;
    }

    // Add a selector for this action with proper typing
    selectors[k as string] = () => store(state => state[k]);
    
    return selectors;
  }, {} as Record<string, () => unknown>);
  // Note: Type guards for state and action keys have been removed as they were unused
  // If you need to validate keys at runtime, you can implement similar functions

  // Create the multi-selector functions with explicit typing
  const stateSelector = <K extends Array<keyof (T & A)>>(...keys: K) => 
    store(state => {
      // Initialize an empty object
      const result = {} as Record<K[number], unknown>;
      // Populate it with the selected state values
      keys.forEach(key => {
        result[key] = state[key];
      });
      // Return with the correct type assertion
      return result as { [P in K[number]]: (T & A)[P] };
    });

  const actionsSelector = <K extends Array<keyof (T & A)>>(...keys: K) => 
    store(state => {
      // Initialize an empty object
      const result = {} as Record<K[number], unknown>;
      // Populate it with the selected action values
      keys.forEach(key => {
        result[key] = state[key];
      });
      // Return with the correct type assertion
      return result as { [P in K[number]]: (T & A)[P] };
    });

  // Return an enhanced store with selectors
  return Object.assign(store, {
    use: {
      ...stateSelectors,
      ...actionSelectors,
      state: stateSelector,
      actions: actionsSelector,
    } as UseSelectors,
  });
}