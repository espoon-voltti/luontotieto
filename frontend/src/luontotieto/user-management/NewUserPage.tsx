// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPostUser, User } from 'api/users-api'
import { AxiosError } from 'axios'
import React, { FormEvent, useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertBox, InfoBox } from 'shared/MessageBoxes'
import { AsyncButton } from 'shared/buttons/AsyncButton'
import { BackNavigation } from 'shared/buttons/BackNavigation'
import { InputField } from 'shared/form/InputField'
import InfoModal, { InfoModalStateProps } from 'shared/modals/InfoModal'
import { H2, Label } from 'shared/typography'

import {
  FixedWidthDiv,
  FlexRowWithGaps,
  GroupOfInputRows,
  LabeledInput,
  PageContainer,
  SectionContainer
} from '../../shared/layout'

import { emailRegex } from './common'

export const NewUserPage = React.memo(function NewUserPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [userInput, setUserInput] = useState({
    name: '',
    email: ''
  })
  const [showModal, setShowModal] = useState<InfoModalStateProps | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onCreateUserSuccess = useCallback((user: User) => {
    setShowModal({
      title: 'Käyttäjän luotu',
      resolve: {
        action: () => {
          setShowModal(null)
          navigate(`/luontotieto/käyttäjät/${user.id}`)
        },
        label: 'Ok'
      }
    })
    void queryClient.invalidateQueries({ queryKey: ['users'] })
  }, [])

  const { mutateAsync: createUser, isPending: isSaving } = useMutation({
    mutationFn: apiPostUser,
    onSuccess: onCreateUserSuccess,
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

  const isValid =
    userInput.name && userInput.email && userInput.email.match(emailRegex)

  const invalidEmailInfo = useMemo(
    () =>
      userInput.email && !userInput.email.match(emailRegex)
        ? {
            text: 'Syötä oikeaa muotoa oleva sähköposti',
            status: 'warning' as const
          }
        : undefined,
    [userInput.email]
  )

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      await createUser(userInput)
    },
    [createUser, userInput]
  )

  return (
    <PageContainer>
      <BackNavigation
        text="Lisää yrityskäyttäjä"
        navigationText="Käyttäjänhallinta"
        destination="/luontotieto/käyttäjät"
      />
      <SectionContainer>
        <form
          onSubmit={async (e) => {
            if (!isSaving) {
              await onSubmit(e)
            }
          }}
        >
          <GroupOfInputRows>
            <H2>Käyttäjän tiedot</H2>
            <LabeledInput $cols={4}>
              <Label>Yritys *</Label>
              <InputField
                value={userInput.name}
                onChange={(value) =>
                  setUserInput({ ...userInput, name: value })
                }
              />
            </LabeledInput>
            <LabeledInput $cols={4}>
              <Label>Yhteyssähköposti *</Label>
              <InputField
                value={userInput.email}
                onChange={(value) =>
                  setUserInput({ ...userInput, email: value })
                }
                info={invalidEmailInfo}
              />
            </LabeledInput>
            {!!errorMessage && (
              <AlertBox title="Virhe" message={errorMessage} />
            )}
            <FlexRowWithGaps>
              <AsyncButton
                text="Tallenna muutokset"
                data-qa="save-button"
                primary
                disabled={!isValid}
                onSuccess={onCreateUserSuccess}
                onClick={() => createUser(userInput)}
              />
            </FlexRowWithGaps>

            <FixedWidthDiv $cols={8}>
              <InfoBox
                message={`Kun käyttäjä on luotu lähetetään käyttäjälle automaattisesti sähköposti,
               joka sisältää luontotietoportaalin osoitteen sekä kirjautumiseen vaadittavat tunnukset.`}
              />
            </FixedWidthDiv>
          </GroupOfInputRows>
        </form>
      </SectionContainer>
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
    </PageContainer>
  )
})
