import { createContext, useEffect, useState } from 'react'
import {
  Box,
  Center,
  Flex,
  Spinner,
  useInterval,
  useToast,
} from '@chakra-ui/react'
import {
  CodeIDE,
  CodeIDEButtons,
  ControlBar,
  IO,
  VisualArea,
} from 'frontend/components'
import Cookies from 'js-cookie'

import { runCode } from '../../virtual-machine'
import { useExecutionStore } from '../stores'

export const LoaderContext = createContext<
  React.Dispatch<React.SetStateAction<boolean>> | undefined
>(undefined)

const COOKIE_NAME = 'code_value'

export const Main = () => {
  const { instructions, setInstructions, currentStep, setStep } =
    useExecutionStore((state) => ({
      instructions: state.instructions,
      setInstructions: state.setInstructions,
      currentStep: state.currentStep,
      setStep: state.setStep,
    }))
  const [editing, setEditing] = useState(true)
  const [isPlaying, setPlaying] = useState(false)
  const [wasPlaying, setWasPlaying] = useState(false)
  const [speed, setSpeed] = useState<number>(1)
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<string | null>(null)
  const [code, setCode] = useState('')

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
  }

  const toast = useToast()
  const makeToast = (msg: string | undefined) => {
    toast({
      title: 'An Error Has Occured',
      description: msg,
      status: 'error',
      duration: 2000,
      isClosable: true,
    })
  }

  /**
   * Interval hook to increment the step counter while the execution is playing
   */
  useInterval(
    () => {
      // sanity check
      if (currentStep >= 0 && currentStep < instructions.length) {
        setStep(currentStep + 1)
      }
      if (currentStep >= instructions.length - 1) {
        // End of execution
        setPlaying(false)
      }
      setLoading(false)
    },
    isPlaying ? Math.ceil(1000 / speed) : null,
  )

  const moveStep = (forward: boolean) => {
    const newStep = Math.min(
      instructions.length,
      Math.max(0, (forward ? 1 : -1) * speed + currentStep),
    )
    setStep(newStep)
    if (newStep >= instructions.length) {
      setPlaying(false)
    }
  }

  const toggleEditing = async () => {
    if (editing) {
      // Start playing
      setLoading(true)
      if (code === '') {
        setLoading(false)
        makeToast('Code cannot be empty!')
        return
      }
      // Retrieve instructions from endpoint
      const {
        instructions: newInstructions,
        errorMessage,
        output: newOutput,
      } = await runCode(code)
      if (!newInstructions || errorMessage) {
        setLoading(false)
        makeToast(errorMessage)
        return
      }

      // Set instructions and update components to start playing mode
      setInstructions(newInstructions)
      setOutput(newOutput || '')
      setPlaying(true)
      setWasPlaying(false)
    } else {
      // Stop playing
      setPlaying(false)
    }
    setEditing(!editing)
  }

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
          <Spinner
            thickness="10px"
            speed="0.65s"
            emptyColor="gray.200"
            color="blue.500"
            h="calc(20vh)"
            w="calc(20vh)"
            opacity={1}
          />
        </Center>
      ) : null}
      <Flex>
        <Box w="50%" borderRightWidth="1px">
          <CodeIDEButtons
            editing={editing}
            toggleMode={toggleEditing}
            isDisabled={loading}
          />
          <CodeIDE
            code={code}
            setCode={modifyCode}
            editable={editing}
            lineHighlight={0}
          />
        </Box>
        <Flex position="relative" flex={1}>
          <Flex borderRightWidth="1px" flexDirection="column" w="100%">
            <IO output={output} />
            <Flex flex={1} flexDirection="column" w="100%">
              <Flex flex={1}>
                <VisualArea />
              </Flex>
              <Box>
                <ControlBar
                  length={instructions.length}
                  playing={isPlaying}
                  curSpeed={speed}
                  setSpeed={setSpeed}
                  togglePlaying={() => {
                    if (isPlaying || currentStep < instructions.length)
                      setPlaying(!isPlaying)
                  }}
                  disabled={editing}
                  wasPlaying={wasPlaying}
                  setWasPlaying={setWasPlaying}
                  moveStep={moveStep}
                />
              </Box>
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </LoaderContext.Provider>
  )
}
