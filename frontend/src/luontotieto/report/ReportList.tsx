// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { ReportDetails, apiGetReports } from 'api'
import { StatusChip } from 'luontotieto/cases/StatusChip'
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AddButton } from 'shared/buttons/AddButton'
import { FilterButton } from 'shared/buttons/FilterButton'
import { formatDate } from 'shared/dates'
import styled from 'styled-components'

import {
  FlexLeftRight,
  FlexRowWithGaps,
  PageContainer,
  SectionContainer,
  Table,
  VerticalGap
} from '../../shared/layout'
import { H3 } from '../../shared/typography'

export const ReportList = React.memo(function ReportList() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<ReportDetails[]>([])
  const [showAll, setShowAll] = useState(false)

  const reportsToDisplay = reports.filter((r) => (showAll ? true : r.approved))

  useEffect(() => {
    void apiGetReports().then(setReports)
  }, [])

  return (
    <PageContainer>
      <SectionContainer>
        <H3>Näytetttävät selvitykset</H3>
        <VerticalGap $size="m" />
        <FlexLeftRight>
          <FlexRowWithGaps $gapSize="s">
            <FilterButton
              text="Näytä avoimet"
              selected={!showAll}
              onClick={(selected) => {
                setShowAll(selected)
              }}
            />
          </FlexRowWithGaps>

          <AddButton
            text="Lisää selvitys"
            onClick={() => navigate('/luontotieto/selvitys/uusi')}
            data-qa="create-report-button"
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
              <Th style={{ width: '80px' }}>Tila</Th>
            </tr>
          </thead>
          <tbody>
            {reportsToDisplay.map((report) => (
              <tr key={report.id}>
                <td>{report.created ? formatDate(report.created) : '-'}</td>
                <td>
                  <Link to={`/luontotieto/selvitys/${report.id}`}>
                    {report.name}
                  </Link>
                </td>
                <td>{report.createdBy}</td>

                <td>{formatDate(report.updated)}</td>
                <td>
                  <StatusChip approved={report.approved} />
                </td>
              </tr>
            ))}
            {reportsToDisplay.length == 0 && (
              <tr>
                <td colSpan={4}>Ei näytettäviä selvityksiä</td>
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
