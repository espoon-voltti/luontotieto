// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChangePasswordErrorCode,
  ChangePasswordError,
  apiChangeUserPassword
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
import { AlertBox } from 'shared/MessageBoxes'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { Button } from 'shared/buttons/Button'
import { InlineButton } from 'shared/buttons/InlineButton'
import { InputField } from 'shared/form/InputField'
import InfoModal, { InfoModalStateProps } from 'shared/modals/InfoModal'
import { Label } from 'shared/typography'

import {
  FlexRowWithGaps,
  GroupOfInputRows,
  LabeledInput,
  PageContainer,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'

export const UserSettingsPage = React.memo(function UserSettingsPage() {
  const { user } = useContext(UserContext)

  const [showChangePassword, setShowChangePassword] = useState(false)
  if (!user) {
    return null
  }
  return (
    <PageContainer>
      <BackNavigation text={user.name} navigationText="Etusivulle" />

      <SectionContainer>
        <GroupOfInputRows>
          <LabeledInput $cols={3}>
            <Label>Yritys</Label>
            <InputField value={user.name} readonly={true} />
          </LabeledInput>
          <LabeledInput $cols={3}>
            <Label>Yhteyssähköposti</Label>
            <InputField value={user.email ?? ''} readonly={true} />
          </LabeledInput>
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
        </GroupOfInputRows>
      </SectionContainer>
      <VerticalGap $size="XL" />
    </PageContainer>
  )
})

const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{10,}$/

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
