// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faSearch } from '@fortawesome/free-solid-svg-icons'
import { useGetReportsQuery } from 'api/hooks/reports'
import { getDocumentTypeTitle, ReportDetails } from 'api/report-api'
import orderBy from 'lodash/orderBy'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SortableTh, Th } from 'shared/Table'
import { AddButton } from 'shared/buttons/AddButton'
import { formatDateTime } from 'shared/dates'
import { InputField } from 'shared/form/InputField'
import { Select } from 'shared/form/Select'
import { useDebouncedState } from 'shared/useDebouncedState'

import { hasOrdererRole, UserContext } from '../../auth/UserContext'
import {
  FlexLeftRight,
  FlexRowWithGaps,
  PageContainer,
  SectionContainer,
  Table,
  VerticalGap
} from '../../shared/layout'

export type ReportSortColumn = 'updated' | 'name' | 'approved'
export type SortDirection = 'ASC' | 'DESC'

export const ReportList = React.memo(function ReportList() {
  const navigate = useNavigate()
  const { user } = useContext(UserContext)

  const { data: reports, isLoading } = useGetReportsQuery()

  const [sortBy, setSortBy] = useState<ReportSortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('ASC')
  const [filterByReportAssignee, setFilterByReportAssignee] = useState<
    string | null
  >(null)
  const [filterBySearchQuery, setFilterBySearchQuery] = useDebouncedState<
    string | null
  >(null)

  const showAddButton = useMemo(() => hasOrdererRole(user), [user])

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

          {showAddButton && (
            <AddButton
              text="Lisää selvitys"
              onClick={() => navigate('/luontotieto/tilaus/uusi')}
              data-qa="create-report-button"
            />
          )}
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
              <Th style={{ width: '160px' }}>TILAUKSEN KAAVANUMERO</Th>
              <Th style={{ width: '300px' }}>Luontotyypit</Th>
              <Th style={{ width: '80px' }}>
                SELVITYKSEN TEKIJÄ
                <Select
                  selectedItem={filterByReportAssignee}
                  items={reportAssignees ?? []}
                  getItemLabel={(u) => u ?? 'Valitse'}
                  onChange={setFilterByReportAssignee}
                />
              </Th>
            </tr>
          </thead>
          <tbody>
            {orderReports(reports).map((report) => (
              <tr key={report.id}>
                <td>{formatDateTime(report.updated)}</td>
                <td>{report.approved ? 'Hyväksytty' : 'Lähetetty'}</td>
                <td>
                  <Link to={`/luontotieto/selvitys/${report.id}`}>
                    {report.order?.name ?? report.name}
                  </Link>
                </td>
                <td>{report.order?.planNumber?.toString() ?? '-'}</td>
                <td>
                  <ul>
                    {report.order?.reportDocuments.map((r, index) => (
                      <li key={index}>
                        {getDocumentTypeTitle(r.documentType)}
                      </li>
                    ))}
                  </ul>
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
          report.order.assignee.toLowerCase().includes(searchQueryToLower) ||
          report.order.planNumber
            ?.toString()
            .toLowerCase()
            .includes(searchQueryToLower) ||
          report.reportDocumentsString
            ?.toLowerCase()
            .includes(searchQueryToLower)) &&
        (assigneeLower
          ? report.order.assignee.toLowerCase().includes(assigneeLower)
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
