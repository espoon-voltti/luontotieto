// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import React from 'react'
import styled from 'styled-components'

import { FlexRowWithGaps } from '../layout'
import { BaseProps, colors } from '../theme'

import { defaultButtonTextStyle } from './Button'

const StyledButton = styled.button<{ $selected: boolean }>`
  ${defaultButtonTextStyle};

  width: fit-content;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 0;

  background: none;
  border: none;
  outline: none;
  cursor: pointer;

  .outer-wrapper {
    outline: none;
    border: 2px solid transparent;
    border-radius: 40px;
    padding: 2px;
  }

  &:focus .outer-wrapper {
    border: 2px solid ${colors.main.m2Focus};
  }

  .inner-wrapper {
    outline: none;
    width: fit-content;
    height: 40px !important;
    background: ${(props) => (props.$selected ? colors.main.m2 : 'none')};

    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 4px 12px;

    color: ${(props) => (props.$selected ? 'white' : colors.main.m2)};
    border: 1px solid ${colors.main.m2};
    border-radius: 40px;
    outline: none;
    cursor: pointer;
  }

  &.disabled {
    color: ${colors.grayscale.g70};
    cursor: not-allowed;

    .icon-wrapper {
      background: ${colors.grayscale.g70};
    }
  }

  .icon-wrapper {
    height: 24px !important;
    width: 24px !important;
    display: flex;
    justify-content: center;
    align-items: center;

    font-size: 24px;
    color: ${colors.grayscale.g0};
    background: ${colors.main.m2};
    border-radius: 100%;
  }
`

export interface FilterButtonProps extends BaseProps {
  text: string
  onClick: (selected: boolean) => void
  disabled?: boolean
  selected: boolean
  iconLeft?: boolean
}

export const FilterButton = React.memo(function FilterButton({
  className,
  'data-qa': dataQa,
  text,
  onClick,
  disabled = false,
  selected
}: FilterButtonProps) {
  return (
    <StyledButton
      type="button"
      className={classNames(className, { disabled })}
      data-qa={dataQa}
      onClick={() => !disabled && onClick(selected)}
      disabled={disabled}
      $selected={selected}
    >
      <div className="outer-wrapper">
        <div className="inner-wrapper">
          <FlexRowWithGaps>
            {selected && (
              <div className="icon-wrapper">
                <FontAwesomeIcon icon={faCheck} />
              </div>
            )}

            <span>{text}</span>
          </FlexRowWithGaps>
        </div>
      </div>
    </StyledButton>
  )
})
