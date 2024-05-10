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

export const UserSettingsPage = React.memo(function UserSettingsPage() {
  //TODO: get from context and whos this page only for konsultti/yritys users
  const [userInput, _] = useState(userlist[3])
  const [showChangePassword, setShowChangePassword] = useState(false)

  return (
    <PageContainer>
      <BackNavigation text={userInput.userName} navigationText="Etusivulle" />

      <SectionContainer>
        <GroupOfInputRows>
          <LabeledInput $cols={3}>
            <Label>Yritys</Label>
            <InputField value={userInput.userName} readonly={true} />
          </LabeledInput>
          <LabeledInput $cols={3}>
            <Label>Yhteyssähköposti</Label>
            <InputField value={userInput.email} readonly={true} />
          </LabeledInput>
          {!showChangePassword ? (
            <InlineButton
              text={'Vaihda salasana'}
              onClick={() => setShowChangePassword(!showChangePassword)}
            />
          ) : (
            <ChangePasswordForm onCancel={() => setShowChangePassword(false)} />
          )}
        </GroupOfInputRows>
      </SectionContainer>
      <VerticalGap $size="XL" />
    </PageContainer>
  )
})

const ChangePasswordForm = React.memo(function ChangePasswordForm({
  onCancel
}: {
  onCancel: () => void
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')

  return (
    <GroupOfInputRows>
      <LabeledInput $cols={3}>
        <Label>Nykyinen salasana</Label>
        <InputField
          onChange={setCurrentPassword}
          value={currentPassword}
          type="password"
        />
      </LabeledInput>
      <LabeledInput $cols={3}>
        <Label>Uusi salasana</Label>
        <InputField
          onChange={setNewPassword}
          value={newPassword}
          type="password"
        />
      </LabeledInput>
      <LabeledInput $cols={3}>
        <Label>Vahvista uusi salasana</Label>
        <InputField
          onChange={setNewPassword2}
          value={newPassword2}
          type="password"
        />
      </LabeledInput>
      <FlexRowWithGaps>
        <Button text={'Peruuta'} onClick={onCancel}></Button>
        <Button primary text={'Tallenna'}></Button>
      </FlexRowWithGaps>
    </GroupOfInputRows>
  )
})
