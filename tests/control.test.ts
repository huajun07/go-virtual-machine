import { describe, expect, test } from 'vitest'

import { mainRunner } from './utility'

describe('Variable Declaration Tests', () => {
  test('If statement', () => {
    expect(
      mainRunner(
        'i:= 4\
        a:= 1337\
        if i:= 3; i == 4 {\
          a += i\
        } else {\
          a += -i\
        }\
        return a',
      ).output,
    ).toEqual('1334')
  })
  test('For loop', () => {
    expect(
      mainRunner(
        'a := 0;\
        for i:= 0; i < 5; i++ {\
          a += i\
          i := 3\
          a += i\
        }\
        return a;',
      ).output,
    ).toEqual('25')
  })
  test('For loop continue', () => {
    expect(
      mainRunner(
        'a := 0;\
        for i:= 0; i < 5; i++ {\
          if (i == 3) {\
            continue\
          }\
          a += i\
          i := 3\
          a += i\
        }\
        return a;',
      ).output,
    ).toEqual('19')
  })
  test('For loop break', () => {
    expect(
      mainRunner(
        'a := 0;\
        for i:= 0; i < 5; i++ {\
          if (i == 3) {\
            break\
          }\
          a += i\
          i := 3\
          a += i\
        }\
        return a;',
      ).output,
    ).toEqual('12')
  })
})