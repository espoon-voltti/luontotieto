// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import styled from 'styled-components'

import { ITheme, colors } from './theme'

interface ThProps {
  sticky?: boolean
  stickyColumn?: boolean
  top?: string
  hidden?: boolean
  align?: 'left' | 'right' | 'center'
  minimalWidth?: boolean
  theme: ITheme
}

export const Th = styled.th<ThProps>`
  font-size: 14px;
  color: ${(p) => p.theme.colors.grayscale.g70};
  font-weight: 700;
  line-height: 1.3em;
  text-transform: uppercase;
  vertical-align: top;
  border-style: solid;
  border-color: ${(p) => p.theme.colors.grayscale.g15};
  border-width: 0 0 1px;
  padding-left: 12px;
  text-align: ${({ align }) => align ?? 'left'};
  position: ${(p) => (p.sticky ? 'sticky' : 'static')};
  top: ${(p) => (p.sticky && p.top ? p.top : 'auto')};
  background: ${(p) => (p.sticky ? p.theme.colors.grayscale.g0 : 'none')};
  ${(p) =>
    p.minimalWidth
      ? `
            width: 0;
            white-space: nowrap;
          `
      : ''}
  ${(p) =>
    p.stickyColumn
      ? `
            left: 0;
            z-index: 3 !important;
          `
      : ''}
`

const SortableIconContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 12px;
`

interface SortableProps {
  children?: React.ReactNode
  onClick: () => void
  sorted?: 'ASC' | 'DESC'
  sticky?: boolean
  top?: string
  'data-qa'?: string
  width?: string
}

const CustomButton = styled.button<{ theme: ITheme }>`
  display: flex;
  font-size: 14px;
  color: ${(p) => p.theme.colors.grayscale.g70};
  border: none;
  background: none;
  outline: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  text-transform: uppercase;
  font-weight: 700;

  &:focus {
    outline: 2px solid ${colors.main.m2Focus};
    outline-offset: 2px;
  }
`

export const SortableTh = React.memo(function SortableTh({
  children,
  onClick,
  sorted,
  sticky,
  top,
  'data-qa': dataQa
}: SortableProps) {
  return (
    <Th sticky={sticky} top={top}>
      <CustomButton onClick={onClick} data-qa={dataQa}>
        <span>{children}</span>
        <SortableIconContainer>
          <FontAwesomeIcon
            icon={sorted === 'ASC' ? faChevronUp : faChevronUp}
            color={
              sorted === 'ASC' ? colors.grayscale.g70 : colors.grayscale.g35
            }
            size="xs"
          />
          <FontAwesomeIcon
            icon={sorted === 'DESC' ? faChevronDown : faChevronDown}
            color={
              sorted === 'DESC' ? colors.grayscale.g70 : colors.grayscale.g35
            }
            size="xs"
          />
        </SortableIconContainer>
      </CustomButton>
    </Th>
  )
})
