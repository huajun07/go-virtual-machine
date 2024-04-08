import { Process } from '../../executor/process'
import { CallRefNode, FuncNode, MethodNode } from '../../heap/types/func'
import { IntegerNode } from '../../heap/types/primitives'

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
    if (!(func instanceof FuncNode) && !(func instanceof MethodNode))
      throw Error('Stack does not contain closure')

    if (func instanceof FuncNode) {
      process.context.pushRTS(
        CallRefNode.create(process.context.PC(), process.heap).addr,
      )
      process.context.pushRTS(func.E())
      process.context.set_PC(func.PC())
    } else {
      const receiver = func.receiver()
      receiver.handleMethodCall(process, func.identifier())
    }
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

/**
 * Takes the top of the OS to be the number of arguments.
 * Then takes its arguments from the OS (in reverse order), and prints them out.
 */
export class PrintInstruction extends Instruction {
  constructor() {
    super('PRINT')
  }

  override execute(process: Process): void {
    const numOfArgs = new IntegerNode(
      process.heap,
      process.context.popOS(),
    ).get_value()
    const argAddresses = []
    for (let i = 0; i < numOfArgs; i++) {
      argAddresses.push(process.context.popOS())
    }
    for (let i = numOfArgs - 1; i >= 0; i--) {
      const string = process.heap.get_value(argAddresses[i]).toString()
      process.print(string)
      process.print(i > 0 ? ' ' : '\n')
    }
  }
}
