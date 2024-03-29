import { runCode } from 'src/virtual-machine'

/** Runs the code in a main function */
export const mainRunner = (code: string) => {
  return runCode(`package main;\nfunc main() {\n${code}\n}`, 2048)
}
