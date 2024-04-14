import { useColorModeValue } from '@chakra-ui/react'
import { go } from '@codemirror/lang-go'
import { Prec } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { zebraStripes } from '@uiw/codemirror-extensions-zebra-stripes'
import { githubDark, githubLight } from '@uiw/codemirror-theme-github'
import CodeMirror, { EditorSelection } from '@uiw/react-codemirror'

interface codeIDEProps {
  code: string
  setCode: (code: string) => void
  lineHighlight?: (number | number[])[]
  run: () => void
}

export const CodeIDE = (props: codeIDEProps) => {
  const placeholder = 'Enter your go code here!'
  const { code, setCode, lineHighlight } = props
  return (
    <CodeMirror
      value={code}
      height="calc(100vh - 125px)"
      placeholder={placeholder}
      autoFocus={true}
      width="100%"
      extensions={[
        zebraStripes({
          lineNumber: lineHighlight,
          lightColor: '#aca2ff33',
          darkColor: '#aca2ff40',
        }),
        go(),
        Prec.high(
          keymap.of([
            {
              key: 'Shift-Enter',
              run: () => {
                props.run()
                return true
              },
            },
          ]),
        ),
      ]}
      onChange={setCode}
      theme={useColorModeValue(githubLight, githubDark)}
      selection={EditorSelection.cursor(5)}
    />
  )
}
