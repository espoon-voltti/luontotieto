// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import React, { FormEvent, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AccessibilityFooter from 'shared/AccessibilityFooter'
import { Button } from 'shared/buttons/Button'
import { InputField } from 'shared/form/InputField'
import { PageContainer } from 'shared/layout'
import { useDebouncedState } from 'shared/useDebouncedState'
import styled from 'styled-components'

import { LoginError, LoginErrorCode, apiPostLogin } from '../api/auth-api'
import {
  GroupOfInputRows,
  LabeledInput,
  RowOfInputs,
  SectionContainer,
  VerticalGap
} from '../shared/layout'
import { colors } from '../shared/theme'
import { H2, Label } from '../shared/typography'

const LoginMessage = styled.label`
  color: ${colors.status.danger};
`

export const UserLoginPage = React.memo(function UserLoginPage() {
  const [email, setEmail] = useDebouncedState('')

  const [password, setPassword] = useDebouncedState('')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { mutateAsync: loginMutation, isPending } = useMutation({
    mutationFn: apiPostLogin,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth-status'] })
      navigate('/luontotieto')
    },
    onError: (e: AxiosError<{ errorCode: LoginErrorCode }>) => {
      if (e instanceof AxiosError) {
        const errorCode = e.response?.data.errorCode
        const errorMessage = errorCode
          ? LoginError[errorCode]
          : 'Virheellinen sähköposti tai salasana!'
        setErrorMsg(errorMessage)
      }
    }
  })

  const onSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      await loginMutation({ email, password })
    },
    [loginMutation, email, password]
  )

  return (
    <PageContainer>
      <form onSubmit={onSubmit}>
        <SectionContainer>
          <H2>Kirjaudu sisään</H2>
          <VerticalGap $size="L" />
          <GroupOfInputRows>
            <RowOfInputs>
              <LabeledInput $cols={3}>
                <Label>Sähköposti</Label>
                <InputField onChange={setEmail} value={email} type="email" />
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
            {!!errorMsg && <LoginMessage>{errorMsg}</LoginMessage>}
            <Button
              text="Kirjaudu sisään"
              primary
              disabled={!email || !password || isPending}
              type="submit"
            />
          </GroupOfInputRows>
        </SectionContainer>
      </form>
      <AccessibilityFooter />
    </PageContainer>
  )
})
