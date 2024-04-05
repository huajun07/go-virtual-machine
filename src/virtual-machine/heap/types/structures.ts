import { Heap, TAG } from '..'

import { BaseNode } from './base'

export class StackNode extends BaseNode {
  static create(heap: Heap) {
    const addr = heap.allocate(2)
    heap.set_tag(addr, TAG.STACK)
    if (heap.temp_roots) heap.temp_roots.push(addr)
    const list = ListNode.create(heap)
    if (heap.temp_roots) heap.temp_roots.pop()
    heap.memory.set_word(list.addr, addr + 1)
    return new StackNode(heap, addr)
  }

  list() {
    return new ListNode(this.heap, this.heap.memory.get_word(this.addr + 1))
  }

  push(addr: number) {
    const list = this.list()
    list.push(addr)
    this.heap.memory.set_word(list.addr, this.addr + 1)
  }
  pop() {
    const list = this.list()
    const res = list.pop()
    this.heap.memory.set_word(list.addr, this.addr + 1)
    return res
  }
  peek() {
    return this.list().peek()
  }
  get_idx(idx: number) {
    return this.list().get_idx(idx)
  }
  sz() {
    return this.list().get_sz()
  }
  override get_children(): number[] {
    return [this.heap.memory.get_word(this.addr + 1)]
  }
}

export class ListNode extends BaseNode {
  static init_sz = 4
  static create(heap: Heap) {
    const addr = heap.allocate(this.init_sz)
    heap.set_tag(addr, TAG.LIST)
    heap.memory.set_number(0, addr + 1)
    return new ListNode(heap, addr)
  }

  resize(new_size: number) {
    const new_pos = this.heap.allocate(new_size)
    this.heap.copy(new_pos, this.addr)
    this.addr = new_pos
  }

  get_sz() {
    return this.heap.memory.get_number(this.addr + 1)
  }

  set_sz(val: number) {
    this.heap.memory.set_number(val, this.addr + 1)
  }

  push(addr: number) {
    const sz = this.get_sz()
    const capacity = this.heap.get_size(this.addr)
    if (sz + 3 > capacity) this.resize(capacity * 2)
    this.heap.set_child(addr, this.addr + 2, sz)
    this.set_sz(sz + 1)
  }

  pop() {
    const sz = this.heap.memory.get_word(this.addr + 1)
    if (sz === 0) throw Error('List Empty!')
    const capacity = this.heap.get_size(this.addr)
    const val = this.heap.get_child(this.addr + 2, sz - 1)
    this.set_sz(sz - 1)
    if (4 * (sz + 1) < capacity) this.resize(capacity / 2)
    return val
  }

  peek() {
    const sz = this.get_sz()
    if (sz === 0) return undefined
    return this.get_idx(sz - 1)
  }

  get_idx(index: number) {
    return this.heap.get_child(this.addr + 2, index)
  }

  override get_children(): number[] {
    const sz = this.get_sz()
    return [...Array(sz).keys()].map((x) =>
      this.heap.get_child(this.addr + 2, x),
    )
  }
}

/**
 * Each ArrayNode occupies (2 + `length`) words.
 * Word 0: Array tag.
 * Word 1: Length of array.
 * Remaining `length` words: Each word is the address of an element.
 */
export class ArrayNode extends BaseNode {
  static create(length: number, heap: Heap): ArrayNode {
    const addr = heap.allocate(2 + length)
    heap.set_tag(addr, TAG.ARRAY)
    heap.memory.set_number(length, addr + 1)
    return new ArrayNode(heap, addr)
  }

  /**
   * `defaultCreator` is a function that allocates a default element on the heap,
   * and returns its address.
   */
  static default(
    length: number,
    defaultCreator: (heap: Heap) => number,
    heap: Heap,
  ) {
    const addr = heap.allocate(2 + length)
    heap.set_tag(addr, TAG.ARRAY)
    heap.memory.set_number(length, addr + 1)
    heap.temp_roots.push(addr)
    for (let i = 0; i < length; i++) {
      heap.memory.set_word(defaultCreator(heap), addr + 2 + i)
    }
    heap.temp_roots.pop()
    return new ArrayNode(heap, addr)
  }

  get_length(): number {
    return this.heap.memory.get_number(this.addr + 1)
  }

  set_child(index: number, address: number) {
    this.heap.memory.set_word(address, this.addr + 2 + index)
  }

  get_child(index: number): number {
    return this.heap.memory.get_word(this.addr + 2 + index)
  }

  override get_children(): number[] {
    return [...Array(this.get_length()).keys()].map((x) =>
      this.heap.get_child(this.addr + 2, x),
    )
  }

  override toString(): string {
    const length = this.get_length()
    const elements = []
    for (let i = 0; i < length; i++) {
      elements.push(this.heap.get_value(this.get_child(i)).toString())
    }
    return `[${elements.join(' ')}]`
  }
}

/**
 * Each SliceNode occupies 5 words.
 * Word 0: Slice tag.
 * Word 1: Underlying array address.
 * Word 2: Start index of this slice (a number).
 * Word 3: Length (a number).
 * Word 4: Capacity (a number).
 */
export class SliceNode extends BaseNode {
  static create(
    array: number,
    start: number,
    length: number,
    capacity: number,
    heap: Heap,
  ): SliceNode {
    const addr = heap.allocate(5)
    heap.set_tag(addr, TAG.SLICE)
    heap.memory.set_word(array, addr + 1)
    heap.memory.set_number(start, addr + 2)
    heap.memory.set_number(length, addr + 3)
    heap.memory.set_number(capacity, addr + 4)
    return new SliceNode(heap, addr)
  }

  static default(heap: Heap): SliceNode {
    return SliceNode.create(0, 0, 0, 0, heap)
  }

  get_array(): number {
    return this.heap.memory.get_word(this.addr + 1)
  }

  get_start(): number {
    return this.heap.memory.get_number(this.addr + 2)
  }

  get_length(): number {
    return this.heap.memory.get_number(this.addr + 3)
  }

  get_capacity(): number {
    return this.heap.memory.get_number(this.addr + 4)
  }

  get_child(index: number): number {
    const array = new ArrayNode(this.heap, this.get_array())
    return array.get_child(this.get_start() + index)
  }

  set_child(index: number, address: number) {
    const array = new ArrayNode(this.heap, this.get_array())
    array.set_child(this.get_start() + index, address)
  }

  override get_children(): number[] {
    return [this.get_array()]
  }

  override toString(): string {
    const length = this.get_length()
    const elements = []
    for (let i = 0; i < length; i++) {
      elements.push(this.heap.get_value(this.get_child(i)).toString())
    }
    return `[${elements.join(' ')}]`
  }
}
