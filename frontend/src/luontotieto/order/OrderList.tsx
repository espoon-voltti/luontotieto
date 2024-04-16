// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AddButton } from 'shared/buttons/AddButton'
import { formatDate } from 'shared/dates'
import styled from 'styled-components'

import {
  FlexLeftRight,
  PageContainer,
  SectionContainer,
  Table,
  VerticalGap
} from '../../shared/layout'
import { H3 } from '../../shared/typography'
import { Order, apiGetOrders } from 'api/order-api'

export const OrderList = React.memo(function OrderList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    void apiGetOrders().then(setOrders)
  }, [])

  return (
    <PageContainer>
      <SectionContainer>
        <FlexLeftRight>
          <H3>Näytettävät tilaukset</H3>
          <AddButton
            text="Luo uusi tilaus"
            onClick={() => navigate('/luontotieto/tilaus/uusi')}
            data-qa="create-order-button"
          />
        </FlexLeftRight>

        <VerticalGap $size="L" />

        <Table style={{ width: '100%' }}>
          <thead>
            <tr>
              <Th style={{ width: '160px' }}>Luotu</Th>
              <Th>Nimi</Th>
              <Th>Luoja</Th>
              <Th style={{ width: '160px' }}>Päivitetty</Th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.created ? formatDate(order.created) : '-'}</td>
                <td>
                  <Link to={`/luontotieto/tilaus/${order.id}`}>
                    {order.name}
                  </Link>
                </td>
                <td>{order.createdBy}</td>

                <td>{formatDate(order.updated)}</td>
              </tr>
            ))}
            {orders.length == 0 && (
              <tr>
                <td colSpan={4}>Ei näytettäviä tilauksia</td>
              </tr>
            )}
          </tbody>
        </Table>
      </SectionContainer>
    </PageContainer>
  )
})

const Th = styled.th`
  text-align: left;
`
