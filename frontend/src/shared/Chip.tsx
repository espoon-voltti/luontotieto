// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import { readableColor } from 'polished'
import React, { useCallback } from 'react'
import styled from 'styled-components'

import { colors, tabletMin } from './theme'

export const StaticChip = styled.div<{
  $color: string
  $textColor?: string
  $fitContent?: boolean
}>`
  display: inline-block;
  font-family: 'Open Sans', sans-serif;
  font-weight: 600;
  font-size: 16px;
  line-height: 16px;
  user-select: none;
  border: 1px solid ${(p) => p.$color};
  border-radius: 1000px;
  background-color: ${(p) => p.$color};
  color: ${(p) =>
    p.$textColor ??
    readableColor(p.$color, colors.grayscale.g0, colors.grayscale.g100)};
  padding: 4px 12px;

  outline: none;
  &:focus {
    outline: 2px solid ${colors.main.m3};
    outline-offset: 2px;
  }
  ${(p) => (p.$fitContent ? 'width: fit-content;' : '')}
`

interface SelectionChipProps {
  text: string
  selected: boolean
  onChange: (selected: boolean) => void
  disabled?: boolean
  'data-qa'?: string
  showIcon?: boolean
}

export const SelectionChip = React.memo(function SelectionChip({
  text,
  selected,
  onChange,
  disabled,
  'data-qa': dataQa,
  showIcon = true
}: SelectionChipProps) {
  const onClick = useCallback(
    (e: React.UIEvent<HTMLElement>) => {
      e.preventDefault()
      onChange(!selected)
    },
    [onChange, selected]
  )

  return (
    <SelectionChipWrapper
      role="checkbox"
      aria-label={text}
      aria-checked={selected}
      onClick={(e) => (!disabled ? onClick(e) : undefined)}
      onKeyUp={(ev) => ev.key === 'Enter' && onClick(ev)}
      data-qa={dataQa}
      tabIndex={0}
    >
      <SelectionChipInnerWrapper
        className={classNames({ checked: selected, disabled })}
      >
        {showIcon && selected && (
          <IconWrapper>
            <FontAwesomeIcon icon={faCheck} />
          </IconWrapper>
        )}
        <StyledLabel
          className={classNames({ checked: showIcon && selected, disabled })}
          aria-hidden="true"
        >
          {text}
        </StyledLabel>
      </SelectionChipInnerWrapper>
    </SelectionChipWrapper>
  )
})

const StyledLabel = styled.label`
  cursor: pointer;
  &.disabled {
    cursor: not-allowed;
  }
`

const SelectionChipWrapper = styled.div`
  font-family: 'Open Sans', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 18px;
  user-select: none;
  border-radius: 1000px;
  cursor: pointer;
  outline: none;
  border: 2px solid transparent;

  &:focus,
  &:focus-within {
    border-color: ${colors.main.m1};
  }

  padding: 2px;
`

const SelectionChipInnerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border-radius: 1000px;
  padding: 0 12px;
  background-color: ${colors.grayscale.g0};
  color: ${colors.main.m2};
  border: 1px solid ${colors.main.m2};
  min-height: 36px;
  &.checked {
    background-color: ${colors.main.m2};
    color: ${colors.grayscale.g0};
  }
  &.disabled {
    background-color: ${colors.grayscale.g4};
    color: ${colors.grayscale.g70};
    border: 1px solid ${colors.grayscale.g35};
  }

  @media (max-width: ${tabletMin}) {
    height: 40px;
  }
`

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 8px;

  font-size: 24px;
  color: ${colors.grayscale.g0};
`
