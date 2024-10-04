// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { apiGeoserverReloadConfiguration } from 'api/geoserver-api'
import React from 'react'
import AccessibilityFooter from 'shared/AccessibilityFooter'
import { InfoBox } from 'shared/MessageBoxes'
import { AsyncButton } from 'shared/buttons/AsyncButton'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { InfoButton } from 'shared/buttons/InfoButton'
import { H2, Label, P } from 'shared/typography'

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
              onClick={() => apiGeoserverReloadConfiguration()}
            />
          </LabeledInput>
        </GroupOfInputRows>
      </SectionContainer>
      <AccessibilityFooter />
    </PageContainer>
  )
})
