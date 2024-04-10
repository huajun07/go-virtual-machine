import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'

import { ContextInfo } from '../../virtual-machine/executor/debugger'

export interface ExecutionState {
  currentStep: number
  setStep: (step: number) => void
  data: ContextInfo[][]
  setVisualData: (data: ContextInfo[][]) => void
}

const defaultValues = {
  currentStep: 0,
  data: [],
}

/**
 * Factory function for execution store
 * with option to seed inital values (For automated tests)
 * @param initalValues Initial Values (optional)
 * @returns
 */
export const createExecutionStore = (initialState: Partial<ExecutionState>) => {
  return createWithEqualityFn<ExecutionState>(
    (set) => ({
      ...defaultValues,
      /**
       * Change the current execution step to given value.
       * Note this operation updates all related variables like table data
       * @param step
       */
      setStep: (step: number) => {
        set({ currentStep: step })
      },
      /**
       * Resets the execution from the start with new instructions.
       * @param instructions New instructions
       */
      setVisualData: (data: ContextInfo[][]) => {
        set({
          currentStep: 0,
          data,
        })
      },
      ...initialState,
    }),
    shallow,
  )
}

export const useExecutionStore = createExecutionStore({})
