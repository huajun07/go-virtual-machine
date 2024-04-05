import { Process } from '../../executor/process'
import {
  BoolNode,
  FloatNode,
  IntegerNode,
  StringNode,
} from '../../heap/types/primitives'
import { ArrayNode, SliceNode } from '../../heap/types/structures'
import { BoolType, Float64Type, Int64Type, StringType, Type } from '../typing'

import { Instruction } from './base'

export class LoadConstantInstruction extends Instruction {
  val: unknown
  data_type: Type
  constructor(val: unknown, data_type: Type) {
    super('LDC')
    this.val = val
    this.data_type = data_type
  }

  static is(instr: Instruction): instr is LoadConstantInstruction {
    return instr.tag === 'LDC'
  }

  override execute(process: Process): void {
    if (this.data_type instanceof BoolType) {
      process.context.pushOS(
        BoolNode.create(this.val as boolean, process.heap).addr,
      )
    } else if (this.data_type instanceof Float64Type) {
      process.context.pushOS(
        FloatNode.create(this.val as number, process.heap).addr,
      )
    } else if (this.data_type instanceof Int64Type) {
      const temp = IntegerNode.create(this.val as number, process.heap).addr
      process.context.pushOS(temp)
    } else if (this.data_type instanceof StringType) {
      process.context.pushOS(
        StringNode.create(this.val as string, process.heap).addr,
      )
    }
  }
}

/** Loads a default value of the given type onto the OS. */
export class LoadDefaultInstruction extends Instruction {
  constructor(public dataType: Type) {
    super('LDD')
  }

  override execute(process: Process): void {
    const defaultNodeAddress = this.dataType.defaultNodeCreator()(process.heap)
    process.context.pushOS(defaultNodeAddress)
  }
}

/**
 * Creates an array on the heap, with element addresses taken from the OS (starting from the back).
 * Pushes the address of the array back onto the OS.
 */
export class LoadArrayInstruction extends Instruction {
  constructor(public length: number) {
    super('LDA')
  }

  override execute(process: Process): void {
    const arrayNode = ArrayNode.create(this.length, process.heap)
    for (let i = this.length - 1; i >= 0; i--) {
      arrayNode.set_child(i, process.context.popOS())
    }
    process.context.pushOS(arrayNode.addr)
  }
}

/** Takes the index, then array from the heap, and loads the element at the index onto the OS.  */
export class LoadArrayElementInstruction extends Instruction {
  constructor() {
    super('LDAE')
  }

  override execute(process: Process): void {
    const indexNode = new IntegerNode(process.heap, process.context.popOS())
    const index = indexNode.get_value()
    const array = new ArrayNode(process.heap, process.context.popOS())
    if (index < 0 || index >= array.get_length()) {
      throw new Error(
        `Index out of range [${index}] with length ${array.get_length()}`,
      )
    }
    const element = array.get_child(index)
    process.context.pushOS(element)
  }
}
/** Takes the index, then array from the heap, and loads the element at the index onto the OS.  */
export class LoadSliceElementInstruction extends Instruction {
  constructor() {
    super('LDAE')
  }

  override execute(process: Process): void {
    const index = process.context.popOSNode(IntegerNode).get_value()
    const slice = process.context.popOSNode(SliceNode)
    const array = new ArrayNode(process.heap, slice.get_array())
    if (index < 0 || index >= array.get_length()) {
      throw new Error(
        `Index out of range [${index}] with length ${array.get_length()}`,
      )
    }
    const element = array.get_child(index)
    process.context.pushOS(element)
  }
}

/**
 * Creates a slice on the heap, with the following arguments taken from the OS (bottom to top).
 * - Array address
 * - Start index of the slice.
 * - Length of the slice.
 * - Capacity of the slice.
 * Pushes the address of the slice back onto the OS.
 */
export class LoadSliceInstruction extends Instruction {
  constructor() {
    super('LDS')
  }

  override execute(process: Process): void {
    const capacity = process.context.popOSNode(IntegerNode).get_value()
    const length = process.context.popOSNode(IntegerNode).get_value()
    const start = process.context.popOSNode(IntegerNode).get_value()
    const array = process.context.popOS()
    const sliceNode = SliceNode.create(
      array,
      start,
      length,
      capacity,
      process.heap,
    )
    process.context.pushOS(sliceNode.addr)
  }
}

export class LoadVariableInstruction extends Instruction {
  frame_idx: number
  var_idx: number
  constructor(frame_idx: number, var_idx: number) {
    super('LD')
    this.frame_idx = frame_idx
    this.var_idx = var_idx
  }

  override execute(process: Process): void {
    process.context.pushOS(
      process.context.E().get_var(this.frame_idx, this.var_idx),
    )
  }
}
