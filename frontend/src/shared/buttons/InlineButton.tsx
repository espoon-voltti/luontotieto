// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import React from 'react'
import styled from 'styled-components'

import { BaseProps, colors } from '../theme'

import { defaultButtonTextStyle } from './Button'

const StyledButton = styled.button<{ $color?: string; $iconRight?: boolean }>`
  width: fit-content;
  display: inline-flex;
  align-items: center;

  border: none;
  padding: 0;
  border-radius: 4px;
  background: none;

  outline: none;
  cursor: pointer;

  &:hover {
    color: ${colors.main.m2Hover};
  }

  &:active {
    color: ${colors.main.m2Active};
  }

  &:focus {
    outline: 2px solid ${colors.main.m2Focus};
    outline-offset: 2px;
  }

  &.disabled {
    color: ${colors.grayscale.g70};
    cursor: not-allowed;
  }

  svg {
    ${({ $iconRight }) => ($iconRight ? 'margin-left' : 'margin-right')}: 8px;
    font-size: 1.25em;
  }

  ${defaultButtonTextStyle};
  color: ${(p) => p.color ?? colors.main.m2};
`

export interface InlineButtonProps extends BaseProps {
  onClick: () => unknown
  text: string
  color?: string
  disabled?: boolean
  icon?: IconDefinition
  iconRight?: boolean
}

export const InlineButton = React.memo(function InlineButton({
  className,
  'data-qa': dataQa,
  onClick,
  text,
  icon,
  disabled = false,
  color,
  iconRight
}: InlineButtonProps) {
  return (
    <StyledButton
      className={classNames(className, { disabled })}
      data-qa={dataQa}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      color={color}
      type="button"
      $iconRight={iconRight}
    >
      {icon && !iconRight && <FontAwesomeIcon icon={icon} />}
      <span>{text}</span>
      {icon && iconRight && <FontAwesomeIcon icon={icon} />}
    </StyledButton>
  )
})
