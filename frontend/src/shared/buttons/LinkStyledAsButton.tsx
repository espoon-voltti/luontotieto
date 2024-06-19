// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import styled from 'styled-components'

import { colors } from '../theme'

export const LinkStyledAsButton = styled.a`
  -webkit-font-smoothing: antialiased;
  text-size-adjust: 100%;
  box-sizing: inherit;
  height: 45px;
  padding: 0 27px;
  width: fit-content;
  min-width: 100px;
  text-align: center;
  overflow-x: hidden;
  border: 1px solid ${colors.main.m2};
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  font-family: 'Open Sans', sans-serif;
  font-size: 1rem;
  line-height: 1rem;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.2px;
  color: ${colors.grayscale.g0};
  background-color: ${colors.main.m2};
  margin-right: 0;
  text-decoration: none;
  display: flex;
  justify-content: center;
  align-items: center;

  &:hover {
    background-color: ${colors.main.m2Hover};
  }
  &:focus {
    outline: 2px solid ${colors.main.m2Focus};
    outline-offset: 2px;
  }
  &:active {
    background-color: ${colors.main.m2Active};
  }
`
