import { Heap, TAG } from '..'

import { BaseNode } from './base'

export class StackNode extends BaseNode {
  static create(heap: Heap) {
    const addr = heap.allocate(2)
    heap.set_tag(addr, TAG.STACK)
    if (heap.temp_roots) heap.temp_roots.push(addr)
    const list = StackListNode.create(heap)
    if (heap.temp_roots) heap.temp_roots.pop()
    heap.memory.set_word(list.addr, addr + 1)
    return new StackNode(heap, addr)
  }

  list() {
    return new StackListNode(
      this.heap,
      this.heap.memory.get_word(this.addr + 1),
    )
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

export class StackListNode extends BaseNode {
  static init_sz = 4
  static create(heap: Heap) {
    const addr = heap.allocate(this.init_sz)
    heap.set_tag(addr, TAG.STACK_LIST)
    heap.memory.set_number(0, addr + 1)
    return new StackListNode(heap, addr)
  }

  resize(new_size: number) {
    const new_pos = this.heap.allocate(new_size)
    this.heap.set_tag(new_pos, TAG.STACK_LIST)
    const new_list = new StackListNode(this.heap, new_pos)
    const sz = this.get_sz()
    new_list.set_sz(sz)
    for (let i = 0; i < sz; i++) {
      new_list.set_idx(this.get_idx(i), i)
    }
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
    this.set_idx(addr, sz)
    this.set_sz(sz + 1)
  }

  pop() {
    const sz = this.get_sz()
    if (sz === 0) throw Error('List Empty!')
    const capacity = this.heap.get_size(this.addr)
    const val = this.get_idx(sz - 1)
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
    return this.heap.memory.get_word(this.addr + 2 + index)
  }

  set_idx(val: number, index: number) {
    return this.heap.memory.set_word(val, this.addr + 2 + index)
  }

  override get_children(): number[] {
    const sz = this.get_sz()
    return [...Array(sz).keys()].map((x) => this.get_idx(x))
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

  length(): number {
    return this.heap.memory.get_number(this.addr + 1)
  }

  capacity(): number {
    return this.length()
  }

  set_child(index: number, address: number) {
    this.heap.memory.set_word(address, this.addr + 2 + index)
  }

  get_child(index: number): number {
    return this.heap.memory.get_word(this.addr + 2 + index)
  }

  override get_children(): number[] {
    return [...Array(this.length()).keys()].map((x) =>
      this.heap.get_child(this.addr + 2, x),
    )
  }

  override toString(): string {
    const length = this.length()
    const elements = []
    for (let i = 0; i < length; i++) {
      elements.push(this.heap.get_value(this.get_child(i)).toString())
    }
    return `[${elements.join(' ')}]`
  }
}

/**
 * Each SliceNode occupies 4 words.
 * Word 0: Slice tag.
 * Word 1: Underlying array address.
 * Word 2: Start (a number), the starting index in the array.
 * Word 3: End (a number), the ending index in the array.
 */
export class SliceNode extends BaseNode {
  static create(
    array: number,
    start: number,
    end: number,
    heap: Heap,
  ): SliceNode {
    const addr = heap.allocate(5)
    heap.set_tag(addr, TAG.SLICE)
    heap.memory.set_word(array, addr + 1)
    heap.memory.set_number(start, addr + 2)
    heap.memory.set_number(end, addr + 3)
    return new SliceNode(heap, addr)
  }

  static default(heap: Heap): SliceNode {
    return SliceNode.create(0, 0, 0, heap)
  }

  array(): number {
    return this.heap.memory.get_word(this.addr + 1)
  }

  arrayNode(): ArrayNode {
    return new ArrayNode(this.heap, this.array())
  }

  start(): number {
    return this.heap.memory.get_number(this.addr + 2)
  }

  end(): number {
    return this.heap.memory.get_number(this.addr + 3)
  }

  length(): number {
    return this.end() - this.start()
  }

  capacity(): number {
    return this.arrayNode().length() - this.start()
  }

  get_child(index: number): number {
    return this.arrayNode().get_child(this.start() + index)
  }

  set_child(index: number, address: number) {
    this.arrayNode().set_child(this.start() + index, address)
  }

  override get_children(): number[] {
    return [this.array()]
  }

  override toString(): string {
    const length = this.length()
    const elements = []
    for (let i = 0; i < length; i++) {
      elements.push(this.heap.get_value(this.get_child(i)).toString())
    }
    return `[${elements.join(' ')}]`
  }
}

export class QueueNode extends BaseNode {
  static create(heap: Heap) {
    const addr = heap.allocate(2)
    heap.set_tag(addr, TAG.QUEUE)
    if (heap.temp_roots) heap.temp_roots.push(addr)
    const list = QueueListNode.create(heap)
    if (heap.temp_roots) heap.temp_roots.pop()
    heap.memory.set_word(list.addr, addr + 1)
    return new QueueNode(heap, addr)
  }

  list() {
    return new QueueListNode(
      this.heap,
      this.heap.memory.get_word(this.addr + 1),
    )
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

  sz() {
    return this.list().get_sz()
  }

  get_vals() {
    return this.list().get_children()
  }

  override get_children(): number[] {
    return [this.heap.memory.get_word(this.addr + 1)]
  }
}

export class QueueListNode extends BaseNode {
  static init_sz = 8
  static create(heap: Heap) {
    const addr = heap.allocate(this.init_sz)
    heap.set_tag(addr, TAG.QUEUE_LIST)
    heap.memory.set_number(0, addr + 1)
    heap.memory.set_number(0, addr + 2)
    heap.memory.set_number(0, addr + 3)
    return new QueueListNode(heap, addr)
  }

  resize(new_size: number) {
    const new_pos = this.heap.allocate(new_size)
    this.heap.set_tag(new_pos, TAG.QUEUE_LIST)
    const newQueueList = new QueueListNode(this.heap, new_pos)
    newQueueList.set_sz(this.get_sz())
    newQueueList.set_start(0)
    newQueueList.set_end(this.get_sz())
    const start = this.get_start()
    const cap = this.get_cap()
    for (let x = 0; x < this.get_sz(); x++) {
      newQueueList.set_idx(this.get_idx((start + x) % cap), x)
    }
    this.addr = new_pos
  }

  get_cap() {
    return this.heap.get_size(this.addr) - 4
  }

  get_sz() {
    return this.heap.memory.get_number(this.addr + 1)
  }

  set_sz(val: number) {
    this.heap.memory.set_number(val, this.addr + 1)
  }

  get_start() {
    return this.heap.memory.get_number(this.addr + 2)
  }

  set_start(val: number) {
    this.heap.memory.set_number(val, this.addr + 2)
  }

  get_end() {
    return this.heap.memory.get_number(this.addr + 3)
  }

  set_end(val: number) {
    this.heap.memory.set_number(val, this.addr + 3)
  }

  push(addr: number) {
    const sz = this.get_sz()
    const node_sz = this.heap.get_size(this.addr)
    if (sz + 5 > node_sz) this.resize(node_sz * 2)
    this.set_idx(addr, this.get_end())
    this.set_end((this.get_end() + 1) % this.get_cap())
    this.set_sz(sz + 1)
  }

  pop() {
    const sz = this.get_sz()
    if (sz === 0) throw Error('List Empty!')
    const node_sz = this.heap.get_size(this.addr)
    const val = this.get_idx(this.get_start())
    this.set_start((this.get_start() + 1) % this.get_cap())
    this.set_sz(sz - 1)
    if (4 * (sz + 3) < node_sz) this.resize(node_sz / 2)
    return val
  }

  peek() {
    const sz = this.get_sz()
    if (sz === 0) throw Error('Queue List is Empty!')
    return this.get_idx(this.get_start())
  }

  get_idx(index: number) {
    return this.heap.memory.get_word(this.addr + 4 + index)
  }

  set_idx(val: number, index: number) {
    return this.heap.memory.set_word(val, this.addr + 4 + index)
  }

  override get_children(): number[] {
    const sz = this.get_sz()
    const start = this.get_start()
    const cap = this.get_cap()
    return [...Array(sz).keys()].map((x) => this.get_idx((start + x) % cap))
  }
}
