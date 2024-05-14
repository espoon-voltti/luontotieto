// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useState } from 'react'

import {
  FlexRowWithGaps,
  GroupOfInputRows,
  LabeledInput,
  SectionContainer
} from '../../shared/layout'
import { InputField } from 'shared/form/InputField'
import { Label } from 'shared/typography'
import { InlineButton } from 'shared/buttons/InlineButton'
import { Button } from 'shared/buttons/Button'
import Radio from 'shared/form/Radio'
import Switch from 'shared/form/Switch'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import { InfoBox } from 'shared/MessageBoxes'
import { User, UserRole, apiPutUser, getUserRole } from 'api/users-api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const roles = [
  {
    role: UserRole.ADMIN,
    info: 'Pääkäyttäjällä on oikeudet kaikkiin toiminnallisuuksiin luontotietoportaalissa.'
  },
  {
    role: UserRole.ORDERER,
    info: 'Tilaajalla on oikeudet luoda, katsella ja muokata luontoselvityksiä.'
  },
  {
    role: UserRole.VIEWER,
    info: 'Katsojalla on oikeudet katsella luotuja luontoselvityksiä'
  }
]

export const UserManagementForm = React.memo(function UserManagementForm({
  user
}: {
  user: User
}) {
  const userEditableFields = {
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active
  }
  const queryClient = useQueryClient()
  const [userInput, setUserInput] = useState(userEditableFields)
  const [enableEdit, setEnableEdit] = useState(false)

  const userSelectedRoleInfo = roles.find((r) => r.role === userInput.role)

  const { mutateAsync: updateReportMutation, isPending: updatingUser } =
    useMutation({
      mutationFn: apiPutUser,
      onSuccess: (user) => {
        queryClient.invalidateQueries({ queryKey: ['users'] })
        queryClient.invalidateQueries({ queryKey: ['user', user.id] })
        setEnableEdit(false)
      }
    })

  return (
    <SectionContainer>
      <GroupOfInputRows>
        <LabeledInput $cols={3}>
          <Label>Käyttäjä</Label>
          <InputField
            value={userInput.name}
            onChange={(value) => setUserInput({ ...userInput, name: value })}
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

        {userInput.role !== UserRole.CUSTOMER && (
          <>
            <LabeledInput $cols={5}>
              <Label>Käyttäjäoikeudet</Label>
              <FlexRowWithGaps>
                {roles.map((r) => (
                  <Radio
                    key={r.role}
                    label={getUserRole(r.role)}
                    checked={userInput.role === r.role}
                    onChange={() =>
                      setUserInput({ ...userInput, role: r.role })
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
              disabled={updatingUser}
              text={'Peruuta'}
              onClick={() => setEnableEdit(!enableEdit)}
            ></Button>
            <Button
              disabled={updatingUser}
              primary
              text={'Tallenna'}
              onClick={async () =>
                await updateReportMutation({
                  ...userInput,
                  userId: user.id
                })
              }
            ></Button>
          </FlexRowWithGaps>
        ) : (
          <InlineButton
            text={'Muokkaa tietoja'}
            onClick={() => setEnableEdit(!enableEdit)}
            icon={faPen}
            iconRight={true}
          />
        )}
        {userInput.role === UserRole.CUSTOMER && (
          <InlineButton
            text={'Resetoi salasana'}
            onClick={() => console.log('Resetoi salasana')}
          />
        )}
      </GroupOfInputRows>
    </SectionContainer>
  )
})
