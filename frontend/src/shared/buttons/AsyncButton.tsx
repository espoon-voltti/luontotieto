// SPDX-FileCopyrightText: 2017-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { animated, useSpring } from '@react-spring/web'
import React from 'react'
import { colors } from 'shared/theme'
import styled from 'styled-components'

import { Button, ButtonProps } from './Button'
import {
  AsyncButtonBehaviorProps,
  useAsyncButtonBehavior
} from './async-button-behaviour'

const ScreenReaderOnly = styled.div`
  position: absolute;
  left: -10000px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
`

export type AsyncButtonProps<T> = ButtonProps & AsyncButtonBehaviorProps<T>

const AsyncButton_ = function AsyncButton<T>({
  type,
  preventDefault = type === 'submit',
  stopPropagation = false,
  onClick,
  onSuccess,
  onFailure,
  text,
  ...props
}: AsyncButtonProps<T>) {
  const { state, handleClick } = useAsyncButtonBehavior({
    preventDefault,
    stopPropagation,
    onClick,
    onSuccess,
    onFailure
  })

  const showIcon = state !== 'idle'

  const container = useSpring<{ x: number }>({
    x: showIcon ? 1 : 0
  })

  const spinner = useSpring<{ opacity: number }>({
    opacity: state === 'in-progress' ? 1 : 0
  })
  const checkmark = useSpring<{ opacity: number }>({
    opacity: state === 'success' ? 1 : 0
  })
  const cross = useSpring<{ opacity: number }>({
    opacity: state === 'failure' ? 1 : 0
  })

  return (
    <Button
      {...props}
      text={text}
      onClick={(e) => handleClick(e)}
      disabled={props.disabled}
    >
      <>
        {state === 'in-progress' && (
          <ScreenReaderOnly aria-live="polite" id="in-progress">
            Tallennetaan...
          </ScreenReaderOnly>
        )}
        {state === 'failure' && (
          <ScreenReaderOnly aria-live="assertive" id="failure">
            Virhe
          </ScreenReaderOnly>
        )}
        {state === 'success' && (
          <ScreenReaderOnly aria-live="assertive" id="success">
            Tallennettu!
          </ScreenReaderOnly>
        )}

        <IconContainer
          style={{
            width: container.x.to((x) => `${24 * x}px`),
            marginRight: container.x.to((x) => `${8 * x}px`)
          }}
        >
          <Spinner style={spinner} />
          <IconWrapper
            style={{
              opacity: checkmark.opacity,
              transform: checkmark.opacity.to((x) => `scale(${x ?? 0})`)
            }}
          >
            <FontAwesomeIcon icon={faCheck} color="#fff" />
          </IconWrapper>
          <IconWrapper
            style={{
              opacity: cross.opacity,
              transform: cross.opacity.to((x) => `scale(${x ?? 0})`)
            }}
          >
            <FontAwesomeIcon icon={faTimes} color={colors.status.danger} />
          </IconWrapper>
        </IconContainer>
      </>
    </Button>
  )
}

/**
 * An HTML button that triggers an async action when clicked.
 *
 * Loading/success/failure states are indicated with a spinner or a checkmark/cross icon.
 */
export const AsyncButton = React.memo(AsyncButton_) as typeof AsyncButton_

const IconContainer = animated(styled.div`
  position: relative;
  overflow: hidden;
  height: 24px;
  flex: 0 0 auto;
`)

export const Spinner = animated(styled.div`
  position: absolute;
  top: 2px;
  left: 2px;
  display: inline-block;
  border-radius: 50%;
  width: 20px;
  height: 20px;

  border: 2px solid ${colors.grayscale.g15};
  border-left-color: ${colors.main.m2};
  animation: spin 1s infinite linear;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`)

const IconWrapper = animated(styled.div`
  position: absolute;

  svg.svg-inline--fa {
    width: 24px;
    height: 24px;
  }
`)
