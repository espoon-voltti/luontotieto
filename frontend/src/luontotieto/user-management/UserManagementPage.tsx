// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useState } from 'react'

import {
  FlexRowWithGaps,
  GroupOfInputRows,
  LabeledInput,
  PageContainer,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { InputField } from 'shared/form/InputField'
import { userlist } from './users'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { Label } from 'shared/typography'
import { InlineButton } from 'shared/buttons/InlineButton'
import { Button } from 'shared/buttons/Button'
import Radio from 'shared/form/Radio'
import Switch from 'shared/form/Switch'

export const UserManagementPage = React.memo(function UserManagementPage() {
  //TODO: get from context and whos this page only for konsultti/yritys users
  const [userInput, setUserInput] = useState(userlist[0])
  const [enableEdit, setEnableEdit] = useState(false)

  return (
    <PageContainer>
      <BackNavigation text={userInput.userName} navigationText="Etusivulle" />

      <SectionContainer>
        <GroupOfInputRows>
          <LabeledInput $cols={3}>
            <Label>Käyttäjä</Label>
            <InputField
              value={userInput.userName}
              readonly={true}
              onChange={(value) =>
                setUserInput({ ...userInput, userName: value })
              }
            />
          </LabeledInput>
          <LabeledInput $cols={3}>
            <Label>Yhteyssähköposti</Label>
            <InputField
              value={userInput.email}
              readonly={true}
              onChange={(value) => setUserInput({ ...userInput, email: value })}
            />
          </LabeledInput>

          <LabeledInput $cols={3}>
            <Label>Käyttäjäoikeudet</Label>
            <FlexRowWithGaps>
              <Radio
                key={'Pääkäyttäjä'}
                label={'Pääkäyttäjä'}
                checked={userInput.role === 'pääkäyttäjä'}
                onChange={() =>
                  setUserInput({ ...userInput, role: 'pääkäyttäjä' })
                }
                disabled={!enableEdit}
                small={true}
              ></Radio>
              <Radio
                key={'Tilaaja'}
                label={'Tilaaja'}
                checked={userInput.role === 'tilaaja'}
                onChange={() => setUserInput({ ...userInput, role: 'tilaaja' })}
                disabled={!enableEdit}
                small={true}
              ></Radio>
              <Radio
                key={'Katsoja'}
                label={'Katsoja'}
                checked={userInput.role === 'katsoja'}
                onChange={() => setUserInput({ ...userInput, role: 'katsoja' })}
                disabled={!enableEdit}
                small={true}
              ></Radio>
            </FlexRowWithGaps>
          </LabeledInput>
          <LabeledInput>
            <Label>Tila</Label>
            <Switch
              key="tila"
              label="Aktiivinen"
              checked={userInput.active}
              onChange={() => {
                console.log('we change we chagne')
                setUserInput({ ...userInput, active: !userInput.active })
              }}
              disabled={!enableEdit}
            />
          </LabeledInput>
          {enableEdit ? (
            <FlexRowWithGaps>
              <Button
                text={'Peruuta'}
                onClick={() => setEnableEdit(!enableEdit)}
              ></Button>
              <Button primary text={'Tallenna'}></Button>
            </FlexRowWithGaps>
          ) : (
            <InlineButton
              text={'Muokkaa tietoja'}
              onClick={() => setEnableEdit(!enableEdit)}
            />
          )}
        </GroupOfInputRows>
      </SectionContainer>

      <VerticalGap $size="XL" />
    </PageContainer>
  )
})
