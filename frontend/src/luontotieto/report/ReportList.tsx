// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AddButton } from 'shared/buttons/AddButton'

import {
  FlexLeftRight,
  FlexRowWithGaps,
  PageContainer,
  SectionContainer,
  Table,
  VerticalGap
} from '../../shared/layout'
import { ReportDetails, apiGetReports } from 'api/report-api'
import { InputField } from 'shared/form/InputField'
import { SortableTh, Th } from 'shared/Table'
import { orderBy } from 'lodash'
import { Select } from 'shared/form/Select'
import { useDebouncedState } from 'shared/useDebouncedState'
import { faSearch } from '@fortawesome/free-solid-svg-icons'

export type ReportSortColumn = 'name' | 'approved'
export type SortDirection = 'ASC' | 'DESC'

export const ReportList = React.memo(function ReportList() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<ReportDetails[]>([])

  const [sortBy, setSortBy] = useState<ReportSortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('ASC')
  const [filterByReportAssignee, setFilterByReportAssignee] = useState<
    string | null
  >(null)
  const [filterBySearchQuery, setFilterBySearchQuery] = useDebouncedState<
    string | null
  >(null)

  const isSorted = (column: ReportSortColumn) =>
    sortBy === column ? sortDirection : undefined

  const toggleSort = (column: ReportSortColumn) => () => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(column)
      setSortDirection('ASC')
    }
  }

  const orderReports = useCallback(
    (reports: ReportDetails[]) => {
      const filtered = filterReports(
        reports,
        filterBySearchQuery,
        filterByReportAssignee
      )
      console.log('filtered:', filtered)

      return sortBy === null
        ? filtered
        : orderBy(
            filtered,
            [sortBy],
            [sortDirection === 'ASC' ? 'asc' : 'desc']
          )
    },
    [sortBy, sortDirection, filterByReportAssignee, filterBySearchQuery]
  )

  useEffect(() => {
    void apiGetReports().then(setReports)
  }, [])

  return (
    <PageContainer>
      <SectionContainer>
        <VerticalGap $size="m" />
        <FlexLeftRight>
          <FlexRowWithGaps $gapSize="s">
            <InputField
              onChange={setFilterBySearchQuery}
              value={filterBySearchQuery ?? ''}
              placeholder="Haku"
              icon={faSearch}
              clearable={true}
              backgroundColor="#F7F7F7"
            />
          </FlexRowWithGaps>

          <AddButton
            text="Lisää selvitys"
            onClick={() => navigate('/luontotieto/tilaus/uusi')}
            data-qa="create-report-button"
          />
        </FlexLeftRight>

        <VerticalGap $size="L" />

        <Table style={{ width: '100%' }}>
          <thead>
            <tr>
              <SortableTh
                sorted={isSorted('approved')}
                onClick={toggleSort('approved')}
              >
                TILA
              </SortableTh>
              <SortableTh
                sorted={isSorted('name')}
                onClick={toggleSort('name')}
              >
                TILAUKSEN NIMI
              </SortableTh>
              <Th>TILAUKSEN KAAVANUMERO</Th>
              <Th style={{ width: '160px' }}>YHTEENVETO</Th>
              <Th style={{ width: '80px' }}>
                SELVITYKSEN TEKJÄ
                <Select
                  selectedItem={filterByReportAssignee}
                  items={['', 'Luontotietokonsultit Oy', 'Kuka']}
                  onChange={setFilterByReportAssignee}
                ></Select>
              </Th>
            </tr>
          </thead>
          <tbody>
            {orderReports(reports).map((report) => (
              <tr key={report.id}>
                <td>{report.approved ? 'Hyväksytty' : 'Lähetetty'}</td>
                <td>
                  <Link to={`/luontotieto/selvitys/${report.id}/muokkaa`}>
                    {report.order?.name ?? report.name}
                  </Link>
                </td>
                <td>{report.order?.planNumber?.toString() ?? '-'}</td>

                <td>{report.description}</td>
                <td>Luontoselvityskonsultit Oy</td>
              </tr>
            ))}
            {reports.length == 0 && (
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

const filterReports = (
  reports: ReportDetails[],
  searchQuery: string | null,
  assignee: string | null
) => {
  const searchQueryToLower = searchQuery ? searchQuery.toLowerCase() : null
  console.log(reports)
  console.log(searchQueryToLower)
  //TODO: we do not yet support assignee at the report data schema level so mock the filtering to return true
  return reports.filter((report) => {
    if (searchQueryToLower === null && assignee === null) {
      return true
    }
    if (searchQueryToLower) {
      return (
        report.name.toLowerCase().includes(searchQueryToLower) ||
        report.description.toLowerCase().includes(searchQueryToLower)
      )
    }
    return true
  })
}
