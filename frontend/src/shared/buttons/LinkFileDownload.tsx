// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import styled from 'styled-components'

import { BaseProps, colors } from '../theme'

const StyledLink = styled.a`
  font-weight: bold;

  &:focus {
    outline: 2px solid ${colors.main.m2Focus};
    outline-offset: 2px;
  }
`

export interface LinkFileDownloadProps extends BaseProps {
  onClick: (fileId: string) => void
  fileId: string
  fileName: string
}

export const LinkFileDownload = React.memo(function LinkFileDownload({
  onClick,
  fileId,
  fileName
}: LinkFileDownloadProps) {
  return (
    <StyledLink
      onClick={() => onClick(fileId)}
      onKeyDown={(event: React.KeyboardEvent<HTMLAnchorElement>) => {
        if (event.code === 'Enter') {
          onClick(fileId)
        }
      }}
      tabIndex={0}
    >{`${fileName}`}</StyledLink>
  )
})
