// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import { InputField } from 'shared/form/InputField'
import { useDebouncedState } from 'shared/useDebouncedState'

import {
  GroupOfInputRows,
  LabeledInput,
  RowOfInputs,
  SectionContainer,
  VerticalGap
} from '../shared/layout'
import { H2, Label } from '../shared/typography'

import { PageContainer } from 'shared/layout'
import { Button } from 'shared/buttons/Button'
import { InlineButton } from 'shared/buttons/InlineButton'

export const UserLoginPage = React.memo(function UserLoginPage() {
  const [userName, setUsername] = useDebouncedState('')

  const [password, setPassword] = useDebouncedState('')

  return (
    <PageContainer>
      <SectionContainer $sidePadding="62px">
        <H2>Kirjaudu sisään</H2>
        <VerticalGap $size="L" />
        <GroupOfInputRows>
          <RowOfInputs>
            <LabeledInput $cols={3}>
              <Label>Sähköposti</Label>
              <InputField onChange={setUsername} value={userName} />
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput $cols={3}>
              <Label>Salasana</Label>
              <InputField
                onChange={setPassword}
                value={password}
                type="password"
              />
            </LabeledInput>
          </RowOfInputs>
          <Button
            text="Kirjaudu sisään"
            primary
            disabled={!userName || !password}
            onClick={() => {
              console.log('Log in')
            }}
          />
          <InlineButton
            text={'Unohdin salasanan'}
            onClick={() => console.log('Forgot pw')}
          />
        </GroupOfInputRows>
      </SectionContainer>
    </PageContainer>
  )
})
