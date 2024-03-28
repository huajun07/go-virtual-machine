import { Instruction } from '../compiler/instructions'

import { Process } from './process'

const execute_instructions = (instrs: Instruction[], heapsize: number) => {
  const process = new Process(instrs, heapsize)
  return process.start()
}

export { execute_instructions }
