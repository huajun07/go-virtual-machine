import { Heap, TAG } from '..'

import { BaseNode } from './base'

export class FrameNode extends BaseNode {
  static create(frame_size: number, heap: Heap) {
    const addr = heap.allocate(frame_size + 1)

    heap.set_tag(addr, TAG.FRAME)
    heap.set_children(addr, Array(frame_size).fill(heap.UNASSIGNED), 1)
    return new FrameNode(heap, addr)
  }

  set_idx(addr: number, index: number) {
    this.heap.set_child(addr, this.addr + 1, index)
  }

  get_idx(index: number) {
    return this.heap.get_child(this.addr + 1, index)
  }

  override get_children(): number[] {
    return this.heap.get_children(this.addr, 1)
  }
}

export class EnvironmentNode extends BaseNode {
  static create(frames: number[], for_block: boolean, heap: Heap) {
    const addr = heap.allocate(frames.length + 2)
    heap.set_tag(addr, TAG.ENVIRONMENT)
    heap.memory.set_bits(for_block ? 1 : 0, addr, 1, 16)
    // TODO: Add Defer Stuff
    heap.set_children(addr, frames, 2)
    return new EnvironmentNode(heap, addr)
  }

  extend_env(frame: number, for_block = false) {
    const frames = this.get_frames()
    frames.push(frame)
    return EnvironmentNode.create(frames, for_block, this.heap)
  }

  get_frame(index: number) {
    return new FrameNode(this.heap, this.heap.get_child(this.addr + 2, index))
  }

  get_var(frame_idx: number, var_idx: number) {
    return this.get_frame(frame_idx).get_idx(var_idx)
  }

  if_for_block() {
    return this.heap.memory.get_bits(this.addr, 1, 16) === 1
  }

  get_frames(): number[] {
    return this.heap.get_children(this.addr, 2)
  }

  override get_children(): number[] {
    return this.heap.get_children(this.addr, 1)
  }
}
