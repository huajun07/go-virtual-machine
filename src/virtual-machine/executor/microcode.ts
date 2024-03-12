import {
  BinaryInstruction,
  BlockInstruction,
  DataType,
  ExitBlockInstruction,
  Instruction,
  LoadConstantInstruction,
  LoadVariableInstruction,
  OpInstruction,
  SetTypeInstruction,
  StoreInstruction,
  UnaryInstruction,
} from '../compiler/instructions'
import { Heap } from '../heap'

import { Context } from './context'
import { binary_op, unary_op } from './ops'

const apply_binop = (
  instr: OpInstruction,
  x: number,
  y: number,
  heap: Heap,
): number => {
  return binary_op[instr.op](x, y, heap)
}

const apply_unary = (instr: OpInstruction, x: number, heap: Heap): number => {
  return unary_op[instr.op](x, heap)
}

const execute_microcode = (
  context: Context,
  instr: Instruction,
  heap: Heap,
) => {
  if (instr instanceof BinaryInstruction) {
    const arg2 = context.popOS()
    const arg1 = context.popOS()
    context.pushOS(apply_binop(instr, arg1, arg2, heap))
  } else if (instr instanceof UnaryInstruction) {
    const arg1 = context.popOS()
    context.pushOS(apply_unary(instr, arg1, heap))
  } else if (instr instanceof LoadConstantInstruction) {
    if (instr.data_type === DataType.Boolean) {
      context.pushOS(heap.allocate_boolean(instr.val as boolean))
    } else if (instr.data_type === DataType.Float) {
      // TOOD: Add float data type in heap
      // context.pushOS(heap.allocate_number(instr.val as number))
    } else if (instr.data_type === DataType.Number) {
      context.pushOS(heap.allocate_number(instr.val as number))
    } else if (instr.data_type === DataType.String) {
      // TOOD: Add string data type in heap
      // context.pushOS(heap.allocate_string(instr.val as string))
    }
    // Check what type from the token
  } else if (instr instanceof LoadVariableInstruction) {
    context.pushOS(heap.get_var(context.E, instr.frame_idx, instr.var_idx))
  } else if (instr instanceof SetTypeInstruction) {
    // TODO: Set type for runtime type check (Pending parser type check)
  } else if (instr instanceof StoreInstruction) {
    const dst = context.popOS()
    const src = context.popOS()
    heap.store_value(dst, src)
  } else if (instr instanceof BlockInstruction) {
    context.pushRTS(context.E)
    const new_frame = heap.allocate_frame(instr.frame_size)
    context.pushT(new_frame)
    context.E = heap.extend_env(context.E, new_frame)
    context.popT()
  } else if (instr instanceof ExitBlockInstruction) {
    context.E = context.popRTS()
  } else {
    throw Error('Invalid Instruction')
  }
}

export { execute_microcode }
