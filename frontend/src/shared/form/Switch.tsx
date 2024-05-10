// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import classNames from 'classnames'
import React, { ReactNode, useRef } from 'react'
import styled from 'styled-components'

const Container = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;

    label {
      color: ${(p) => p.theme.colors.grayscale.g35};
      cursor: not-allowed;
    }
  }
`

const StyledSwitch = styled.div`
  position: relative;
  width: 64px;
  height: 32px;
  background: #b3b3b3;
  border-radius: 32px;
  padding: 4px;
  transition: 300ms all;

  &:before {
    transition: 300ms all;
    content: '';
    position: absolute;
    width: 28px;
    height: 26px;
    border-radius: 35px;
    top: 50%;
    left: 4px;
    background: white;
    transform: translate(0, -50%);
  }
`

const Input = styled.input`
  display: none;

  &:checked + ${StyledSwitch} {
    border-color: ${(p) => p.theme.colors.main.m2};
    background-color: ${(p) => p.theme.colors.main.m2};

    &:before {
      transform: translate(28px, -50%);
    }
  }
`

type SwitchProps = {
  checked: boolean
  onChange?: () => void
  disabled?: boolean
  id?: string
} & ({ label: string } | { label: ReactNode; ariaLabel: string })

export default React.memo(function Switch({
  checked,
  onChange,
  disabled,
  id,
  label
}: SwitchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Container className={classNames({ disabled })}>
      {label}
      <Input
        id={id}
        checked={checked}
        type="checkbox"
        onChange={(e) => {
          e.stopPropagation()
          if (onChange) onChange()
        }}
        disabled={disabled}
        readOnly={!onChange}
        ref={inputRef}
      />
      <StyledSwitch />
    </Container>
  )
})
