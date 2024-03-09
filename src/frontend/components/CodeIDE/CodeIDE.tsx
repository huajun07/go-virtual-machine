import { useColorModeValue } from '@chakra-ui/react'
import { go } from '@codemirror/lang-go'
import { zebraStripes } from '@uiw/codemirror-extensions-zebra-stripes'
import { githubDark, githubLight } from '@uiw/codemirror-theme-github'
import CodeMirror from '@uiw/react-codemirror'

interface codeIDEProps {
  code: string
  setCode: (code: string) => void
  lineHighlight?: number
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
          lineNumber: [lineHighlight || 0],
          lightColor: '#aca2ff33',
          darkColor: '#aca2ff40',
        }),
        go(),
      ]}
      onChange={setCode}
      theme={useColorModeValue(githubLight, githubDark)}
    />
  )
}
