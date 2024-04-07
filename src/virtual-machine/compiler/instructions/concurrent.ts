import { Process } from '../../executor/process'
import { ArrayNode } from '../../heap/types/array'
import {
  ChannelNode,
  ChannelReqNode,
  SelectCaseNode,
} from '../../heap/types/channel'
import { FrameNode } from '../../heap/types/environment'
import { IntegerNode } from '../../heap/types/primitives'
import { Type } from '../typing'

import { Instruction } from './base'

export class ForkInstruction extends Instruction {
  addr: number

  constructor(addr = 0) {
    super('FORK')
    this.addr = addr
  }

  set_addr(addr: number) {
    this.addr = addr
  }

  override execute(process: Process): void {
    const new_context = process.context.fork().addr
    process.heap.temp_roots.push(new_context)
    process.contexts.push(new_context)
    process.heap.temp_roots.pop()
    process.context.set_PC(this.addr)
  }
}

export class LoadChannelInstruction extends Instruction {
  constructor() {
    super('LDCH')
  }
  override execute(process: Process): void {
    const buffer_sz = new IntegerNode(
      process.heap,
      process.context.popOS(),
    ).get_value()
    process.context.pushOS(ChannelNode.create(buffer_sz, process.heap).addr)
  }
}

export class LoadChannelReqInstruction extends Instruction {
  constructor(public recv: boolean) {
    super('LDCR')
  }
  override execute(process: Process): void {
    const req = ChannelReqNode.create(
      process.context.peekOS(),
      process.context.addr,
      process.context.PC() + 1,
      -1,
      this.recv,
      process.heap,
    )
    process.context.popOS()
    const chan = new ChannelNode(process.heap, process.context.popOS())
    process.heap.temp_roots.push(req.addr)
    if (this.recv) {
      if (!chan.try_recv(req)) {
        process.context.set_waitlist(ArrayNode.create(1, process.heap).addr)
        process.context.waitlist().set_child(0, chan.recv_wait(req))
        process.context.set_blocked(true)
      }
    } else {
      if (!chan.try_send(req)) {
        process.context.set_waitlist(ArrayNode.create(1, process.heap).addr)
        process.context.waitlist().set_child(0, chan.send_wait(req))
        process.context.set_blocked(true)
      }
    }
    process.heap.temp_roots.pop()
  }
}

export class LoadChannelCaseReqInstruction extends Instruction {
  constructor(public frame: Type[], public PC: number, public recv: boolean) {
    super('LDCCR')
  }
  override execute(process: Process): void {
    // Create new environment for the case
    const new_frame = FrameNode.create(this.frame.length, process.heap)
    process.heap.temp_roots.push(new_frame.addr)
    for (let i = 0; i < this.frame.length; i++) {
      const T = this.frame[i]
      new_frame.set_idx(T.defaultNodeCreator()(process.heap), i)
    }
    const env = process.context.E().extend_env(new_frame.addr)
    process.heap.temp_roots.pop()

    // Create channel request
    process.heap.temp_roots.push(env.addr)
    const req = ChannelReqNode.create(
      process.context.peekOS(),
      process.context.addr,
      this.PC,
      env.addr,
      this.recv,
      process.heap,
    )
    process.context.popOS()
    process.heap.temp_roots.pop()

    // Create select case
    process.heap.temp_roots.push(req.addr)
    const selectcase = SelectCaseNode.create(
      process.context.popOS(),
      req.addr,
      process.heap,
    )
    process.heap.temp_roots.pop()
    process.context.pushOS(selectcase.addr)
  }
}

export class SelectInstruction extends Instruction {
  constructor(public cases: number, public defualt_case: boolean) {
    super('SELECT')
  }
  override execute(process: Process): void {
    let cases = []
    for (let i = 0; i < this.cases; i++) {
      cases.push(new SelectCaseNode(process.heap, process.context.peekOS()))
      process.heap.temp_roots.push(process.context.popOS())
    }
    let pc = -1
    if (this.defualt_case) {
      pc = new IntegerNode(process.heap, process.context.popOS()).get_value()
    }
    cases = cases
      .map((a) => ({ sort: Math.random(), value: a }))
      .sort((a, b) => a.sort - b.sort)
      .map((a) => a.value)
    let done = false
    for (const cas of cases) {
      const chan = cas.channel()
      const req = cas.req()
      if (req.is_recv() && chan.try_recv(req)) {
        done = true
        process.context.set_PC(req.PC())
        process.context.pushRTS(req.env().addr)
        break
      } else if (!req.is_recv() && chan.try_send(req)) {
        done = true
        process.context.set_PC(req.PC())
        process.context.pushRTS(req.env().addr)
        break
      }
    }
    if (!done) {
      if (pc !== -1) {
        process.context.set_E(pc)
      } else {
        process.context.set_blocked(true)
        process.context.set_waitlist(
          ArrayNode.create(cases.length, process.heap).addr,
        )
        for (let i = 0; i < cases.length; i++) {
          const chan = cases[i].channel()
          const req = cases[i].req()
          process.context
            .waitlist()
            .set_child(
              i,
              req.is_recv() ? chan.recv_wait(req) : chan.send_wait(req),
            )
        }
      }
    }
    for (let i = 0; i < cases.length; i++) process.heap.temp_roots.pop()
  }
}
