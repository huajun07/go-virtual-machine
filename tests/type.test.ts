import { assert, describe, expect, test } from 'vitest'

import { runCode } from '../src/virtual-machine'

// This file contains tests for type checking.

/** Runs the code in a main function */
const mainRunner = (code: string) => {
  return runCode(`package main;\nfunc main() {\n${code}\n}`, 2048)
}

describe('Assignment Type Checking', () => {
  test('Declaration', () => {
    expect(mainRunner('var a int = 1.0').errorMessage).toEqual(
      'Cannot use float64 as int64 in variable declaration',
    )
  })

  test('Short variable declaration', () => {
    expect(mainRunner('a := 1; var b string = a').errorMessage).toEqual(
      'Cannot use int64 as string in variable declaration',
    )
  })

  test('Assigment', () => {
    expect(mainRunner('a := "hi"; a = 2').errorMessage).toEqual(
      'Cannot use int64 as string in assignment',
    )
  })
})

describe('Binary Operator Type Checking', () => {
  test('Add assign', () => {
    expect(mainRunner('a := "hi"; a = 2 * "xyz"').errorMessage).toEqual(
      'Invalid operation (mismatched types int64 and string)',
    )
  })

  test('Binary multiplication', () => {
    expect(mainRunner('a := 1 * 1.0').errorMessage).toEqual(
      'Invalid operation (mismatched types int64 and float64)',
    )
  })
})

describe('Miscellaneous Type Checking', () => {
  test('Variable shadowing', () => {
    expect(mainRunner('a := 1; { a := 2.0; a = 1 }').errorMessage).toEqual(
      'Cannot use int64 as float64 in assignment',
    )
  })
})
