import { describe, expect, test } from 'vitest'

import { runCode } from '../src/virtual-machine'

describe('Basic Expression Tests', () => {
  test('Basic Arithmetic 1', () => {
    expect(
      runCode(
        'package main;import "fmt"; func main() { 5 * -1 + 3 * 4 / 2 + 3;};',
        256,
      ).output,
    ).toEqual('4')
  })
  test('Basic Arithmetic 2', () => {
    expect(
      runCode(
        'package main;import "fmt"; func main() { (4+3)*5%(5+3)+2;};',
        256,
      ).output,
    ).toEqual('5')
  })
  test('Boolean Expression', () => {
    expect(
      runCode(
        'package main;import "fmt"; func main() { (2+1 < 3) || (7 == 9%5 + 15/5);};',
        256,
      ).output,
    ).toEqual('true')
  })
})
