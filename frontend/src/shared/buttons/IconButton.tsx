// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import React from 'react'
import styled from 'styled-components'

import { BaseProps, colors, IconSize } from '../theme'

interface StyledButtonProps {
  $size: IconSize
  $color?: string
}

const StyledButton = styled.button<StyledButtonProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  width: calc(
    12px +
      ${(props: StyledButtonProps) => {
        switch (props.$size) {
          case 's':
            return '20px'
          case 'm':
            return '24px'
          case 'L':
            return '34px'
          case 'XL':
            return '64px'
        }
      }}
  );
  height: calc(
    12px +
      ${(props: StyledButtonProps) => {
        switch (props.$size) {
          case 's':
            return '20px'
          case 'm':
            return '24px'
          case 'L':
            return '34px'
          case 'XL':
            return '64px'
        }
      }}
  );
  font-size: ${(props: StyledButtonProps) => {
    switch (props.$size) {
      case 's':
        return '20px'
      case 'm':
        return '24px'
      case 'L':
        return '34px'
      case 'XL':
        return '64px'
    }
  }};
  color: ${(p) => (p.$color ? p.$color : colors.main.m2)};
  border: none;
  border-radius: 100%;
  background: none;
  outline: none;
  cursor: pointer;
  padding: 0;
  margin: -6px;
  -webkit-tap-highlight-color: transparent;

  &:focus {
    box-shadow: 0 0 0 2px ${colors.main.m2Focus};
  }

  .icon-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 2px;
  }

  &:hover .icon-wrapper {
    color: ${(p) => (p.$color ? p.$color : colors.main.m2Hover)};
  }

  &:active .icon-wrapper {
    color: ${(p) => (p.$color ? p.$color : colors.main.m2Active)};
  }

  &.disabled,
  &:disabled {
    cursor: not-allowed;

    .icon-wrapper {
      color: ${colors.grayscale.g35};
    }
  }
`

export interface IconButtonProps extends BaseProps {
  icon: IconDefinition
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  'aria-label': string
  size?: IconSize
  color?: string
}

export const IconButton = React.memo(function IconButton({
  disabled,
  icon,
  size = 's',
  color,
  onClick,
  ...props
}: IconButtonProps) {
  return (
    <div>
      <StyledButton
        type="button"
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        className={classNames(props.className, { disabled })}
        $size={size}
        $color={color}
        {...props}
      >
        <div className="icon-wrapper">
          <FontAwesomeIcon icon={icon} />
        </div>
      </StyledButton>
    </div>
  )
})
