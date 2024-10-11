// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faPen } from '@fortawesome/free-solid-svg-icons'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  apiPutUser,
  apiResetUserPassword,
  getUserRole,
  User,
  UserRole
} from 'api/users-api'
import { AxiosError } from 'axios'
import React, { useCallback, useMemo, useState } from 'react'
import { AlertBox, InfoBox } from 'shared/MessageBoxes'
import { AsyncButton } from 'shared/buttons/AsyncButton'
import { Button } from 'shared/buttons/Button'
import { InlineButton } from 'shared/buttons/InlineButton'
import { InputField } from 'shared/form/InputField'
import Radio from 'shared/form/Radio'
import Switch from 'shared/form/Switch'
import InfoModal, { InfoModalStateProps } from 'shared/modals/InfoModal'
import { H3, Label } from 'shared/typography'

import {
  FlexRowWithGaps,
  GroupOfInputRows,
  LabeledInput,
  SectionContainer
} from '../../shared/layout'

import { emailRegex } from './common'

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<InfoModalStateProps | null>(null)

  const userSelectedRoleInfo = roles.find((r) => r.role === userInput.role)

  const onUpdateUserSuccess = useCallback((user: User) => {
    void queryClient.invalidateQueries({ queryKey: ['users'] })
    void queryClient.invalidateQueries({ queryKey: ['user', user.id] })
    setShowModal({
      title: 'Käyttäjän tiedot päivitetty',
      resolve: {
        action: () => {
          setErrorMessage(null)
          setShowModal(null)
          setEnableEdit(false)
        },
        label: 'Ok'
      }
    })
  }, [])

  const { mutateAsync: updateUserMutation } = useMutation({
    mutationFn: apiPutUser,
    onSuccess: onUpdateUserSuccess,
    onError: (e: AxiosError<{ errorCode: string }>) => {
      if (e instanceof AxiosError) {
        const errorCode = e.response?.data.errorCode
        const errorMessage =
          errorCode === 'UniqueConstraintViolation'
            ? 'Syötetty sähköposti on jo käytössä toisella käyttäjällä.'
            : 'Tapahtui odottamaton virhe.'
        setErrorMessage(errorMessage)
      }
    }
  })

  const onResetUserPasswordSuccess = useCallback((userId: string) => {
    void queryClient.invalidateQueries({ queryKey: ['users'] })
    void queryClient.invalidateQueries({ queryKey: ['user', userId] })
    setShowModal({
      title: 'Käyttäjän salasana resetoitu',
      resolve: {
        action: () => {
          setShowModal(null)
        },
        label: 'Ok'
      },
      text: 'Uusi salasana on lähetetty käyttäjän sähköpostiin.'
    })
  }, [])

  const { mutateAsync: resetUserPasswordMutation } = useMutation({
    mutationFn: apiResetUserPassword,
    onSuccess: onResetUserPasswordSuccess
  })

  const invalidEmailInfo = useMemo(() => {
    if (!enableEdit) return undefined
    if (userInput.role === UserRole.CUSTOMER && !userInput.email)
      return { text: 'Sähköposti vaaditaan', status: 'warning' as const }
    if (userInput.email && !userInput.email.match(emailRegex))
      return {
        text: 'Syötä oikeaa muotoa oleva sähköposti',
        status: 'warning' as const
      }
    return undefined
  }, [userInput.email, userInput.role, enableEdit])

  const isValid = userInput.name && !invalidEmailInfo

  return (
    <SectionContainer>
      <GroupOfInputRows>
        <H3>Käyttäjän tiedot</H3>
        <LabeledInput $cols={4}>
          <Label>Käyttäjä *</Label>
          <InputField
            value={userInput.name}
            onChange={(value) => setUserInput({ ...userInput, name: value })}
            readonly={!enableEdit}
          />
        </LabeledInput>
        <LabeledInput $cols={4}>
          <Label>Yhteyssähköposti *</Label>
          <InputField
            value={userInput.email}
            onChange={(value) => setUserInput({ ...userInput, email: value })}
            readonly={!enableEdit}
            info={invalidEmailInfo}
          />
        </LabeledInput>

        {userInput.role !== UserRole.CUSTOMER && (
          <LabeledInput $cols={5}>
            <Label>Käyttöoikeudet *</Label>
            <FlexRowWithGaps style={{ paddingTop: '4px' }}>
              {roles.map((r) => (
                <Radio
                  key={r.role}
                  label={getUserRole(r.role)}
                  checked={userInput.role === r.role}
                  onChange={() => setUserInput({ ...userInput, role: r.role })}
                  disabled={!enableEdit}
                  small={true}
                />
              ))}
            </FlexRowWithGaps>

            {enableEdit && userSelectedRoleInfo && (
              <InfoBox message={userSelectedRoleInfo.info} />
            )}
          </LabeledInput>
        )}
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

        {!!errorMessage && <AlertBox title="Virhe" message={errorMessage} />}

        {enableEdit ? (
          <FlexRowWithGaps>
            <Button
              text="Peruuta"
              onClick={() => {
                setUserInput(user)
                setErrorMessage(null)
                setEnableEdit(!enableEdit)
              }}
            />
            <AsyncButton
              text="Tallenna"
              data-qa="save-button"
              primary
              disabled={!isValid}
              onSuccess={onUpdateUserSuccess}
              onClick={() =>
                updateUserMutation({
                  ...userInput,
                  userId: user.id
                })
              }
            />
          </FlexRowWithGaps>
        ) : (
          <InlineButton
            text="Muokkaa tietoja"
            onClick={() => setEnableEdit(!enableEdit)}
            icon={faPen}
            iconRight={true}
          />
        )}
        {userInput.role === UserRole.CUSTOMER && (
          <InlineButton
            text="Resetoi salasana"
            onClick={() =>
              setShowModal({
                title: 'Resetoi salasana',
                text: 'Oletko varma että haluat resetoida käyttäjän salasanan?',
                resolve: {
                  action: () => resetUserPasswordMutation({ userId: user.id }),
                  label: 'Resetoi'
                },
                reject: {
                  action: () => setShowModal(null),
                  label: 'Peruuta'
                }
              })
            }
          />
        )}
      </GroupOfInputRows>
      {showModal && (
        <InfoModal
          close={() => setShowModal(null)}
          closeLabel="Sulje"
          title={showModal.title}
          resolve={showModal.resolve}
          reject={showModal.reject}
        >
          {showModal.text}
        </InfoModal>
      )}
    </SectionContainer>
  )
})
