// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { FormEvent, useCallback, useMemo, useState } from 'react'

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
import { H3, Label } from 'shared/typography'
import { Button } from 'shared/buttons/Button'
import { AlertBox, InfoBox } from 'shared/MessageBoxes'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPostUser } from 'api/users-api'
import { useNavigate } from 'react-router-dom'
import { emailRegex } from './common'
import { AxiosError } from 'axios'

export const NewUserPage = React.memo(function NewUserPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [userInput, setUserInput] = useState({
    name: '',
    email: ''
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { mutateAsync: createUser, isPending } = useMutation({
    mutationFn: apiPostUser,
    onSuccess: (user) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate(`/luontotieto/käyttäjät/${user.id}`)
    },
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

  const invalidEmailInfo = useMemo(() => {
    return userInput.email && !userInput.email.match(emailRegex)
      ? {
          text: 'Syötä oikeaa muotoa oleva sähköposti',
          status: 'warning' as const
        }
      : undefined
  }, [userInput.email])

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
        text={'Lisää yrityskäyttäjä'}
        navigationText="Käyttäjänhallinta"
        destination={'/luontotieto/käyttäjät'}
      />

      <SectionContainer>
        <form onSubmit={onSubmit}>
          <GroupOfInputRows>
            <H3>Yrityksen tiedot</H3>
            <LabeledInput $cols={4}>
              <Label>Yritys</Label>
              <InputField
                value={userInput.name}
                onChange={(value) =>
                  setUserInput({ ...userInput, name: value })
                }
              />
            </LabeledInput>
            <LabeledInput $cols={4}>
              <Label>Yhteyssähköposti</Label>
              <InputField
                value={userInput.email}
                onChange={(value) =>
                  setUserInput({ ...userInput, email: value })
                }
                info={invalidEmailInfo}
              />
            </LabeledInput>
            {errorMessage && <AlertBox title="Virhe" message={errorMessage} />}
            <FlexRowWithGaps>
              <Button
                primary
                type="submit"
                text={'Luo yrityskäyttäjä'}
                disabled={!isValid || isPending}
              ></Button>
            </FlexRowWithGaps>

            <FixedWidthDiv $cols={8}>
              <InfoBox
                message={`Kun käyttäjä on luotu lähetetään käyttäjälle automaattisesti sähköposti,
               joka sisältää luontotietoportaalin osoitteen sekä kirjautumiseen vaadittavat tunnukset.`}
              ></InfoBox>
            </FixedWidthDiv>
          </GroupOfInputRows>
        </form>
      </SectionContainer>
      <VerticalGap $size="XL" />
    </PageContainer>
  )
})
