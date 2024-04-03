import {
  BinaryInstruction,
  BlockInstruction,
  CallInstruction,
  DataType,
  DoneInstruction,
  ExitBlockInstruction,
  ExitLoopInstruction,
  FuncBlockInstruction,
  Instruction,
  JumpIfFalseInstruction,
  JumpInstruction,
  LoadConstantInstruction,
  LoadFuncInstruction,
  LoadVariableInstruction,
  PopInstruction,
  ReturnInstruction,
  StoreInstruction,
  UnaryInstruction,
} from '../compiler/instructions'
import {
  BoolType,
  Float64Type,
  FunctionType,
  Int64Type,
  StringType,
} from '../compiler/typing'
import { Heap } from '../heap'
import { ContextNode } from '../heap/types/context'
import { EnvironmentNode, FrameNode } from '../heap/types/environment'
import { CallRefNode, FuncNode } from '../heap/types/func'
import {
  BoolNode,
  FloatNode,
  IntegerNode,
  PrimitiveNode,
  StringNode,
} from '../heap/types/primitives'

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
    // Note this is to simulate the main function as a func call
    const global_env = this.context.E().addr
    this.context.pushRTS(
      CallRefNode.create(this.instructions.length - 1, this.heap).addr,
    )
    this.context.pushRTS(global_env)
    let runtime_count = 0
    while (!DoneInstruction.is(this.instructions[this.context.PC()])) {
      const instr = this.instructions[this.context.incr_PC()]
      // console.log('Instr:', instr)
      this.execute_microcode(instr)
      //   this.context.printOS()
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
    if (instr instanceof PopInstruction) {
      this.context.popOS()
    } else if (instr instanceof BinaryInstruction) {
      const arg2 = this.heap.get_value(this.context.popOS()) as PrimitiveNode
      const arg1 = this.heap.get_value(this.context.popOS()) as PrimitiveNode
      this.context.pushOS(arg1.apply_binop(arg2, instr.op).addr)
    } else if (instr instanceof UnaryInstruction) {
      const arg1 = this.heap.get_value(this.context.popOS()) as PrimitiveNode
      this.context.pushOS(arg1.apply_unary(instr.op).addr)
    } else if (instr instanceof LoadConstantInstruction) {
      if (instr.data_type === DataType.Boolean) {
        this.context.pushOS(
          BoolNode.create(instr.val as boolean, this.heap).addr,
        )
      } else if (instr.data_type === DataType.Float) {
        this.context.pushOS(
          FloatNode.create(instr.val as number, this.heap).addr,
        )
      } else if (instr.data_type === DataType.Number) {
        const temp = IntegerNode.create(instr.val as number, this.heap).addr
        this.context.pushOS(temp)
      } else if (instr.data_type === DataType.String) {
        this.context.pushOS(
          StringNode.create(instr.val as string, this.heap).addr,
        )
      }
      // Check what type from the token
    } else if (instr instanceof LoadVariableInstruction) {
      this.context.pushOS(
        this.context.E().get_var(instr.frame_idx, instr.var_idx),
      )
    } else if (instr instanceof StoreInstruction) {
      const dst = this.context.popOS()
      const src = this.context.popOS()
      this.heap.copy(dst, src)
    } else if (instr instanceof BlockInstruction) {
      const new_frame = FrameNode.create(instr.frame.length, this.heap)
      this.heap.temp_roots.push(new_frame.addr)
      for (let i = 0; i < instr.frame.length; i++) {
        const T = instr.frame[i]
        if (T instanceof BoolType) {
          new_frame.set_idx(BoolNode.default(this.heap).addr, i)
        } else if (T instanceof Int64Type) {
          new_frame.set_idx(IntegerNode.default(this.heap).addr, i)
        } else if (T instanceof Float64Type) {
          new_frame.set_idx(FloatNode.default(this.heap).addr, i)
        } else if (T instanceof StringType) {
          new_frame.set_idx(StringNode.default(this.heap).addr, i)
        } else if (T instanceof FunctionType) {
          new_frame.set_idx(FuncNode.default(this.heap).addr, i)
        } else throw Error('Unsupported Type')
      }
      if (!(instr instanceof FuncBlockInstruction)) {
        this.context.pushRTS(
          this.context.E().extend_env(new_frame.addr, instr.for_block).addr,
        )
      } else {
        // This is to not trigger the exit scope condition of the closure env
        this.context.set_E(
          this.context.E().extend_env(new_frame.addr, instr.for_block).addr,
        )
      }
      this.heap.temp_roots.pop()
      if (instr instanceof FuncBlockInstruction) {
        for (let i = instr.args - 1; i >= 0; i--) {
          const src = this.context.popOS()
          const dst = new_frame.get_idx(i)
          this.heap.copy(dst, src)
        }
        // Pop function in stack
        this.context.popOS()
      }
    } else if (instr instanceof ExitBlockInstruction) {
      this.context.popRTS()
      // TODO: Implement defer in popRTS
    } else if (instr instanceof JumpIfFalseInstruction) {
      const pred = (
        this.heap.get_value(this.context.popOS()) as BoolNode
      ).get_value()
      if (!pred) this.context.set_PC(instr.addr)
    } else if (instr instanceof ExitLoopInstruction) {
      while (this.context.E().if_for_block()) {
        // TODO: Implement defer in popRTS
        this.context.popRTS()
      }
      this.context.set_PC(instr.addr)
    } else if (instr instanceof JumpInstruction) {
      this.context.set_PC(instr.addr)
    } else if (instr instanceof LoadFuncInstruction) {
      this.context.pushOS(
        FuncNode.create(instr.PC, this.context.E().addr, this.heap).addr,
      )
    } else if (instr instanceof CallInstruction) {
      const func = this.heap.get_value(this.context.peekOSIdx(instr.args))
      if (!(func instanceof FuncNode))
        throw Error('Stack does not contain closure')
      this.context.pushRTS(
        CallRefNode.create(this.context.PC(), this.heap).addr,
      )
      this.context.pushRTS(func.E())
      this.context.set_PC(func.PC())
    } else if (instr instanceof ReturnInstruction) {
      let val = null
      do {
        val = this.heap.get_value(this.context.popRTS())
      } while (!(val instanceof CallRefNode))
      this.context.set_PC(val.PC())
    } else {
      throw Error('Invalid Instruction')
    }
  }
}
