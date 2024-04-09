import { describe, expect, test } from 'vitest'

import { runCode } from '../src/virtual-machine'

import { mainRunner } from './utility'

describe('Function Type Checking', () => {
  test('Function assignment', () => {
    expect(
      mainRunner('var a func(int, int) = func(int, int, int) {}').errorMessage,
    ).toEqual(
      'Cannot use func(int64, int64, int64) () as func(int64, int64) () in variable declaration',
    )
  })

  test('Function call - too many arguments', () => {
    expect(
      mainRunner('f := func(int, int) {}; f(1, 2, 3)').errorMessage,
    ).toEqual(
      'Too many arguments in function call\n' +
        'have (int64, int64, int64)\n' +
        'want (int64, int64)',
    )
  })

  test('Function call - too few arguments', () => {
    expect(mainRunner('f := func(int, int) {}; f(1)').errorMessage).toEqual(
      'Not enough arguments in function call\n' +
        'have (int64)\n' +
        'want (int64, int64)',
    )
  })

  test('Function call - incorrect argument type', () => {
    expect(
      mainRunner('f := func(int, int) {}; f(1, "a")').errorMessage,
    ).toEqual('Cannot use string as int64 in argument to function call')
  })

  test('Function missing return', () => {
    expect(mainRunner('f := func(x int) int { x += 1}').errorMessage).toEqual(
      'Missing return.',
    )
  })

  test('Function with if statement missing return in one branch', () => {
    expect(
      mainRunner(
        'f := func(x int) int { if x == 1 { x += 1 } else { return 1 } }',
      ).errorMessage,
    ).toEqual('Missing return.')
  })

  test('Function with wrong return type', () => {
    expect(
      mainRunner(
        'f := func(x int) int { if x == 1 { return "hi" } else { return 1 } }',
      ).errorMessage,
    ).toEqual('Cannot use (string) as (int64) value in return statement.')
  })

  test('Function with too many return values', () => {
    expect(
      mainRunner(
        'f := func(x int) { if x == 1 { return 1 } else { return 1 } }',
      ).errorMessage,
    ).toEqual('Too many return values\nhave (int64)\nwant ()')
  })
})

describe('Function Execution tests', () => {
  test('Function Literals', () => {
    expect(
      mainRunner(
        'f := func(x int, y int) int{\
        return x + y\
      }\
      Println(1 + f(1, 2))',
      ).output,
    ).toEqual('4\n')
  })

  test('Function Declaration', () => {
    expect(
      runCode(
        `package main

        var a int = 1
        
        func f(x, y int) int {
          return x + y + a
        }
        
        func main() {
          f := func(x, y int) int {
            return x + y + 100
          }
          Println(f(1, 2))
        }`,
        2048,
      ).output,
    ).toEqual('103\n')
  })

  test('Function assignment in loop', () => {
    expect(
      runCode(
        `package main
        func main() {
          f := func(x, y int) int {
            return x + y
          }
          for i := 0; i < 5; i++ {
            f = func(x, y int) int {
              return x + y + i
            }
          }
          Println(f(1, 2))
        }`,
        2048,
      ).output,
    ).toEqual('8\n')
  })

  test('Function assignment in loop and if', () => {
    expect(
      runCode(
        `package main
        func main() {
          f := func(x, y int) int {
            return x + y
          }
          for i := 0; i < 100; i++ {
            if i < 50 {
              f = func(x, y int) int {
                return x + y + i
              }
            }
          }
          Println(f(1, 2))
        }`,
        2048,
      ).output,
    ).toEqual('103\n')
  })

  test('Recursive function', () => {
    expect(
      runCode(
        `package main

      func f(x int) int {
        if x == 0 {
          return 0
        }
        return f(x - 1) + 1
      }
      
      func main() {
        Println(f(10))
      }`,
        2048,
      ).output,
    ).toEqual('10\n')
  })

  test('Calling a function twice.', () => {
    expect(mainRunner('f := func(){ Println(1) }; f(); f()').output).toEqual(
      '1\n1\n',
    )
  })
})
