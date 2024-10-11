// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faInfo } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import styled from 'styled-components'

import { colors } from '../theme'

export interface InfoButtonProps {
  onClick: () => void
}

export const InfoButton = React.memo(function InfoButton({
  onClick
}: InfoButtonProps) {
  return (
    <StyledIconButton onClick={onClick}>
      <StyledIconContainer $color={colors.main.m1}>
        <FontAwesomeIcon
          icon={faInfo}
          size="1x"
          color={colors.main.m1}
          inverse
        />
      </StyledIconContainer>
    </StyledIconButton>
  )
})

const StyledIconContainer = styled.div<{ $color: string }>`
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  min-width: 24px;
  height: 24px;
  background: ${(props) => props.$color};
  border-radius: 100%;
`
const StyledIconButton = styled.button`
  margin-left: 16px;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  &:focus {
    outline: 2px solid ${colors.main.m3};
  }
`
