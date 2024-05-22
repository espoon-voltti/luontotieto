// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useCallback, useMemo, useState } from 'react'
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
import { getDocumentTypeTitle, ReportDetails } from 'api/report-api'
import { InputField } from 'shared/form/InputField'
import { SortableTh, Th } from 'shared/Table'
import { orderBy } from 'lodash'
import { Select } from 'shared/form/Select'
import { useDebouncedState } from 'shared/useDebouncedState'
import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { formatDateTime } from 'shared/dates'
import { useGetReportsQuery } from 'api/hooks/reports'

export type ReportSortColumn = 'updated' | 'name' | 'approved'
export type SortDirection = 'ASC' | 'DESC'

export const ReportList = React.memo(function ReportList() {
  const navigate = useNavigate()

  const { data: reports, isLoading } = useGetReportsQuery()

  const [sortBy, setSortBy] = useState<ReportSortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('ASC')
  const [filterByReportAssignee, setFilterByReportAssignee] = useState<
    string | null
  >(null)
  const [filterBySearchQuery, setFilterBySearchQuery] = useDebouncedState<
    string | null
  >(null)

  const reportAssignees = useMemo(() => {
    const assignees = (reports ?? [])
      .flatMap((r) =>
        r.order?.assignee !== undefined ? r.order?.assignee : []
      )
      .sort()

    return [null, ...new Set(assignees)]
  }, [reports])

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

  if (isLoading || !reports) {
    //TODO: What we want to show when loading?
    return null
  }

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
                sorted={isSorted('updated')}
                onClick={toggleSort('updated')}
              >
                Viimeksi päivitetty
              </SortableTh>
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
              <Th style={{ width: '300px' }}>TILAUKSEN KAAVANUMERO</Th>
              <Th style={{ width: '160px' }}>Luontotyypit</Th>
              <Th style={{ width: '80px' }}>
                SELVITYKSEN TEKIJÄ
                <Select
                  selectedItem={filterByReportAssignee}
                  items={reportAssignees ?? []}
                  getItemLabel={(u) => u ?? 'Valitse'}
                  onChange={setFilterByReportAssignee}
                ></Select>
              </Th>
            </tr>
          </thead>
          <tbody>
            {orderReports(reports).map((report) => (
              <tr key={report.id}>
                <td>{formatDateTime(report.updated)}</td>

                <td>{report.approved ? 'Hyväksytty' : 'Lähetetty'}</td>
                <td>
                  <Link to={`/luontotieto/selvitys/${report.id}/muokkaa`}>
                    {report.order?.name ?? report.name}
                  </Link>
                </td>
                <td>{report.order?.planNumber?.toString() ?? '-'}</td>

                <td>
                  {report.order?.reportDocuments.map((r) =>
                    getDocumentTypeTitle(r.documentType)
                  )}
                </td>
                <td>{report.order?.assignee}</td>
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
  const assigneeLower = assignee ? assignee.toLowerCase() : null
  return reports.filter((report) => {
    if (searchQueryToLower) {
      return (
        (report.name.toLowerCase().includes(searchQueryToLower) ||
          report.description.toLowerCase().includes(searchQueryToLower) ||
          (report.order &&
            report.order.assignee.toLowerCase().includes(searchQueryToLower)) ||
          (report.order &&
            searchQueryToLower &&
            report.order.planNumber
              ?.toString()
              .toLowerCase()
              .includes(searchQueryToLower))) &&
        (assigneeLower
          ? report.order &&
            report.order.assignee.toLowerCase().includes(assigneeLower)
          : true)
      )
    } else if (assigneeLower) {
      return (
        report.order &&
        assigneeLower &&
        report.order.assignee.toLowerCase().includes(assigneeLower)
      )
    }
    return true
  })
}
