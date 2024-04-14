import { createContext, useEffect, useState } from 'react'
import {
  Box,
  Center,
  Flex,
  Image,
  keyframes,
  useInterval,
  useToast,
} from '@chakra-ui/react'
import Cookies from 'js-cookie'

import { runCode } from '../../virtual-machine'
import { CompileError } from '../../virtual-machine/compiler'
import {
  CodeIDE,
  CodeIDEButtons,
  ControlBar,
  IO,
  VisualArea,
} from '../components'
import { useExecutionStore } from '../stores'

export const LoaderContext = createContext<
  React.Dispatch<React.SetStateAction<boolean>> | undefined
>(undefined)

const COOKIE_NAME = 'code_value'

export const Main = () => {
  const { setVisualData, currentStep, setStep, data, setOutput } =
    useExecutionStore((state) => ({
      data: state.data,
      setVisualData: state.setVisualData,
      currentStep: state.currentStep,
      setStep: state.setStep,
      setOutput: state.setOutput,
    }))
  const [isPlaying, setPlaying] = useState(false)
  const [wasPlaying, setWasPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [heapsize, setHeapsize] = useState(2048)
  const [visualMode, setVisualMode] = useState(false)

  useEffect(() => {
    // Get the value from the cookie
    const oldCode = Cookies.get(COOKIE_NAME)
    // Update state if the cookie exists
    if (oldCode) {
      try {
        setCode(atob(oldCode))
      } catch (_err) {
        Cookies.remove(COOKIE_NAME)
      }
    }
  }, [])

  const modifyCode = (code: string) => {
    Cookies.set(COOKIE_NAME, btoa(code))
    setCode(code)
    resetErrors()
  }

  const toast = useToast()
  const makeToast = (
    msg: string | undefined,
    title = 'An Error Has Occured!',
  ) => {
    toast({
      title,
      description: msg,
      status: 'error',
      duration: 2000,
      isClosable: true,
      containerStyle: {
        whiteSpace: 'pre-line',
      },
    })
  }

  /**
   * Interval hook to increment the step counter while the execution is playing
   */
  useInterval(
    () => {
      // sanity check
      if (currentStep >= 0 && currentStep + 1 < data.length) {
        setStep(currentStep + 1)
      }
      if (currentStep >= data.length - 1) {
        // End of execution
        setPlaying(false)
      }
    },
    isPlaying ? Math.ceil(1000 / speed) : null,
  )

  const moveStep = (forward: boolean) => {
    const newStep = Math.min(
      data.length,
      Math.max(0, (forward ? 1 : -1) * speed + currentStep),
    )
    setStep(newStep)
    if (newStep >= data.length) {
      setPlaying(false)
    }
  }

  const [lineHighlight, setLineHighlight] = useState<(number | number[])[]>([0])

  const resetErrors = () => {
    setLineHighlight([0])
  }

  const startRunning = async () => {
    // Start playing
    setLoading(true)
    if (code === '') {
      setLoading(false)
      makeToast('Code cannot be empty!')
      return
    }
    // Retrieve instructions from endpoint
    setOutput('Running your code...')
    const {
      error,
      output: newOutput,
      visualData,
    } = runCode(code, heapsize, visualMode)
    if (error) {
      const errorTitle = {
        parse: 'Syntax Error',
        compile: 'Compile Error',
        runtime: 'Runtime Error',
      }[error.type]
      setLoading(false)
      makeToast(error.message, errorTitle)

      if (error.type === 'compile') {
        // Highlight compile error in source code.
        const details = error.details as CompileError
        const startLine = details.sourceLocation.start.line
        let endLine = details.sourceLocation.end.line
        if (details.sourceLocation.end.column === 1) {
          // When parsing, the token's end location may spill into the next line.
          // If so, then we should ignore the last line.
          endLine--
        }
        setLineHighlight([[startLine, endLine]])
      }
    } else {
      resetErrors()
    }

    // Set instructions and update components to start playing mode
    setVisualData(visualData)
    if (visualData.length === 0) setOutput(newOutput || '')
    setPlaying(true)
    setWasPlaying(false)
    setTimeout(function () {
      setLoading(false)
    }, 500)
  }

  const spin = keyframes`  
    from {transform: rotate(0deg);}   
    to {transform: rotate(360deg)} 
  `

  return (
    <LoaderContext.Provider value={setLoading}>
      {loading ? (
        <Center
          position="absolute"
          h="100%"
          w="100%"
          bg="rgba(0, 0, 0, .5)"
          zIndex={3000}
        >
          <Image
            src="gopher.png"
            width="150px"
            animation={`${spin} infinite 0.5s linear`}
          />
        </Center>
      ) : null}
      <Flex>
        <Box minWidth="500px" w="30%" borderRightWidth="1px">
          <CodeIDEButtons
            toggleMode={startRunning}
            isDisabled={loading}
            heapsize={heapsize}
            setHeapsize={setHeapsize}
          />
          <CodeIDE
            code={code}
            setCode={modifyCode}
            lineHighlight={lineHighlight}
            run={startRunning}
          />
        </Box>
        <Flex position="relative" flex={1}>
          <Flex borderRightWidth="1px" flexDirection="column" w="100%">
            <IO />
            <Flex flex={1} flexDirection="column" w="100%">
              <Flex flex={1}>
                <VisualArea />
              </Flex>
              <Box>
                <ControlBar
                  length={data.length - 1}
                  playing={isPlaying}
                  curSpeed={speed}
                  setSpeed={setSpeed}
                  togglePlaying={() => {
                    if (isPlaying || currentStep < data.length)
                      setPlaying(!isPlaying)
                  }}
                  disabled={data.length === 0}
                  wasPlaying={wasPlaying}
                  setWasPlaying={setWasPlaying}
                  moveStep={moveStep}
                  toggleVisual={() => {
                    setVisualMode(!visualMode)
                  }}
                  visual={visualMode}
                />
              </Box>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </LoaderContext.Provider>
  )
}
