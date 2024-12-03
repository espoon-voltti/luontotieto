// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import { Link } from 'react-router'
import styled from 'styled-components'

import { PageContainer } from './layout'
import { colors, tabletMin } from './theme'

export const FooterContent = React.memo(function FooterContent() {
  return (
    <>
      <FooterItem data-qa="footer-citylabel">© Espoon kaupunki</FooterItem>
      <FooterItem>
        <a
          href="https://www.espoo.fi/fi/espoon-kaupunki/tietosuoja"
          data-qa="footer-policy-link"
          style={{ color: colors.main.m2 }}
        >
          Tietosuojaselosteet
        </a>
      </FooterItem>
      <FooterItem>
        <Link to="/accessibility">Saavutettavuusseloste</Link>
      </FooterItem>
    </>
  )
})

export default React.memo(function AccessibilityFooter() {
  return (
    <FooterContainer as="footer">
      <FooterContent />
    </FooterContainer>
  )
})

export const footerHeightDesktop = '72px'

const FooterItem = styled.div`
  display: inline-block;
  height: 40px;

  @media (min-width: ${tabletMin}) {
    height: auto;
  }
`

const FooterContainer = styled(PageContainer)`
  display: flex;
  flex-direction: row;
  height: auto;
  align-items: left;
  margin: auto;
  padding: 30px 16px 20px 16px;
  font-weight: normal;

  @media (min-width: ${tabletMin}) {
    flex-wrap: wrap;
    max-height: 240px;
  }

  @media (min-width: 1024px) {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: start;
    padding-left: 96px;
    padding-right: 96px;
    height: ${footerHeightDesktop};
  }

  @media (min-width: 1408px) {
    padding-left: 32px;
    padding-right: 32px;
    justify-content: space-evenly;
  }

  a {
    display: inline-block;
    position: relative;
    padding-top: 8px;
    padding-bottom: 9px;
    margin-top: -8px;
    margin-bottom: -9px;
  }

  a:hover {
    text-decoration: underline;
  }
`
