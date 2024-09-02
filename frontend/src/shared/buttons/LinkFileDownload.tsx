// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'

import { BaseProps } from '../theme'

import { StyledLink } from './StyledLink'

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
