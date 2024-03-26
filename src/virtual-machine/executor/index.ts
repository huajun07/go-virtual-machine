import { DoneInstruction, Instruction } from '../compiler/instructions'
import { Heap } from '../heap'

import { Context } from './context'
import { execute_microcode } from './microcode'

const execute_instructions = (instrs: Instruction[], heapsize: number) => {
  const context = new Context()
  const heap = new Heap(heapsize, context)
  context.E = heap.allocate_env([heap.allocate_frame(0)])
  let runtime_count = 0
  while (!DoneInstruction.is(instrs[context.PC])) {
    const instr = instrs[context.PC++]
    context.printOS(heap)
    console.log(instr)
    execute_microcode(context, instr, heap)
    runtime_count += 1
    if(runtime_count > 10 ** 5) throw Error("Time Limit Exceeded!")
  }
  const returnVal = context.peekOS()
  
  return returnVal ? heap.get_value(returnVal) : undefined
}

export { execute_instructions }
