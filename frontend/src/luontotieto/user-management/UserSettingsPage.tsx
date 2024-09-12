// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChangePasswordErrorCode,
  ChangePasswordError,
  apiChangeUserPassword,
  UserRole,
  getUserRole
} from 'api/users-api'
import { UserContext } from 'auth/UserContext'
import { AxiosError } from 'axios'
import React, {
  FormEvent,
  useCallback,
  useContext,
  useMemo,
  useState
} from 'react'
import { AlertBox, InfoBox } from 'shared/MessageBoxes'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { Button } from 'shared/buttons/Button'
import { InlineButton } from 'shared/buttons/InlineButton'
import { InputField } from 'shared/form/InputField'
import InfoModal, { InfoModalStateProps } from 'shared/modals/InfoModal'
import { H2, Label } from 'shared/typography'

import {
  FlexRowWithGaps,
  GroupOfInputRows,
  LabeledInput,
  PageContainer,
  SectionContainer
} from '../../shared/layout'
import AccessibilityFooter from 'shared/AccessibilityFooter'

export const UserSettingsPage = React.memo(function UserSettingsPage() {
  const { user } = useContext(UserContext)

  const passwordChangeRequired = user?.passwordUpdated === false

  const [showChangePassword, setShowChangePassword] = useState(
    passwordChangeRequired
  )
  if (!user) {
    return null
  }
  return (
    <PageContainer>
      <BackNavigation text={user.name} navigationText="Etusivulle" />
      <SectionContainer>
        <GroupOfInputRows>
          <H2>Käyttäjän tiedot</H2>
          {user.role === UserRole.CUSTOMER && passwordChangeRequired && (
            <LabeledInput $cols={10}>
              <InfoBox
                message="Järjestelmämme on havainnut, että käytät automaattisesti 
           luotua salasanaa. Turvallisuutesi parantamiseksi pyydämme sinua päivittämään salasanasi,
           jonka jälkeen voit jatkaa palvelun käyttöä."
              />
            </LabeledInput>
          )}

          <LabeledInput $cols={3}>
            <Label>Yritys *</Label>
            <InputField value={user.name} readonly={true} />
          </LabeledInput>
          <LabeledInput $cols={3}>
            <Label>Yhteyssähköposti *</Label>
            <InputField value={user.email ?? ''} readonly={true} />
          </LabeledInput>
          {user.role === UserRole.CUSTOMER && (
            <>
              {!showChangePassword ? (
                <InlineButton
                  text="Vaihda salasana"
                  onClick={() => setShowChangePassword(!showChangePassword)}
                />
              ) : (
                <ChangePasswordForm
                  userId={user.id}
                  onClose={() => setShowChangePassword(false)}
                />
              )}
            </>
          )}
          {user.role !== UserRole.CUSTOMER && (
            <>
              <LabeledInput $cols={3}>
                <Label>Käyttöoikeudet</Label>
                <InputField value={getUserRole(user.role)} readonly={true} />
              </LabeledInput>
              {user.role === UserRole.VIEWER && (
                <InfoBox
                  message={`Katselija-oikeuksilla käyttäjällä on vain lukuoikeudet tehtyihin luontoselvityksiin. 
                  Jos haluat muuttaa käyttöoikeuksiasi, ole yhteydessä pääkäyttäjään ymparisto@espoo.fi`}
                />
              )}
            </>
          )}
        </GroupOfInputRows>
      </SectionContainer>
      <AccessibilityFooter />
    </PageContainer>
  )
})

const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{12,}$/

const ChangePasswordForm = React.memo(function ChangePasswordForm({
  userId,
  onClose
}: {
  userId: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [showModal, setShowModal] = useState<InfoModalStateProps | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { mutateAsync: changePassword, isPending } = useMutation({
    mutationFn: apiChangeUserPassword,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['auth-status'] })
      void queryClient.invalidateQueries({ queryKey: ['users', userId] })
      setShowModal({
        title: 'Salasana muutettu',
        resolve: {
          action: () => {
            setShowModal(null)
            onClose()
          },
          label: 'Ok'
        }
      })
    },
    onError: (e: AxiosError<{ errorCode: ChangePasswordErrorCode }>) => {
      if (e instanceof AxiosError) {
        const errorCode = e.response?.data.errorCode
        const errorMessage = errorCode
          ? ChangePasswordError[errorCode]
          : 'Odottamaton virhe'
        setErrorMessage(errorMessage)
      }
    }
  })

  const passwordIsWeakInfo = useMemo(
    () =>
      newPassword && !passwordRegex.test(newPassword)
        ? {
            text: ChangePasswordError['weak-password'],
            status: 'warning' as const
          }
        : undefined,
    [newPassword]
  )

  const newPassWordDoesNotMatchInfo = useMemo(
    () =>
      newPassword2 && newPassword !== newPassword2
        ? {
            text: 'Uudet salasanat eivät täsmää.',
            status: 'warning' as const
          }
        : undefined,
    [newPassword, newPassword2]
  )

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      await changePassword({ userId, currentPassword, newPassword })
    },
    [changePassword, userId, currentPassword, newPassword]
  )

  return (
    <form onSubmit={onSubmit}>
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
            info={passwordIsWeakInfo}
          />
        </LabeledInput>
        <LabeledInput $cols={3}>
          <Label>Vahvista uusi salasana</Label>
          <InputField
            onChange={setNewPassword2}
            value={newPassword2}
            type="password"
            info={newPassWordDoesNotMatchInfo}
          />
        </LabeledInput>
        {!!errorMessage && <AlertBox title="Virhe" message={errorMessage} />}
        <FlexRowWithGaps>
          <Button text="Peruuta" onClick={onClose} />
          <Button
            disabled={
              isPending ||
              !currentPassword ||
              !newPassword ||
              !newPassword2 ||
              !!newPassWordDoesNotMatchInfo ||
              !!passwordIsWeakInfo
            }
            primary
            type="submit"
            text="Tallenna"
          />
        </FlexRowWithGaps>
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
    </form>
  )
})
