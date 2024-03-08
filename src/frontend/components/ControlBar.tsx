import { FaBackward, FaForward, FaPause, FaPlay } from 'react-icons/fa'
import {
  Box,
  Flex,
  IconButton,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Spacer,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { useExecutionStore } from 'frontend/stores'
import { shallow } from 'zustand/shallow'

interface ControlBarProps {
  playing: boolean
  length: number
  curSpeed: number
  disabled: boolean
  wasPlaying: boolean
  setSpeed: (speed: number) => void
  togglePlaying: () => void
  setWasPlaying: (newVal: boolean) => void
  moveStep: (forward: boolean) => void
}

export const ControlBar = (props: ControlBarProps) => {
  const { currentStep, setStep } = useExecutionStore(
    (state) => ({
      currentStep: state.currentStep,
      setStep: state.setStep,
    }),
    shallow,
  )
  const buttonColor = useColorModeValue('#3182ce', '#90cdf4')
  return (
    <>
      <Flex flexDirection="column">
        <Box px="15px" paddingTop="10px">
          <Slider
            value={currentStep}
            min={0}
            max={props.length}
            step={1}
            size="lg"
            focusThumbOnChange={false}
            isDisabled={props.disabled}
            onChange={setStep}
            onChangeStart={
              props.playing
                ? () => {
                    props.setWasPlaying(true)
                    props.togglePlaying()
                  }
                : void 0
            }
            onChangeEnd={
              props.wasPlaying
                ? () => {
                    props.setWasPlaying(false)
                    props.togglePlaying()
                  }
                : void 0
            }
          >
            <SliderTrack>
              <Box position="relative" right={10} />
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={4} />
          </Slider>
        </Box>
        <Flex>
          <Stack direction="row" align="center" px="10px">
            <Text> Speed</Text>
            <NumberInput
              maxW="80px"
              mr="2rem"
              value={props.curSpeed}
              onChange={(v) => props.setSpeed(Number(v))}
              min={1}
              max={1000}
              isDisabled={props.disabled}
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Stack>
          <Spacer />
          <Stack direction="row" align="center">
            <IconButton
              isRound={true}
              background="none"
              size="lg"
              aria-label="Rewind"
              isDisabled={props.disabled}
              icon={<FaBackward color={buttonColor} />}
              onClick={() => props.moveStep(false)}
            />
            <IconButton
              isRound={true}
              background="none"
              size="lg"
              aria-label="Play/Pause"
              isDisabled={props.disabled || currentStep === props.length}
              icon={
                props.playing ? (
                  <FaPause color={buttonColor} />
                ) : (
                  <FaPlay color={buttonColor} />
                )
              }
              onClick={props.togglePlaying}
            />
            <IconButton
              isRound={true}
              background="none"
              size="lg"
              aria-label="Forward"
              isDisabled={props.disabled}
              icon={<FaForward color={buttonColor} />}
              onClick={() => props.moveStep(true)}
            />
          </Stack>
          <Spacer />
          <Stack direction="row" align="center" px="10px">
            <Text> Step</Text>
            <NumberInput
              maxW="80px"
              mr="2rem"
              value={currentStep}
              min={0}
              max={props.length}
              isDisabled={props.disabled}
              onChange={(v) => setStep(Number(v))}
              aria-label="Step"
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
          </Stack>
        </Flex>
      </Flex>
    </>
  )
}
