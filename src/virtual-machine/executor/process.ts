import { DoneInstruction, Instruction } from '../compiler/instructions'
import { Heap } from '../heap'
import { ContextNode } from '../heap/types/context'
import { EnvironmentNode, FrameNode } from '../heap/types/environment'
import { QueueNode } from '../heap/types/structures'

export class Process {
  instructions: Instruction[]
  heap: Heap
  context: ContextNode
  contexts: QueueNode
  stdout: string
  constructor(instrs: Instruction[], heapsize: number) {
    this.instructions = instrs
    this.heap = new Heap(heapsize)
    this.contexts = this.heap.contexts
    this.context = new ContextNode(this.heap, this.contexts.peek())
    this.stdout = ''
    const base_frame = FrameNode.create(0, this.heap)
    const base_env = EnvironmentNode.create([base_frame.addr], false, this.heap)
    this.context.set_E(base_env.addr)
  }

  start() {
    const time_quantum = 30
    let runtime_count = 0
    while (this.contexts.sz()) {
      this.context = new ContextNode(this.heap, this.contexts.peek())
      let cur_time = 0
      while (!DoneInstruction.is(this.instructions[this.context.PC()])) {
        if (cur_time >= time_quantum) {
          // Context Switch
          this.contexts.push(this.context.addr)
          break
        }
        const instr = this.instructions[this.context.incr_PC()]
        // console.log('Instr:', instr, this.context.PC() - 1)
        instr.execute(this)
        // this.context.printOS()
        // this.context.printRTS()
        // console.log(this.heap.mem_left)
        runtime_count += 1
        cur_time += 1
      }
      this.contexts.pop()
      // console.log('%c SWITCH!', 'background: #F7FF00; color: #FF0000')
      if (runtime_count > 10 ** 5) throw Error('Time Limit Exceeded!')
      // console.log('PC', this.contexts.get_vals())
    }

    return this.stdout
  }

  print(string: string) {
    this.stdout += string
  }
}
