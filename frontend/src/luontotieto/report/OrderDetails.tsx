// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faPen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useGetOrderFilesQuery } from 'api/hooks/orders'
import { apiGetOrderFileUrl, Order } from 'api/order-api'
import { getDocumentTypeTitle } from 'api/report-api'
import { hasOrdererRole, UserContext } from 'auth/UserContext'
import React, { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { LinkFileDownload } from 'shared/buttons/LinkFileDownload'
import { formatDate, parseDate } from 'shared/dates'
import styled from 'styled-components'

import {
  FlexCol,
  FlexRowWithGaps,
  SectionContainer,
  VerticalGap
} from '../../shared/layout'
import { H3, Label, P } from '../../shared/typography'

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

const GridLayout = styled.div<{ $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.$cols});
  gap: 24px;
  grid-auto-rows: minmax(100px, auto);
`

const GridItem = styled.div<{ $col: number; $row: number }>`
  grid-column: ${(props) => props.$col};
  grid-row: ${(props) => props.$row};

  label + p {
    margin-top: 4px;
  }
`

export const OrderDetails = React.memo(function OrderDetails(props: Props) {
  const navigate = useNavigate()
  const { user } = useContext(UserContext)
  const { order } = props

  const { data: orderFiles } = useGetOrderFilesQuery(order.id)

  const handleOrderFileClick = async (fileId: string) => {
    let url = ''
    url = await apiGetOrderFileUrl(order.id, fileId)
    if (url) {
      window.open(url)
    }
  }

  const showEditBtn = useMemo(() => hasOrdererRole(user), [user])

  const returnDateStr = useMemo(() => {
    const date = parseDate(order.returnDate, 'yyyy-MM-dd')
    return date && formatDate(date)
  }, [order])

  return (
    <SectionContainer>
      <FlexCol>
        <FlexRowWithGaps $gapSize="m">
          <H3>Tilauksen tiedot</H3>
          {showEditBtn && (
            <StyledIcon
              icon={faPen}
              onClick={() =>
                navigate(`/luontotieto/tilaus/${order.id}/muokkaa`, {
                  state: {
                    referer: `/luontotieto/selvitys/${props.reportId}`
                  }
                })
              }
            />
          )}
        </FlexRowWithGaps>
        <VerticalGap $size="m" />
        <GridLayout $cols={4}>
          <GridItem $col={1} $row={1}>
            <Label>Otsikko</Label>
            <P>{order.name}</P>
          </GridItem>
          <GridItem $col={2} $row={1}>
            <Label>Tilauksen kaavanumero</Label>
            <P>{order.planNumber?.join(', ')}</P>
          </GridItem>
          <GridItem $col={3} $row={1}>
            <Label>Selvitys palautettava viimeistään</Label>
            <P>{returnDateStr}</P>
          </GridItem>
          <GridItem $col={4} $row={1}>
            <Label>Selvityksen kuvaus</Label>
            <P>{order.description}</P>
          </GridItem>
          <GridItem $col={1} $row={2}>
            <Label>Selvityksen tekijä</Label>
            <P>{order.assignee}</P>
          </GridItem>
          <GridItem $col={2} $row={2}>
            <Label>Tilaajan yhteyshenkilö</Label>
            <P>
              {order.contactPerson}
              <br />
              {order.contactEmail}
              <br />
              {order.contactPhone}
              <br />
              {order.orderingUnit?.join(', ')}
            </P>
          </GridItem>
          <GridItem $col={3} $row={2}>
            <Label>Selvityksen tekijän yhteyshenkilö</Label>
            <P>
              {order.assigneeContactPerson}
              <br />
              {order.assigneeContactEmail}
            </P>
          </GridItem>
          <GridItem $col={4} $row={2}>
            <Label>Tilauksen liitteet</Label>
            {!!orderFiles &&
              orderFiles.map((rf) => (
                <StyledLi key={rf.id}>
                  <LinkFileDownload
                    fileName={rf.fileName}
                    fileId={rf.id}
                    onClick={(fileId) => handleOrderFileClick(fileId)}
                  />
                  {` ${getDocumentTypeTitle(rf.documentType)}`}
                </StyledLi>
              ))}
          </GridItem>
        </GridLayout>
      </FlexCol>
    </SectionContainer>
  )
})
