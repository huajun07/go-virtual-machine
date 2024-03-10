const bytes_in_int = 4 // Number of bytes in int
const bits_in_byte = 8 // Number of bits in byte

export class Memory {
  array: number[]
  word_size: number
  /**
   * Constructor for memory
   * @param size Number of bytes in memory
   * @param word_size How many bytes in a word
   */
  constructor(size: number, word_size = 8) {
    if ((Math.log(word_size) / Math.log(2)) % 1 !== 0)
      throw Error('Word Size must be power of 2')
    this.word_size = word_size
    const arr_size = Math.ceil(size / bytes_in_int)
    this.array = []
    for (let i = 0; i < arr_size; i++) this.array.push(0)
  }

  /**
   * @param addr Starting Byte of the Memory
   * @param num_bits Number of bits to retrieve
   * @param bit_offset Bit offset within the byte ([0 - 7]: Defaults to 0)
   * @returns Number which is the value at the requested position
   */
  get_bits(addr: number, num_bits: number, bit_offset = 0) {
    const bits_in_word = this.word_size * bits_in_byte
    if (num_bits > bits_in_word || num_bits < 0)
      throw Error('Invalid number of bits')
    const offset = (addr % this.word_size) * bits_in_byte + bit_offset
    if (offset + num_bits > bits_in_word) throw Error('Exceed word length')
    let block_offset = bit_offset + (addr % bytes_in_int) * bits_in_byte
    let block_idx = Math.floor(addr / bytes_in_int)
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
        Math.floor(((mask & this.array[block_idx]) >>> 0) / 2 ** block_offset) *
        carry

      bits_covered += valid_bits_in_block
      block_offset = 0
      carry *= 2 ** valid_bits_in_block
      block_idx++
    }
    return val
  }

  /**
   * @param val Value to update
   * @param addr Starting Byte of the Memory
   * @param num_bits Number of bits to retrieve
   * @param bit_offset Bit offset within the byte ([0 - 7]: Defaults to 0)
   * @returns Number which is the value at the requested position
   */
  set_bits(val: number, addr: number, num_bits: number, bit_offset = 0) {
    const bits_in_word = this.word_size * bits_in_byte
    if (num_bits > bits_in_word || num_bits < 0)
      throw Error('Invalid number of bits')
    const offset = (addr % this.word_size) * bits_in_byte + bit_offset
    if (offset + num_bits > bits_in_word) throw Error('Exceed word length')
    let block_offset = bit_offset + (addr % bytes_in_int) * bits_in_byte
    let block_idx = Math.floor(addr / bytes_in_int)
    let bits_covered = 0
    while (bits_covered < num_bits) {
      const valid_bits_in_block = Math.min(
        num_bits - bits_covered,
        bytes_in_int * bits_in_byte - block_offset,
      )
      const val_mask =
        ((2 ** valid_bits_in_block - 1) & val) * 2 ** block_offset

      this.array[block_idx] |= val_mask
      this.array[block_idx] &= val_mask

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
   * @param addr Starting byte
   * @param num_of_bytes Number of bytes to modify
   */
  set_bytes(val: number, addr: number, num_of_bytes = 1) {
    this.set_bits(val, addr, bits_in_byte * num_of_bytes)
  }

  /**
   * @param addr Starting byte
   * @param num_of_bytes Number of bytes to retrieve
   */
  get_bytes(addr: number, num_of_bytes = 1) {
    this.get_bits(addr, bits_in_byte * num_of_bytes)
  }

  /**
   * @param val Value to update
   * @param addr Starting byte
   */
  set_word(val: number, addr: number) {
    this.set_bits(val, addr, bits_in_byte * this.word_size)
  }

  /**
   * @param addr Starting byte
   */
  get_word(addr: number) {
    this.get_bits(addr, bits_in_byte * this.word_size)
  }

  /**
   * Print out Heap
   */
  print() {
    let heap_str = ''
    const idx_max_len = this.array.length.toString().length
    for (let i = 0; i < this.array.length; i++) {
      let str = (this.array[i] >>> 0).toString(2)
      if (str.length < bits_in_byte * bytes_in_int) {
        str = '0'.repeat(bits_in_byte * bytes_in_int - str.length) + str
      }
      let idx_str = i.toString()
      if (idx_str.length < idx_max_len) {
        idx_str = ' '.repeat(idx_max_len - idx_str.length) + idx_str
      }

      heap_str += idx_str + ': ' + str + '\n'
    }
    console.log(heap_str)
  }
}
