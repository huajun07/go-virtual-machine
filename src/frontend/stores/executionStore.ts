import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'

import { ContextInfo, StateInfo } from '../../virtual-machine/executor/debugger'

export interface ExecutionState {
  currentStep: number
  setStep: (step: number) => void
  data: StateInfo[]
  setVisualData: (data: StateInfo[]) => void
  cur_data: ContextInfo[]
  output: string
  setOutput: (output: string) => void
}

const defaultValues = {
  currentStep: 0,
  data: [],
  cur_data: [],
  output: '',
}

/**
 * Factory function for execution store
 * with option to seed inital values (For automated tests)
 * @param initalValues Initial Values (optional)
 * @returns
 */
export const createExecutionStore = (initialState: Partial<ExecutionState>) => {
  return createWithEqualityFn<ExecutionState>(
    (set, get) => ({
      ...defaultValues,
      /**
       * Change the current execution step to given value.
       * Note this operation updates all related variables like table data
       * @param step
       */
      setStep: (step: number) => {
        if (step < get().data.length) {
          set({
            currentStep: step,
            cur_data: get().data[step].contexts,
            output: get().data[step].output,
          })
        }
      },
      /**
       * Resets the execution from the start with new instructions.
       * @param instructions New instructions
       */
      setVisualData: (data: StateInfo[]) => {
        set({
          currentStep: 0,
          data,
        })
      },
      setOutput: (output: string) => {
        set({ output })
      },
      ...initialState,
    }),
    shallow,
  )
}

export const useExecutionStore = createExecutionStore({})
