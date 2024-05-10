// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useState } from 'react'

import {
  FixedWidthDiv,
  FlexRowWithGaps,
  GroupOfInputRows,
  LabeledInput,
  PageContainer,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { InputField } from 'shared/form/InputField'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { Label } from 'shared/typography'
import { Button } from 'shared/buttons/Button'
import { InfoBox } from 'shared/MessageBoxes'

export const NewUserPage = React.memo(function NewUserPage() {
  const [userInput, setUserInput] = useState({
    userName: '',
    email: '',
    active: true,
    role: 'konsultti'
  })

  const isValid = userInput.userName && userInput.email

  return (
    <PageContainer>
      <BackNavigation
        text={'Luo uusi yrityskäyttäjä'}
        navigationText="Käyttäjänhallinta"
        destination={'/luontotieto/käyttäjät'}
      />

      <SectionContainer>
        <GroupOfInputRows>
          <LabeledInput $cols={3}>
            <Label>Yritys</Label>
            <InputField
              value={userInput.userName}
              onChange={(value) =>
                setUserInput({ ...userInput, userName: value })
              }
            />
          </LabeledInput>
          <LabeledInput $cols={3}>
            <Label>Yhteyssähköposti</Label>
            <InputField
              value={userInput.email}
              onChange={(value) => setUserInput({ ...userInput, email: value })}
            />
          </LabeledInput>
          <FlexRowWithGaps>
            <Button
              primary
              text={'Luo yrityskäyttäjä'}
              disabled={!isValid}
            ></Button>
          </FlexRowWithGaps>

          <FixedWidthDiv $cols={8}>
            <InfoBox
              message={`Kun käyttäjä on luotu lähetetään käyttäjälle automaattisesti sähköposti,
               joka sisältää luontotietoportaalin osoitteen sekä kirjautumiseen vaadittavat tunnukset.`}
            ></InfoBox>
          </FixedWidthDiv>
        </GroupOfInputRows>
      </SectionContainer>
      <VerticalGap $size="XL" />
    </PageContainer>
  )
})
