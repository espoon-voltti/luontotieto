// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'

import styled from 'styled-components'

const StyledFooter = styled.div`
  background-color: #fff;
  position: fixed;
  left: 0;
  bottom: 0;
  height: 100px;
  width: 100%;
  box-shadow: 0px -2px 4px 0px #00000040;
`

export const pageWidth = '1152px'

export const ContentContainer = styled.div`
  max-width: ${pageWidth};
  margin: 0 auto;
  padding: 20px 0;
  height: 100%;
`

export interface FooterProps {
  children: any
}

export const Footer = React.memo(function Footer({ children }: FooterProps) {
  return (
    <StyledFooter>
      <ContentContainer>{children}</ContentContainer>
    </StyledFooter>
  )
})
