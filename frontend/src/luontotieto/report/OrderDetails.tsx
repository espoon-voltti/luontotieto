// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faPen } from '@fortawesome/free-solid-svg-icons'
import { useGetOrderFilesQuery } from 'api/hooks/orders'
import { apiGetOrderFileUrl, Order } from 'api/order-api'
import { getDocumentTypeTitle } from 'api/report-api'
import { hasOrdererRole, UserContext } from 'auth/UserContext'
import React, { useContext, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { IconButton } from 'shared/buttons/IconButton'
import { LinkFileDownload } from 'shared/buttons/LinkFileDownload'
import { formatDate, parseDate } from 'shared/dates'
import useDownloadFile from 'shared/form/File/useDownloadFile'
import InfoModal from 'shared/modals/InfoModal'
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

  const { downloadFile, acknowledgeError, errorMessage } =
    useDownloadFile(apiGetOrderFileUrl)

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
            <IconButton
              aria-label="Muokkaa tilausta"
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
            <Label>Maankäytön suunnitelmat</Label>
            <P>{order.planNumber?.join(', ')}</P>
          </GridItem>
          <GridItem $col={3} $row={1}>
            <Label>Selvitys palautettava viimeistään</Label>
            <P>{returnDateStr}</P>
          </GridItem>
          <GridItem $col={4} $row={1}>
            <Label>Tilausvuosi</Label>
            <P>{order.year}</P>
          </GridItem>
          <GridItem $col={1} $row={2}>
            <Label>Selvityksen kuvaus</Label>
            <P>{order.description}</P>
          </GridItem>
          <GridItem $col={2} $row={2}>
            <Label>Tilaaja ja yhteyshenkilö</Label>
            <P>
              {order.orderingUnit && order.orderingUnit.length > 0
                ? order.orderingUnit.join(', ')
                : '-'}
              <br aria-hidden />
              <br aria-hidden />
              {order.contactPerson}
              <br aria-hidden />
              {order.contactEmail}
              <br aria-hidden />
              {order.contactPhone}
            </P>
          </GridItem>
          <GridItem $col={3} $row={2}>
            <Label>Selvityksen tekijä ja yhteyshenkilö</Label>
            <P>
              {order.assigneeRole === 'CUSTOMER' || !order.assigneeCompanyName
                ? order.assignee
                : `${order.assigneeCompanyName} (${order.assignee})`}
              <br aria-hidden />
              <br aria-hidden />
              {!!order.assigneeCompanyName && (
                <>
                  {order.assigneeCompanyName} <br aria-hidden />
                </>
              )}
              {order.assigneeContactPerson}
              <br aria-hidden />
              {order.assigneeContactEmail}
            </P>
          </GridItem>
          <GridItem $col={1} $row={3}>
            <Label>Tilauksen liitteet</Label>
            {!!orderFiles &&
              orderFiles.map((rf) => (
                <StyledLi key={rf.id}>
                  <LinkFileDownload
                    fileName={rf.fileName}
                    fileId={rf.id}
                    onClick={(fileId) => downloadFile(order.id, fileId)}
                  />
                  {` ${getDocumentTypeTitle(rf.documentType)}`}
                </StyledLi>
              ))}
          </GridItem>
        </GridLayout>
      </FlexCol>
      {!!errorMessage && (
        <InfoModal
          close={() => acknowledgeError()}
          closeLabel="Sulje"
          title="Virhe ladattaessa tiedostoa"
          resolve={{
            action: () => {
              acknowledgeError()
            },
            label: 'Ok'
          }}
        >
          {errorMessage}
        </InfoModal>
      )}
    </SectionContainer>
  )
})
