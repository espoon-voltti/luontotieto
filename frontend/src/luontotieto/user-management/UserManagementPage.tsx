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
import { UserRole, userlist } from './users'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { Label } from 'shared/typography'
import { InlineButton } from 'shared/buttons/InlineButton'
import { Button } from 'shared/buttons/Button'
import Radio from 'shared/form/Radio'
import Switch from 'shared/form/Switch'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import { InfoBox } from 'shared/MessageBoxes'

const roles = [
  {
    label: 'Pääkäyttäjä',
    value: 'pääkäyttäjä' as UserRole,
    info: 'Pääkäyttäjällä on oikeudet kaikkiin toiminnallisuuksiin luontotietoportaalissa.'
  },
  {
    label: 'Tilaaja',
    value: 'tilaaja' as UserRole,
    info: 'Tilaajalla on oikeudet luoda, katsella ja muokata luontoselvityksiä.'
  },
  {
    label: 'Katsoja',
    value: 'katsoja' as UserRole,
    info: 'Katsojalla on oikeudet katsella luotuja luontoselvityksiä'
  }
]

export const UserManagementPage = React.memo(function UserManagementPage() {
  //TODO: get from context and whos this page only for konsultti/yritys users
  const [userInput, setUserInput] = useState(userlist[0])
  const [enableEdit, setEnableEdit] = useState(false)

  const userSelectedRoleInfo = roles.find((r) => r.value === userInput.role)

  return (
    <PageContainer>
      <BackNavigation
        text={userInput.userName}
        navigationText="Käyttäjänhallinta"
        destination={'/luontotieto/käyttäjät/'}
      />

      <SectionContainer>
        <GroupOfInputRows>
          <LabeledInput $cols={3}>
            <Label>Käyttäjä</Label>
            <InputField
              value={userInput.userName}
              onChange={(value) =>
                setUserInput({ ...userInput, userName: value })
              }
              readonly={!enableEdit}
            />
          </LabeledInput>
          <LabeledInput $cols={3}>
            <Label>Yhteyssähköposti</Label>
            <InputField
              value={userInput.email}
              onChange={(value) => setUserInput({ ...userInput, email: value })}
              readonly={!enableEdit}
            />
          </LabeledInput>

          {userInput.role !== 'yrityskäyttäjä' && (
            <>
              <LabeledInput $cols={5}>
                <Label>Käyttäjäoikeudet</Label>
                <FlexRowWithGaps>
                  {roles.map((r) => (
                    <Radio
                      key={r.value}
                      label={r.label}
                      checked={userInput.role === r.value}
                      onChange={() =>
                        setUserInput({ ...userInput, role: r.value })
                      }
                      disabled={!enableEdit}
                      small={true}
                    />
                  ))}
                </FlexRowWithGaps>

                {enableEdit && userSelectedRoleInfo && (
                  <InfoBox message={userSelectedRoleInfo.info} />
                )}
              </LabeledInput>
              <LabeledInput>
                <Label>Tila</Label>
                <Switch
                  key="tila"
                  label="Aktiivinen"
                  checked={userInput.active}
                  onChange={() => {
                    setUserInput({ ...userInput, active: !userInput.active })
                  }}
                  disabled={!enableEdit}
                />
              </LabeledInput>
            </>
          )}

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
              icon={faPen}
              iconRight={true}
            />
          )}
          {userInput.role === 'yrityskäyttäjä' && (
            <InlineButton
              text={'Resetoi salasana'}
              onClick={() => console.log('Resetoi salasana')}
            />
          )}
        </GroupOfInputRows>
      </SectionContainer>

      <VerticalGap $size="XL" />
    </PageContainer>
  )
})
