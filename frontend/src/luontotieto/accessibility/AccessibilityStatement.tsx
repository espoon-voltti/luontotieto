// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import AccessibilityFooter from 'shared/AccessibilityFooter'
import ExternalLink from 'shared/ExternalLink'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { PageContainer, SectionContainer } from 'shared/layout'
import { H1, H2, P } from 'shared/typography'
import styled from 'styled-components'

const MainContainer = styled.main`
  outline: none;
`

const StyledP = styled(P)`
  margin-block: 1.5em;
`

const StyledH2 = styled(H2)`
  margin-block: 0.83em;
`

export default React.memo(function AccessibilityStatement() {
  return (
    <>
      <MainContainer>
        <PageContainer>
          <BackNavigation navigationText="Etusivulle" />

          <SectionContainer>
            <H1 style={{ marginBottom: '24px' }}>Saavutettavuusseloste</H1>
            <StyledP>
              Tämä saavutettavuusseloste koskee Espoon kaupungin
              Luontotieto-verkkopalvelua osoitteessa{' '}
              <a href="https://luontotieto.espoo.fi/">luontotieto.espoo.fi</a>.
              Espoon kaupunki pyrkii takaamaan verkkopalvelun saavutettavuuden,
              parantamaan käyttäjäkokemusta jatkuvasti ja soveltamaan
              asianmukaisia saavutettavuusstandardeja.
            </StyledP>
            <StyledP>
              Palvelun saavutettavuuden on arvioinut palvelun kehitystiimi, ja
              seloste on laadittu 12.9.2024.
            </StyledP>
            <StyledH2>Palvelun vaatimustenmukaisuus</StyledH2>
            <StyledP>
              Verkkopalvelu täyttää lain asettamat kriittiset
              saavutettavuusvaatimukset WCAG v2.1 -tason AA mukaisesti. Palvelu
              ei ole vielä kaikilta osin vaatimusten mukainen.
            </StyledP>
            <StyledH2>Toimet saavutettavuuden tukemiseksi</StyledH2>
            <StyledP>
              Verkkopalvelun saavutettavuus varmistetaan muun muassa seuraavilla
              toimenpiteillä:
            </StyledP>
            <ul>
              <li>
                Saavutettavuus huomioidaan alusta lähtien suunnitteluvaiheessa,
                mm. valitsemalla palvelun värit ja kirjaisinten koot
                saavutettavasti.
              </li>
              <li>
                Palvelun elementit on määritelty semantiikaltaan
                johdonmukaisesti.
              </li>
              <li>Palvelua testataan jatkuvasti ruudunlukijalla.</li>
              <li>
                Erilaiset käyttäjät testaavat palvelua ja antavat
                saavutettavuudesta palautetta.
              </li>
              <li>
                Sivuston saavutettavuudesta huolehditaan jatkuvalla valvonnalla
                tekniikan tai sisällön muuttuessa.
              </li>
            </ul>
            <StyledP>
              Tätä selostetta päivitetään sivuston muutosten ja saavutettavuuden
              tarkistusten yhteydessä.
            </StyledP>
            <StyledH2>Tunnetut saavutettavuusongelmat</StyledH2>
            <StyledP>
              Käyttäjät saattavat edelleen kohdata sivustolla joitakin ongelmia.
              Seuraavassa on kuvaus tunnetuista saavutettavuusongelmista. Jos
              huomaat sivustolla ongelman, joka ei ole luettelossa, otathan
              meihin yhteyttä.
            </StyledP>
            <ul>
              <li>
                Palvelun päivämäärävalitsinta ja monivalintojen alasvetovalikkoa
                ei ole optimoitu käytettäväksi ruudunlukijalla.
              </li>
            </ul>
            <StyledH2>Vaihtoehtoiset asiointitavat</StyledH2>
            <StyledP>
              <ExternalLink
                href="https://www.espoo.fi/fi/espoon-kaupunki/asiakaspalvelu/asiointipisteet-ja-espoo-info/asiointipisteet"
                text="Espoon kaupungin asiointipisteistä"
              />{' '}
              saa apua sähköiseen asiointiin. Asiointipisteiden palveluneuvojat
              auttavat käyttäjiä, joille digipalvelut eivät ole saavutettavissa.
            </StyledP>
            <StyledH2>Anna palautetta</StyledH2>
            <StyledP>
              Jos huomaat saavutettavuuspuutteen verkkopalvelussamme, kerro
              siitä meille. Voit antaa palautetta sähköpostitse{' '}
              <a href="mailto:ymparisto@espoo.fi">ymparisto@espoo.fi</a>.
            </StyledP>
            <StyledH2>Valvontaviranomainen</StyledH2>
            <StyledP>
              Jos huomaat sivustolla saavutettavuusongelmia, anna ensin
              palautetta meille sivuston ylläpitäjille. Vastauksessa voi mennä
              14 päivää. Jos et ole tyytyväinen saamaasi vastaukseen, tai et saa
              vastausta lainkaan kahden viikon aikana, voit antaa palautteen
              Etelä-Suomen aluehallintovirastoon. Etelä-Suomen
              aluehallintoviraston sivulla kerrotaan tarkasti, miten valituksen
              voi tehdä, ja miten asia käsitellään.
            </StyledP>

            <StyledP>
              <strong>Valvontaviranomaisen yhteystiedot </strong>
              <br />
              Etelä-Suomen aluehallintovirasto <br />
              Saavutettavuuden valvonnan yksikkö
              <br />
              <ExternalLink
                href="https://www.saavutettavuusvaatimukset.fi"
                text="www.saavutettavuusvaatimukset.fi"
              />
              <br />
              <a href="mailto:saavutettavuus@avi.fi">saavutettavuus@avi.fi</a>
              <br />
              puhelinnumero vaihde 0295 016 000
              <br />
              Avoinna: ma-pe klo 8.00–16.15
            </StyledP>
          </SectionContainer>
        </PageContainer>
      </MainContainer>
      <AccessibilityFooter />
    </>
  )
})
