// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faInfo } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { apiGeoserverReloadConfiguration } from 'api/geoserver-api'
import React from 'react'
import AccessibilityFooter from 'shared/AccessibilityFooter'
import { InfoBox } from 'shared/MessageBoxes'
import { AsyncButton } from 'shared/buttons/AsyncButton'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { colors } from 'shared/theme'
import { H2, Label, P } from 'shared/typography'
import styled from 'styled-components'

import {
  FlexRow,
  GroupOfInputRows,
  LabeledInput,
  PageContainer,
  SectionContainer
} from '../../shared/layout'

export const AdminSettingsPage = React.memo(function AdminSettingsPage() {
  const [showGeoserverReloadInfo, setShowGeoserverReloadInfo] =
    React.useState(false)
  return (
    <PageContainer>
      <BackNavigation navigationText="Etusivulle" />
      <SectionContainer>
        <GroupOfInputRows>
          <H2>Pääkäyttäjän asetukset</H2>
          <LabeledInput $cols={6}>
            <FlexRow>
              <Label>Geoserver kongifuraation uudelleen lataus</Label>
              <StyledIconButton
                onClick={() =>
                  setShowGeoserverReloadInfo(!showGeoserverReloadInfo)
                }
              >
                <StyledIconContainer $color={colors.main.m1}>
                  <FontAwesomeIcon
                    icon={faInfo}
                    size="1x"
                    color={colors.main.m1}
                    inverse
                  />
                </StyledIconContainer>
              </StyledIconButton>
            </FlexRow>
            {showGeoserverReloadInfo && (
              <InfoBox
                message={
                  <P>
                    Tällä toiminnolla pääkäyttäjä pystyy päivittämään
                    geoserverin konfiguraation. Tämä toimenpide on tarpeellinen
                    silloin, kun paikkatietotauluja on muokattu ja muutokset
                    halutaan reflektoida WFS-rajapintaan.
                  </P>
                }
              />
            )}
            <AsyncButton
              text="Päivitä"
              data-qa="save-button"
              primary
              onSuccess={() => {
                /* intentionally empty */
              }}
              onClick={() => apiGeoserverReloadConfiguration()}
            />
          </LabeledInput>
        </GroupOfInputRows>
      </SectionContainer>
      <AccessibilityFooter />
    </PageContainer>
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
