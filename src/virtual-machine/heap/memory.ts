const bytes_in_int = 4 // Number of bytes in int
const bits_in_byte = 8 // Number of bits in byte

export class Memory {
  array: ArrayBuffer
  view: DataView
  word_size: number
  /**
   * Constructor for memory
   * @param size Number of bytes in memory
   * @param word_size How many bytes in a word
   */
  constructor(size: number, word_size = 8) {
    if (!Number.isInteger(Math.log(word_size) / Math.log(2)))
      throw Error('Word Size must be power of 2')
    this.word_size = word_size
    this.array = new ArrayBuffer(size * word_size)
    this.view = new DataView(this.array)
  }

  check_valid(num_bits: number, bit_offset: number) {
    const bits_in_word = this.word_size * bits_in_byte
    if (num_bits > bits_in_word || num_bits < 0)
      throw Error('Invalid number of bits')
    if (bit_offset + num_bits > bits_in_word) throw Error('Exceed word length')
  }

  /**
   * Figure out which 32 bit block to start in and what is the offset
   */
  get_block_and_offset(addr: number, bit_offset: number) {
    addr *= this.word_size
    const block_offset =
      (bit_offset + addr * bits_in_byte) % (bits_in_byte * bytes_in_int)
    const block_idx = Math.floor(
      (addr + Math.floor(bit_offset / bits_in_byte)) / bytes_in_int,
    )
    return [block_idx, block_offset]
  }

  /**
   * @param addr Starting Byte of the Memory
   * @param num_bits Number of bits to retrieve
   * @param bit_offset Bit offset within the byte ([0 - 7]: Defaults to 0)
   * @returns Number which is the value at the requested position
   */
  get_bits(addr: number, num_bits: number, bit_offset = 0) {
    this.check_valid(num_bits, bit_offset)
    let [block_idx, block_offset] = this.get_block_and_offset(addr, bit_offset)
    /**
     * Iterate through the 32 bit blocks and sum the values to get the answer
     */
    let bits_covered = 0
    let carry = 1
    let val = 0
    while (bits_covered < num_bits) {
      const valid_bits_in_block = Math.min(
        num_bits - bits_covered,
        bytes_in_int * bits_in_byte - block_offset,
      )
      const mask = (2 ** valid_bits_in_block - 1) * 2 ** block_offset

      val +=
        Math.floor(
          ((mask & this.view.getUint32(block_idx * 4)) >>> 0) /
            2 ** block_offset,
        ) * carry

      bits_covered += valid_bits_in_block
      block_offset = 0
      carry *= 2 ** valid_bits_in_block
      block_idx++
    }
    return val
  }

  /**
   * @param val Value to update
   * @param addr Starting Word of the Memory
   * @param num_bits Number of bits to retrieve
   * @param bit_offset Bit offset within the byte ([0 - 7]: Defaults to 0)
   * @returns Number which is the value at the requested position
   */
  set_bits(val: number, addr: number, num_bits: number, bit_offset = 0) {
    this.check_valid(num_bits, bit_offset)
    let [block_idx, block_offset] = this.get_block_and_offset(addr, bit_offset)

    /**
     * Iterate through the 32 bit blocks and set the value in that block
     */
    let bits_covered = 0
    while (bits_covered < num_bits) {
      const valid_bits_in_block = Math.min(
        num_bits - bits_covered,
        bytes_in_int * bits_in_byte - block_offset,
      )
      const mask = ~((2 ** valid_bits_in_block - 1) * 2 ** block_offset)
      const val_mask =
        ((2 ** valid_bits_in_block - 1) & val) * 2 ** block_offset
      const temp_val = (this.view.getUint32(block_idx * 4) & mask) | val_mask

      this.view.setUint32(block_idx * 4, temp_val)

      val -= (2 ** valid_bits_in_block - 1) & val
      val = Math.floor(val / 2 ** valid_bits_in_block)
      bits_covered += valid_bits_in_block
      block_offset = 0
      block_idx++
    }
    return val
  }

  /**
   * @param val Value to update
   * @param addr Starting Word
   * @param num_of_bytes Number of bytes to modify
   */
  set_bytes(val: number, addr: number, num_of_bytes: number, bytes_offset = 0) {
    this.set_bits(
      val,
      addr,
      bits_in_byte * num_of_bytes,
      bytes_offset * bits_in_byte,
    )
  }

  /**
   * @param addr Starting Word
   * @param num_of_bytes Number of bytes to retrieve
   */
  get_bytes(addr: number, num_of_bytes: number, bytes_offset = 0) {
    return this.get_bits(
      addr,
      bits_in_byte * num_of_bytes,
      bytes_offset * bits_in_byte,
    )
  }

  /**
   * @param val Value to update
   * @param addr Starting word index
   */
  set_word(val: number, addr: number) {
    this.set_bits(val, addr, bits_in_byte * this.word_size)
  }

  /**
   * @param addr Starting word index
   */
  get_word(addr: number) {
    return this.get_bits(addr, bits_in_byte * this.word_size)
  }

  /**
   * Print out Heap
   */
  print() {
    let heap_str = ''
    const idx_max_len = this.view.byteLength / 4
    for (let i = 0; i < this.view.byteLength; i += 4) {
      let str = (this.view.getUint32(i) >>> 0).toString(2)
      if (str.length < bits_in_byte * bytes_in_int) {
        str = '0'.repeat(bits_in_byte * bytes_in_int - str.length) + str
      }
      let idx_str = (i / 4).toString()
      if (idx_str.length < idx_max_len) {
        idx_str = ' '.repeat(idx_max_len - idx_str.length) + idx_str
      }

      heap_str += idx_str + ': ' + str + '\n'
    }
    console.log(heap_str)
  }

  get_number(addr: number) {
    return this.view.getBigInt64(addr * this.word_size)
  }

  set_number(val: bigint, addr: number) {
    return this.view.setBigInt64(addr * this.word_size, val)
  }

  get_float(addr: number) {
    return this.view.getFloat64(addr * this.word_size)
  }

  set_float(val: number, addr: number) {
    return this.view.setFloat64(addr * this.word_size, val)
  }
}
