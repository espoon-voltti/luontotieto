// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { FormEvent, useCallback, useState } from 'react'
import { InputField } from 'shared/form/InputField'
import { useDebouncedState } from 'shared/useDebouncedState'

import {
  GroupOfInputRows,
  LabeledInput,
  RowOfInputs,
  SectionContainer,
  VerticalGap
} from '../shared/layout'
import { H2, Label } from '../shared/typography'

import { PageContainer } from 'shared/layout'
import { Button } from 'shared/buttons/Button'
import { InlineButton } from 'shared/buttons/InlineButton'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import styled from 'styled-components'
import { colors } from '../shared/theme'
import { apiPostLogin } from '../api/auth-api'

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
    onSuccess: async (success: boolean) => {
      if (success) {
        await queryClient.invalidateQueries({ queryKey: ['auth-status'] })
        navigate('/luontotieto')
      } else {
        setErrorMsg('Virheellinen sähköposti tai salasana!')
      }
    },
    onError: () => setErrorMsg('Virheellinen sähköposti tai salasana!')
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
        <SectionContainer $sidePadding="62px">
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
            {errorMsg && <LoginMessage>{errorMsg}</LoginMessage>}
            <Button
              text="Kirjaudu sisään"
              primary
              disabled={!email || !password || isPending}
              type="submit"
            />
            <InlineButton
              text={'Unohdin salasanan'}
              onClick={() => console.log('Forgot pw')}
            />
          </GroupOfInputRows>
        </SectionContainer>
      </form>
    </PageContainer>
  )
})
