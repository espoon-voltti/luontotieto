// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faChevronLeft } from '@fortawesome/free-solid-svg-icons'
import React from 'react'
import { useNavigate } from 'react-router'
import { FlexColWithGaps, SectionContainer, VerticalGap } from 'shared/layout'
import { BaseProps } from 'shared/theme'
import { H2 } from 'shared/typography'

import { InlineButton } from './InlineButton'

interface Props extends BaseProps {
  text?: string
  navigationText?: string
  destination?: string
}

export const BackNavigation = React.memo(function BackNavigation({
  'data-qa': dataQa,
  ...props
}: Props) {
  const navigate = useNavigate()

  return (
    <>
      <SectionContainer>
        <FlexColWithGaps $gapSize="s">
          <InlineButton
            data-qa={dataQa}
            icon={faChevronLeft}
            text={props.navigationText ?? 'Takaisin'}
            onClick={() => navigate(props.destination ?? '/luontotieto')}
          />
          {!!props.text && <H2>{props.text}</H2>}
        </FlexColWithGaps>
      </SectionContainer>
      <VerticalGap $size="m" />
    </>
  )
})
