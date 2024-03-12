import { DoneInstruction, Instruction } from '../compiler/instructions'
import { Heap } from '../heap'

import { Context } from './context'
import { execute_microcode } from './microcode'

const execute_instructions = (instrs: Instruction[], heapsize: number) => {
  const context = new Context()
  const heap = new Heap(heapsize, context)
  context.E = heap.allocate_env([heap.allocate_frame(0)])
  while (!DoneInstruction.is(instrs[context.PC])) {
    const instr = instrs[context.PC++]
    execute_microcode(context, instr, heap)
    // console.log(instr)
    // context.printOS()
  }
  const returnVal = context.peekOS()
  return returnVal ? heap.get_value(returnVal) : undefined
}

export { execute_instructions }
