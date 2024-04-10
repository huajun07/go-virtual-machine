import { Instruction } from '../compiler/instructions'

import { Process } from './process'

const execute_instructions = (
  instrs: Instruction[],
  heapsize: number,
  visualisation = false,
) => {
  const process = new Process(instrs, heapsize, visualisation)
  return process.start()
}

export { execute_instructions }
