import { describe, expect, test } from 'vitest'

import { mainRunner } from './utility'

describe('Slice Type Checking', () => {
  test('Slice literal must have the same type as the declared type.', () => {
    expect(
      mainRunner('var a []int = []int{1, "wrong type", 3}').errorMessage,
    ).toEqual('Cannot use string as int64 value in slice literal.')
  })

  test('Slice indexing with non integer type should fail.', () => {
    expect(
      mainRunner('var a []int = []int{1, 2, 3}; Println(a[1.2])').errorMessage,
    ).toEqual('Invalid argument: Index has type float64 but must be an integer')
  })

  test('Slice len with too little arguments fails', () => {
    expect(
      mainRunner('a := []int{1, 2, 3, 4}; Println(len())').errorMessage,
    ).toEqual(
      'Invalid operation: not enough arguments for len (expected 1, found 0)',
    )
  })

  test('Slice len with too many arguments fails', () => {
    expect(
      mainRunner('a := []int{1, 2, 3, 4}; Println(len(a, a))').errorMessage,
    ).toEqual(
      'Invalid operation: too many arguments for len (expected 1, found 2)',
    )
  })

  test('Slice len with wrong type', () => {
    expect(
      mainRunner('a := []int{1, 2, 3, 4}; Println(len(1))').errorMessage,
    ).toEqual('Invalid argument: (int64) for len')
  })

  test('Slicing invalid types should fail.', () => {
    expect(mainRunner('a := 1; b := a[:]').errorMessage).toEqual(
      'Invalid operation: Cannot slice int64',
    )
  })
})

describe('Slice Execution', () => {
  test('Slice indexing with valid index works.', () => {
    expect(
      mainRunner('var a []string = []string{"a", "b", "c"}\n Println(a[2])')
        .output,
    ).toEqual('c\n')
  })

  test('Slice indexing with negative index fails.', () => {
    expect(
      mainRunner('var a []string = []string{"a", "b", "c"}\n Println(a[-1])')
        .errorMessage,
    ).toEqual('Index out of range [-1] with length 3')
  })

  test('Slice indexing with out of range index fails.', () => {
    expect(
      mainRunner('var a []string = []string{"a", "b", "c"}\n Println(a[3])')
        .errorMessage,
    ).toEqual('Index out of range [3] with length 3')
  })

  test('Nested slices work.', () => {
    expect(
      mainRunner(
        'a := [][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}; Println(a[1][2])',
      ).output,
    ).toEqual('6\n')
  })

  test('Slice len works.', () => {
    expect(
      mainRunner('a := [][]int{{1}, {2}, {3}}; Println(len(a))').output,
    ).toEqual('3\n')
  })

  test('Slice capacity works.', () => {
    expect(
      mainRunner('a := [][]int{{1}, {2}, {3}}; Println(cap(a))').output,
    ).toEqual('3\n')
  })

  test('Slicing works.', () => {
    expect(
      mainRunner(`a := [4]int{0, 1, 2, 3}
      b := a[:]
      Println(b)
      b = b[2:]
      Println(b)
      c := b[1:]
      Println(c)
      c = c[1:]
      Println(c)`).output,
    ).toEqual('[0 1 2 3]\n[2 3]\n[3]\n[]\n')
  })

  test('Slicing with out of bounds range should error.', () => {
    expect(
      mainRunner(`a := [4]int{0, 1, 2, 3}
      b := a[4:5]`).errorMessage,
    ).toEqual('Slice bounds out of range')
  })
})