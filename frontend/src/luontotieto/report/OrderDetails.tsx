// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useEffect, useState } from 'react'

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

import {
  Order,
  OrderFile,
  apiGetOrderFileUrl,
  apiGetOrderFiles
} from 'api/order-api'
import styled from 'styled-components'
import { getDocumentTypeTitle } from 'api/report-api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'

type Props = { order: Order; reportId: string }

const StyledLi = styled.li`
  &::marker {
    color: #0050bb;
    margin-right: 0.5ch;
  }
`
const StyledLink = styled.a`
  font-weight: bold;
`

const StyledIcon = styled(FontAwesomeIcon)`
  cursor: pointer;
`

export const OrderDetails = React.memo(function OrderDetails(props: Props) {
  const navigate = useNavigate()
  const { order } = props
  const [orderFiles, setOrderFiles] = useState<OrderFile[] | null>(null)

  const handleOrderFileClick = async (fileId: string) => {
    let url = ''
    url = await apiGetOrderFileUrl(order.id, fileId)
    if (url) {
      window.open(url)
    }
  }

  useEffect(() => {
    void apiGetOrderFiles(order.id).then(setOrderFiles)
  }, [order])

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
              Luontoselvityskonsultit Oy
            </LabeledInput>
          </RowOfInputs>
          <RowOfInputs>
            <LabeledInput>
              <Label>Tilauksen liitteet</Label>
              {orderFiles !== null &&
                orderFiles.map((rf) => (
                  <StyledLi key={rf.id}>
                    <StyledLink
                      onClick={() => handleOrderFileClick(rf.id)}
                    >{`${rf.fileName}`}</StyledLink>
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
