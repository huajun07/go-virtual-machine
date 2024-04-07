import { Process } from '../../executor/process'
import { ArrayNode } from '../../heap/types/array'
import {
  ChannelNode,
  ChannelReqNode,
  ReqInfoNode,
} from '../../heap/types/channel'
import { IntegerNode } from '../../heap/types/primitives'

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
  constructor(public recv: boolean, public PC: number) {
    super('LDCR')
  }
  override execute(process: Process): void {
    const req = ReqInfoNode.create(
      process.context.peekOS(),
      process.context.addr,
      this.PC,
      this.recv,
      process.heap,
    )
    process.context.popOS()
    process.heap.temp_roots.push(req.addr)
    const chan = new ChannelNode(process.heap, process.context.popOS())
    const chan_req = ChannelReqNode.create(chan.addr, req.addr, process.heap)
    process.heap.temp_roots.pop()
    process.context.pushOS(chan_req.addr)
  }
}

export class TryChannelReqInstruction extends Instruction {
  constructor() {
    super('TRY_CHAN_REQ')
  }
  override execute(process: Process): void {
    const chan_req = new ChannelReqNode(process.heap, process.context.popOS())
    process.heap.temp_roots.push(chan_req.addr)
    const chan = chan_req.channel()
    const req = chan_req.req()
    if (req.is_recv()) {
      if (!chan.try_recv(req)) {
        process.context.set_waitlist(ArrayNode.create(1, process.heap).addr)
        process.context.waitlist().set_child(0, chan.recv_wait(req))
        process.context.set_blocked(true)
      } else {
        process.context.set_PC(req.PC())
        process.context.pushOS(req.io())
      }
    } else {
      if (!chan.try_send(req)) {
        process.context.set_waitlist(ArrayNode.create(1, process.heap).addr)
        process.context.waitlist().set_child(0, chan.send_wait(req))
        process.context.set_blocked(true)
      } else process.context.set_PC(req.PC())
    }
    process.heap.temp_roots.pop()
  }
}

export class SelectInstruction extends Instruction {
  constructor(public cases: number, public defualt_case: boolean) {
    super('SELECT')
  }
  override execute(process: Process): void {
    let pc = -1
    if (this.defualt_case) {
      pc = new IntegerNode(process.heap, process.context.popOS()).get_value()
    }
    let cases = []
    for (let i = 0; i < this.cases; i++) {
      cases.push(new ChannelReqNode(process.heap, process.context.peekOS()))
      process.heap.temp_roots.push(process.context.popOS())
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
        process.context.pushOS(req.io())
        break
      } else if (!req.is_recv() && chan.try_send(req)) {
        done = true
        process.context.set_PC(req.PC())
        break
      }
    }
    if (!done) {
      if (pc !== -1) {
        process.context.set_PC(pc)
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
