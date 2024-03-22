// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import React, { ReactNode, useRef } from 'react'
import styled from 'styled-components'

import { BaseProps, colors } from '../theme'
import { useUniqueId } from '../useUniqueId'

const diameter = '30px'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  width: fit-content;

  &.disabled {
    cursor: not-allowed;

    label {
      color: ${colors.grayscale.g35};
      cursor: not-allowed;
    }
  }

  @media (hover: hover) {
    &:hover:not(.disabled) {
      input:checked {
        border-color: ${colors.main.m2Hover};
        background-color: ${colors.main.m2Hover};
      }

      input:not(:checked) {
        border-color: ${colors.grayscale.g100};
      }
    }
  }
`

const LabelContainer = styled.div`
  font-size: 1rem;
  margin-left: 16px;
`

const Box = styled.div`
  position: relative;
  width: ${diameter};
  height: ${diameter};
`

const CheckboxInput = styled.input`
  outline: none;
  appearance: none;
  width: ${diameter};
  height: ${diameter};
  border-radius: 2px;
  border-width: 1px;
  border-style: solid;
  border-color: ${colors.grayscale.g70};
  margin: 0;

  background-color: ${colors.grayscale.g0};

  &:checked {
    border-color: ${colors.main.m2};
    background-color: ${colors.main.m2};

    &:disabled {
      background-color: ${colors.grayscale.g35};
    }
  }

  &:focus {
    box-shadow:
      0 0 0 2px ${colors.grayscale.g0},
      0 0 0 4px ${colors.main.m2Focus};
  }

  &:disabled {
    border-color: ${colors.grayscale.g35};
  }
`

const IconWrapper = styled.div`
  position: absolute;
  left: 0;
  top: 0;

  display: flex;
  justify-content: center;
  align-items: center;
  width: ${diameter};
  height: ${diameter};

  font-size: 25px;
  color: ${colors.grayscale.g0};

  pointer-events: none; // let click event go through icon to the checkbox
`

interface CommonProps extends BaseProps {
  checked: boolean
}

export const StaticCheckBox = React.memo(function StaticCheckBox({
  checked
}: CommonProps) {
  return (
    <Box>
      <CheckboxInput type="checkbox" checked={checked} readOnly={true} />
      <IconWrapper>{checked && <FontAwesomeIcon icon={faCheck} />}</IconWrapper>
    </Box>
  )
})

export interface CheckboxProps extends CommonProps {
  label: ReactNode
  hiddenLabel?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
}

export const Checkbox = React.memo(function Checkbox({
  checked,
  label,
  hiddenLabel,
  onChange,
  disabled,
  className,
  'data-qa': dataQa
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const ariaId = useUniqueId()

  return (
    <Wrapper className={classNames(className, { disabled })} data-qa={dataQa}>
      <Box>
        <CheckboxInput
          type="checkbox"
          checked={checked}
          data-qa={dataQa ? `${dataQa}-input` : undefined}
          id={ariaId}
          disabled={disabled}
          onChange={(e) => {
            e.stopPropagation()
            if (onChange) onChange(e.target.checked)
          }}
          readOnly={!onChange}
          ref={inputRef}
        />
        <IconWrapper>
          <FontAwesomeIcon icon={faCheck} />
        </IconWrapper>
      </Box>
      {!hiddenLabel && (
        <LabelContainer>
          <label htmlFor={ariaId}>{label}</label>
        </LabelContainer>
      )}
    </Wrapper>
  )
})
