// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faPen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useGetOrderFilesQuery } from 'api/hooks/orders'
import { apiGetOrderFileUrl, Order } from 'api/order-api'
import { getDocumentTypeTitle } from 'api/report-api'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LinkFileDownload } from 'shared/buttons/LinkFileDownload'
import styled from 'styled-components'

import {
  FlexCol,
  FlexRowWithGaps,
  GroupOfInputRows,
  LabeledInput,
  RowOfInputs,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { H3, Label } from '../../shared/typography'

type Props = { order: Order; reportId: string }

const StyledLi = styled.li`
  &::marker {
    color: #0050bb;
    margin-right: 0.5ch;
  }
`

const StyledIcon = styled(FontAwesomeIcon)`
  cursor: pointer;
`

export const OrderDetails = React.memo(function OrderDetails(props: Props) {
  const navigate = useNavigate()
  const { order } = props

  const { data: orderFiles } = useGetOrderFilesQuery(order.id)

  const handleOrderFileClick = async (fileId: string) => {
    let url = ''
    url = await apiGetOrderFileUrl(order.id, fileId)
    if (url) {
      window.open(url)
    }
  }

  return (
    <SectionContainer>
      <FlexCol>
        <FlexRowWithGaps $gapSize="m">
          <H3>Tilauksen tiedot</H3>
          <StyledIcon
            icon={faPen}
            onClick={() =>
              navigate(`/luontotieto/tilaus/${order.id}/muokkaa`, {
                state: {
                  referer: `/luontotieto/selvitys/${props.reportId}/muokkaa`
                }
              })
            }
          />
        </FlexRowWithGaps>

        <VerticalGap $size="m" />
        <GroupOfInputRows>
          <RowOfInputs>
            <LabeledInput>
              <Label>Otsikko</Label>
              {order.name}
            </LabeledInput>
            <LabeledInput>
              <Label>Tilauksen kaavanumero</Label>
              {order.planNumber}
            </LabeledInput>
            <LabeledInput>
              <Label>Tilauksen kuvaus</Label>
              {order.description}
            </LabeledInput>
            <LabeledInput>
              <Label>Selvityksen tekijä</Label>
              {order.assignee}
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput>
              <Label>Tilauksen liitteet</Label>
              {!!orderFiles &&
                orderFiles.map((rf) => (
                  <StyledLi key={rf.id}>
                    <LinkFileDownload
                      fileName={rf.fileName}
                      fileId={rf.id}
                      onClick={(fileId) => handleOrderFileClick(fileId)}
                    />
                    {`, ${getDocumentTypeTitle(rf.documentType)}`}
                  </StyledLi>
                ))}
            </LabeledInput>
          </RowOfInputs>
        </GroupOfInputRows>
      </FlexCol>
    </SectionContainer>
  )
})
