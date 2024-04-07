import { Heap, TAG } from '..'

import { BaseNode } from './base'
import { ContextNode } from './context'
import { LinkedListEntryNode, LinkedListNode } from './linkedlist'
import { QueueNode } from './queue'

export class ChannelNode extends BaseNode {
  static create(buffer: number, heap: Heap) {
    const addr = heap.allocate(4)
    heap.set_tag(addr, TAG.CHANNEL)
    heap.memory.set_number(buffer, addr + 1)
    heap.temp_roots.push(addr)
    const buffer_queue = QueueNode.create(heap)
    heap.memory.set_word(buffer_queue.addr, addr + 2)
    const wait_queue = LinkedListNode.create(heap)
    heap.memory.set_number(wait_queue.addr, addr + 3)
    heap.temp_roots.pop()
    return new ChannelNode(heap, addr)
  }
  static default(heap: Heap) {
    return ChannelNode.create(0, heap)
  }

  is_recv() {
    return this.heap.memory.get_bits(this.addr, 1, 16) === 1
  }

  set_recv(val: boolean) {
    this.heap.memory.set_bits(val ? 1 : 0, this.addr, 1, 16)
  }

  buffer() {
    return new QueueNode(this.heap, this.heap.memory.get_number(this.addr + 2))
  }

  wait_queue() {
    return new LinkedListNode(
      this.heap,
      this.heap.memory.get_number(this.addr + 3),
    )
  }

  get_buffer_sz() {
    return this.heap.memory.get_number(this.addr + 1)
  }

  try_send(send_req: ReqInfoNode) {
    if (this.is_recv() && !this.wait_queue().is_empty()) {
      // Exist matching recv request (Note assumes wait queue contains no recv req)
      const recv_req = new ReqInfoNode(this.heap, this.wait_queue().pop_front())
      this.heap.copy(recv_req.io(), send_req.io())
      recv_req.unblock()
      return true
    }
    if (this.buffer().sz() < this.get_buffer_sz()) {
      this.buffer().push(send_req.addr)
      return true
    }
    return false
  }

  try_recv(recv_req: ReqInfoNode) {
    if (this.buffer().sz()) {
      // Buffer have entries
      const src = this.buffer().pop()
      this.heap.copy(recv_req.io(), src)
      if (!this.is_recv() && !this.wait_queue().is_empty()) {
        // If wait queue contain send reqs should unblock since there is space
        const send_req = new ReqInfoNode(
          this.heap,
          this.wait_queue().pop_front(),
        )
        this.buffer().push(send_req.io())
        send_req.unblock()
      }
      return true
    }
    if (!this.is_recv() && !this.wait_queue().is_empty()) {
      // Case where buffer size is 0 and send reqs in wait queue
      const send_req = new ReqInfoNode(this.heap, this.wait_queue().pop_front())
      this.heap.copy(recv_req.io(), send_req.io())
      send_req.unblock()
      return true
    }
    return false
  }

  recv_wait(recv_req: ReqInfoNode) {
    if (!this.is_recv() && !this.wait_queue().is_empty())
      throw Error('Exist matching send request!')
    this.set_recv(true)
    return this.wait_queue().push_back(recv_req.addr)
  }

  send_wait(send_req: ReqInfoNode) {
    if (this.is_recv() && !this.wait_queue().is_empty())
      throw Error('Exist matching recv request!')
    if (this.get_buffer_sz() > this.buffer().sz())
      throw Error('Send buffer is not full')
    this.set_recv(false)
    return this.wait_queue().push_back(send_req.addr)
  }

  override get_children(): number[] {
    return [this.buffer().addr, this.wait_queue().addr]
  }
}

export class ReqInfoNode extends BaseNode {
  static create(
    io_addr: number,
    context: number,
    pc: number,
    recv: boolean,
    heap: Heap,
  ) {
    const addr = heap.allocate(4)
    heap.set_tag(addr, TAG.REQ_INFO)
    heap.memory.set_bits(recv ? 1 : 0, addr, 1, 16)
    heap.memory.set_number(io_addr, addr + 1)
    heap.memory.set_number(context, addr + 2)
    heap.memory.set_number(pc, addr + 3)
    return new ReqInfoNode(heap, addr)
  }

  is_recv() {
    return this.heap.memory.get_bits(this.addr, 1, 16) === 1
  }

  io() {
    return this.heap.memory.get_number(this.addr + 1)
  }

  PC() {
    return this.heap.memory.get_number(this.addr + 3)
  }

  context() {
    return new ContextNode(
      this.heap,
      this.heap.memory.get_number(this.addr + 2),
    )
  }

  unblock() {
    const context = this.context()
    context.set_PC(this.PC())
    if (this.is_recv()) context.pushOS(this.io())
    const wait_nodes = context.waitlist().get_children()
    for (const wait_node of wait_nodes) {
      const node = new LinkedListEntryNode(this.heap, wait_node)
      node.del()
    }
    context.set_blocked(false)
    this.heap.contexts.push(context.addr)
  }

  override get_children(): number[] {
    return [this.context().addr, this.io()]
  }
}

export class ChannelReqNode extends BaseNode {
  static create(channel: number, req: number, heap: Heap) {
    const addr = heap.allocate(3)
    heap.set_tag(addr, TAG.CHANNEL_REQ)
    heap.memory.set_number(channel, addr + 1)
    heap.memory.set_number(req, addr + 2)
    return new ChannelReqNode(heap, addr)
  }

  channel() {
    return new ChannelNode(
      this.heap,
      this.heap.memory.get_number(this.addr + 1),
    )
  }

  req() {
    return new ReqInfoNode(
      this.heap,
      this.heap.memory.get_number(this.addr + 2),
    )
  }

  override get_children(): number[] {
    return [this.channel().addr, this.req().addr]
  }
}
