import { describe, expect, test } from 'vitest'

import { runCode } from '../src/virtual-machine'

import { mainRunner } from './utility'

describe('Defer Type Checking', () => {
  test('Defer on non call should fail.', () => {
    const code = `
    defer "hello"
    `
    expect(mainRunner(code).errorMessage).toEqual(
      'Expression in defer must be function call.',
    )
  })
})

describe('Defer Execution', () => {
  test('Defer runs in order', () => {
    const code = `
    defer func(){ Println("!!!") }()
    defer func(){ Println("world") }()
    Println("hello")
    `
    expect(mainRunner(code).output).toEqual('hello\nworld\n!!!\n')
  })

  test('Defer with wait groups work', () => {
    const code = `
    package main
    import "sync"
    func main() {
      count := 0
      var wg sync.WaitGroup
      for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
          defer wg.Done()
          count++
        }()
      }
      wg.Wait()
      Println(count)
    }
    `
    expect(runCode(code, 131072).output).toEqual('1000\n')
  })
})
