import { DoneInstruction, Instruction } from '../compiler/instructions'
import { Heap } from '../heap'
import { ContextNode } from '../heap/types/context'
import { EnvironmentNode, FrameNode } from '../heap/types/environment'
import { PrimitiveNode } from '../heap/types/primitives'

export class Process {
  instructions: Instruction[]
  heap: Heap
  context: ContextNode
  constructor(instrs: Instruction[], heapsize: number) {
    this.instructions = instrs
    this.heap = new Heap(heapsize)
    this.context = new ContextNode(this.heap, this.heap.contexts.get_idx(0))
    const base_frame = FrameNode.create(0, this.heap)
    const base_env = EnvironmentNode.create([base_frame.addr], false, this.heap)
    this.context.set_E(base_env.addr)
  }

  start() {
    let runtime_count = 0
    while (!DoneInstruction.is(this.instructions[this.context.PC()])) {
      const instr = this.instructions[this.context.incr_PC()]
      // console.log('Instr:', instr)
      this.execute_microcode(instr)
      // this.context.printOS()
      // this.context.printRTS()
      runtime_count += 1
      if (runtime_count > 10 ** 5) throw Error('Time Limit Exceeded!')
    }
    const returnVal = this.context.peekOS()

    return returnVal
      ? (this.heap.get_value(returnVal) as PrimitiveNode).get_value()
      : undefined
  }

  execute_microcode(instr: Instruction) {
    instr.execute(this)
  }
}
