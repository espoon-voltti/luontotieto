// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { colors } from 'shared/theme'
import styled from 'styled-components'

export const StyledLink = styled.a`
  font-weight: bold;

  &:focus {
    outline: 2px solid ${colors.main.m2Focus};
    outline-offset: 2px;
  }
`
