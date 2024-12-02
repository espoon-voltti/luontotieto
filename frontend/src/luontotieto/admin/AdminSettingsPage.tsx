// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiGeoserverReloadConfiguration } from 'api/geoserver-api'
import { AxiosError } from 'axios'
import React from 'react'
import AccessibilityFooter from 'shared/AccessibilityFooter'
import { InfoBox } from 'shared/MessageBoxes'
import { AsyncButton } from 'shared/buttons/AsyncButton'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { InfoButton } from 'shared/buttons/InfoButton'
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
  const [error, setError] = React.useState<string | null>(null)

  const reloadGeoServer = async () => {
    try {
      setError(null)
      const result = await apiGeoserverReloadConfiguration()
      return result
    } catch (e) {
      if (e instanceof AxiosError) {
        if (e.response?.status === 429) {
          setError('Liian monta yritystä, koita minuutin päästä uudelleen')
        }
      }
      return Promise.reject()
    }
  }

  return (
    <PageContainer>
      <BackNavigation navigationText="Etusivulle" />
      <SectionContainer>
        <GroupOfInputRows>
          <H2>Pääkäyttäjän asetukset</H2>
          <LabeledInput $cols={6}>
            <FlexRow>
              <Label>GeoServer-konfiguraation uudelleenlataus</Label>
              <InfoButton
                onClick={() =>
                  setShowGeoserverReloadInfo(!showGeoserverReloadInfo)
                }
              />
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
              onClick={() => reloadGeoServer()}
            />
            {!!error && <ErrorMessage>{error}</ErrorMessage>}
          </LabeledInput>
        </GroupOfInputRows>
      </SectionContainer>
      <AccessibilityFooter />
    </PageContainer>
  )
})

const ErrorMessage = styled.label`
  color: ${colors.status.danger};
`
