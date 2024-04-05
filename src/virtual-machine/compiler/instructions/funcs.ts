import { Process } from '../../executor/process'
import { CallRefNode, FuncNode } from '../../heap/types/func'

import { Instruction } from './base'

export class LoadFuncInstruction extends Instruction {
  PC: number
  constructor(PC: number) {
    super('LF')
    this.PC = PC
  }

  static is(instr: Instruction): instr is LoadFuncInstruction {
    return instr.tag === 'LF'
  }

  override execute(process: Process): void {
    process.context.pushOS(
      FuncNode.create(this.PC, process.context.E().addr, process.heap).addr,
    )
  }
}

export class CallInstruction extends Instruction {
  args: number
  constructor(args: number) {
    super('CALL')
    this.args = args
  }

  static is(instr: Instruction): instr is CallInstruction {
    return instr.tag === 'CALL'
  }

  override execute(process: Process): void {
    const func = process.heap.get_value(process.context.peekOSIdx(this.args))
    if (!(func instanceof FuncNode))
      throw Error('Stack does not contain closure')
    process.context.pushRTS(
      CallRefNode.create(process.context.PC(), process.heap).addr,
    )
    process.context.pushRTS(func.E())
    process.context.set_PC(func.PC())
  }
}

export class ReturnInstruction extends Instruction {
  constructor() {
    super('RET')
  }

  static is(instr: Instruction): instr is ReturnInstruction {
    return instr.tag === 'RET'
  }

  override execute(process: Process): void {
    let val = null
    do {
      val = process.heap.get_value(process.context.popRTS())
    } while (!(val instanceof CallRefNode))
    process.context.set_PC(val.PC())
  }
}
