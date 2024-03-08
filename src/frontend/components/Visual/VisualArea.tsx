import './Moveable.css'

import { useRef, useState } from 'react'
import Moveable from 'react-moveable'
import Selecto from 'react-selecto'
import { Box, Flex } from '@chakra-ui/react'

import styles from './VisualArea.module.css'

export const VisualArea = () => {
  const moveableRef = useRef<Moveable>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedTargets, setSelectedTargets] = useState<
    (HTMLElement | SVGElement)[]
  >([])

  enum VisualizationType {
    Graph = 'graph',
    Array = 'array',
  }
  const [visualizations] = useState<
    {
      key: string
      type: VisualizationType
    }[]
  >([])

  // const eraseVisualization = (key: string) => {
  //   setVisualizations(visualizations.filter((x) => x.key !== key))
  //   setSelectedTargets(selectedTargets.filter((x) => x.dataset.key !== key))
  // }

  // const addVisualization = (type: VisualizationType) => {
  //   setVisualizations([
  //     ...visualizations,
  //     {
  //       key: uuidv4(),
  //       type,
  //     },
  //   ])
  // }

  const boundTranslate = (target: HTMLElement, transform: string) => {
    let [x, y] = transform
      .slice('translate('.length + 1, -2)
      .split(',')
      .map((s) => Number.parseInt(s.trim().slice(0, -2)))
    x = Math.max(x, 0)
    y = Math.max(y, 0)
    if (containerRef.current !== null) {
      x = Math.min(x, containerRef.current.offsetWidth - target.offsetWidth)
      y = Math.min(y, containerRef.current.offsetHeight - target.offsetHeight)
    }
    return `translate(${x}px, ${y}px)`
  }

  return (
    <>
      <Flex direction="column" w="full">
        <Box
          ref={containerRef}
          flexGrow={1}
          position="relative"
          overflow="hidden"
          id="visual-area-container"
          bgColor="gray.50"
        >
          {visualizations.map(({ key, type }) => {
            const isSelected = selectedTargets.some(
              (x) => x.dataset.key === key,
            )
            return (
              <Box
                className={
                  'visual-component ' +
                  styles['visual-component'] +
                  ` ${styles['visual-component-' + type]} ` +
                  (isSelected ? ` ${styles['visual-component-selected']}` : '')
                }
                height={300}
                width={400}
                bgColor="white"
                border="2px solid"
                padding={1}
                borderColor="black.100"
                borderRadius={8}
                key={key}
                data-key={key}
              >
                {
                  // TODO: Visual Stuff
                  <></>
                }
              </Box>
            )
          })}
          <Moveable
            ref={moveableRef}
            target={selectedTargets}
            individualGroupable
            draggable
            onDrag={({ target, transform }) => {
              target.style.transform = boundTranslate(
                target as HTMLElement,
                transform,
              )
            }}
            resizable
            onResize={({ target, width, height, delta, drag }) => {
              target.style.transform = boundTranslate(
                drag.target as HTMLElement,
                drag.transform,
              )
              delta[0] && (target.style.width = `${width}px`)
              delta[1] && (target.style.height = `${height}px`)
            }}
          />
          <Selecto
            dragContainer={'#visual-area-container'}
            selectFromInside={false}
            selectByClick={true}
            selectableTargets={['.visual-component']}
            onDragStart={(event) => {
              event.preventDrag()
              const moveable = moveableRef.current
              if (moveable === null) return
              const target = event.inputEvent.target as HTMLElement
              if (target.tagName.toLowerCase() === 'input') {
                target.focus()
              }
              if (
                moveable.isMoveableElement(target) ||
                selectedTargets.some((t) => t === target || t.contains(target))
              ) {
                event.stop()
              }
              const isChildOfSelectable = (
                element: HTMLElement | null,
              ): boolean => {
                if (element === document.body || element === null) return false
                if (element.classList.contains('visual-component')) return true
                return isChildOfSelectable(element.parentElement)
              }
              if (isChildOfSelectable(target.parentElement)) event.stop()
            }}
            onSelectEnd={(event) => {
              const moveable = moveableRef.current
              if (moveable === null) return
              if (event.isDragStartEnd) {
                event.inputEvent.preventDefault()
                moveable.waitToChangeTarget().then(() => {
                  moveable.dragStart(event.inputEvent)
                })
              }
              setSelectedTargets(event.selected)
            }}
          />
        </Box>
      </Flex>
    </>
  )
}
