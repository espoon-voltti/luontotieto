// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import classNames from 'classnames'
import React from 'react'
import styled, { css } from 'styled-components'

import { BaseProps, colors, tabletMin } from '../theme'

export const defaultButtonTextStyle = css`
  color: ${colors.main.m2};
  font-family: 'Open Sans', sans-serif;
  font-size: 1em;
  line-height: normal;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0;
`

const StyledButton = styled.button`
  min-height: 45px;
  padding: 0 24px;
  min-width: 100px;

  display: block;
  text-align: center;
  overflow-x: hidden;

  border: 1px solid ${colors.main.m2};
  border-radius: 4px;
  background: ${colors.grayscale.g0};

  outline: none;
  cursor: pointer;

  &.disabled {
    cursor: not-allowed;
  }

  &:focus {
    outline: 2px solid ${colors.main.m2Focus};
    outline-offset: 2px;
  }

  &:hover {
    color: ${colors.main.m2Hover};
    border-color: ${colors.main.m2Hover};
  }

  &:active {
    color: ${colors.main.m2Active};
    border-color: ${colors.main.m2Active};
  }

  &.disabled {
    color: ${colors.grayscale.g70};
    border-color: ${colors.grayscale.g70};
  }

  &.primary {
    color: ${colors.grayscale.g0};
    background: ${colors.main.m2};

    &:hover {
      background: ${colors.main.m2Hover};
    }

    &:active {
      background: ${colors.main.m2Active};
    }

    &.disabled {
      border-color: ${colors.grayscale.g35};
      background: ${colors.grayscale.g35};
    }
  }

  @media (min-width: ${tabletMin}) {
    width: fit-content;
  }

  ${defaultButtonTextStyle};
  letter-spacing: 0.2px;
`

export interface ButtonProps extends BaseProps {
  text: string
  onClick?: (e: React.MouseEvent) => unknown
  primary?: boolean
  disabled?: boolean
  type?: 'submit' | 'button'
}

export const Button = React.memo(function Button({
  className,
  'data-qa': dataQa,
  onClick,
  primary = false,
  disabled = false,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <StyledButton
      className={classNames(className, { primary, disabled })}
      data-qa={dataQa}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      type={type}
    >
      {props.text}
    </StyledButton>
  )
})
