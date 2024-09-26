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

  display: flex;
  justify-content: center;
  align-items: center;

  border: 1px solid ${colors.main.m2};
  border-radius: 4px;
  background: ${colors.grayscale.g0};
  background: #fff;

  outline: none;
  cursor: pointer;

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
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

  &.primary {
    color: ${colors.grayscale.g0};
    background: ${colors.main.m2};

    &:hover {
      background: ${colors.main.m2Hover};
    }

    &:active {
      background: ${colors.main.m2Active};
    }
  }
  &.danger {
    color: ${colors.status.danger};
    border: 1px solid ${colors.status.danger};
    background: ${colors.grayscale.g0};

    &:hover {
      background: ${colors.grayscale.g0};
    }

    &:active {
      background: ${colors.grayscale.g0};
    }
  }

  @media (min-width: ${tabletMin}) {
    width: fit-content;
  }

  ${defaultButtonTextStyle};
  letter-spacing: 0.2px;
`

export interface ButtonProps extends BaseProps {
  children?: React.ReactNode
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
  children,
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
      {children}
      {props.text}
    </StyledButton>
  )
})
