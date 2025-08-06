// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faDownload, faSearch } from '@fortawesome/free-solid-svg-icons'
import { useGetReportsQuery } from 'api/hooks/reports'
import {
  apiGetReportsAsCsv,
  getDocumentTypeTitle,
  ReportDetails
} from 'api/report-api'
import orderBy from 'lodash/orderBy'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import AccessibilityFooter from 'shared/AccessibilityFooter'
import { SortableTh, Th } from 'shared/Table'
import { AddButton } from 'shared/buttons/AddButton'
import { InlineButton } from 'shared/buttons/InlineButton'
import { formatDateTime } from 'shared/dates'
import { DateRange } from 'shared/form/DateRange'
import { InputField } from 'shared/form/InputField'
import { Select } from 'shared/form/Select'
import InfoModal, { InfoModalStateProps } from 'shared/modals/InfoModal'
import { H2, Label, P } from 'shared/typography'
import { useDebouncedState } from 'shared/useDebouncedState'
import styled from 'styled-components'

import { hasOrdererRole, UserContext } from '../../auth/UserContext'
import {
  FlexCol,
  FlexLeftRight,
  FlexRow,
  FlexRowWithGaps,
  LabeledInput,
  PageContainerWider,
  SectionContainer,
  Table,
  VerticalGap
} from '../../shared/layout'

export type ReportSortColumn = 'updated' | 'name' | 'approved'
export type SortDirection = 'ASC' | 'DESC'

export const ReportListPage = React.memo(function ReportList() {
  const navigate = useNavigate()
  const { user } = useContext(UserContext)

  const { data: reports, isLoading } = useGetReportsQuery()

  const [isLoadingReportCsv, setIsLoadingReportCsv] = useState(false)

  const [sortBy, setSortBy] = useState<ReportSortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('ASC')
  const [filterByReportAssignee, setFilterByReportAssignee] = useState<
    string | null
  >(null)
  const [filterByOrderingUnit, setFilterByOrderingUnit] = useState<
    string | null
  >(null)
  const [filterBySearchQuery, setFilterBySearchQuery] = useDebouncedState<
    string | null
  >(null)

  const [showModal, setShowModal] = useState<InfoModalStateProps | null>(null)

  const [reportInputDateRange, setReportInputDateRange] = useState({
    startDate: '',
    endDate: ''
  })
  const dateRange = useMemo(() => reportInputDateRange, [reportInputDateRange])

  const isOrderOrAdmin = useMemo(() => hasOrdererRole(user), [user])

  const reportAssignees = useMemo(() => {
    const assignees = (reports ?? [])
      .flatMap((r) =>
        r.order?.assigneeCompanyName
          ? r.order.assigneeCompanyName
          : r.order?.assignee !== undefined
            ? r.order?.assignee
            : []
      )
      .sort()

    return [null, ...new Set(assignees)]
  }, [reports])

  const orderingUnits = useMemo(() => {
    const units = (reports ?? [])
      .flatMap((r) => r.order?.orderingUnit ?? [])
      .sort()

    return [null, ...new Set(units)]
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
        filterByReportAssignee,
        filterByOrderingUnit
      )

      return sortBy === null
        ? filtered
        : orderBy(
            filtered,
            [sortBy],
            [sortDirection === 'ASC' ? 'asc' : 'desc']
          )
    },
    [
      sortBy,
      sortDirection,
      filterByReportAssignee,
      filterByOrderingUnit,
      filterBySearchQuery
    ]
  )

  if (isLoading || !reports) {
    //TODO: What we want to show when loading?
    return null
  }

  return (
    <PageContainerWider>
      <SectionContainer>
        <H2>Selvitykset</H2>
        <VerticalGap $size="m" />
        <FlexLeftRight>
          <FlexRowWithGaps $gapSize="s">
            <InputField
              onChange={setFilterBySearchQuery}
              value={filterBySearchQuery ?? ''}
              placeholder="Haku"
              icon={faSearch}
              $clearable={true}
              backgroundColor="#F7F7F7"
              width="L"
            />
          </FlexRowWithGaps>
          <FlexRow>
            {isOrderOrAdmin && (
              <StyledInlineButton
                onClick={() => {
                  setShowModal({
                    title: 'Lataa raportti selvityksistä'
                  })
                }}
                text="Lataa raportti"
              />
            )}
            {isOrderOrAdmin && (
              <AddButton
                text="Lisää selvitys"
                onClick={() => navigate('/luontotieto/tilaus/uusi')}
                data-qa="create-report-button"
              />
            )}
          </FlexRow>
        </FlexLeftRight>

        <VerticalGap $size="L" />

        <Table style={{ width: '100%' }}>
          <thead>
            <tr>
              <SortableTh
                sorted={isSorted('updated')}
                onClick={toggleSort('updated')}
                $minimalWidth
              >
                Viimeksi päivitetty
              </SortableTh>
              <SortableTh
                sorted={isSorted('approved')}
                onClick={toggleSort('approved')}
                $minimalWidth
              >
                TILA
              </SortableTh>
              <SortableTh
                sorted={isSorted('name')}
                onClick={toggleSort('name')}
              >
                TILAUKSEN NIMI
              </SortableTh>
              <Th style={{ width: '220px' }}>MAANKÄYTÖN SUUNNITELMAT</Th>
              <Th style={{ width: '280px' }}>SELVITETTÄVÄT ASIAT</Th>
              <Th style={{ width: '150px' }}>
                <FlexCol
                  style={{ justifyContent: 'space-between', height: '80px' }}
                >
                  <div>SELVITYKSEN TEKIJÄ</div>
                  <Select
                    selectedItem={filterByReportAssignee}
                    items={reportAssignees ?? []}
                    getItemLabel={(u) => u ?? 'Valitse'}
                    onChange={setFilterByReportAssignee}
                  />
                </FlexCol>
              </Th>
              <Th style={{ width: '150px' }}>
                <FlexCol
                  style={{ justifyContent: 'space-between', height: '80px' }}
                >
                  <div>TILAAJATAHO</div>
                  <Select
                    selectedItem={filterByOrderingUnit}
                    items={orderingUnits ?? []}
                    getItemLabel={(u) => u ?? 'Valitse'}
                    onChange={setFilterByOrderingUnit}
                  />
                </FlexCol>
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
                <td>
                  {report.order?.assigneeCompanyName ?? report.order?.assignee}
                </td>
                <td>{report.order?.orderingUnit?.join(', ') ?? ''}</td>
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
      <AccessibilityFooter />
      {showModal && (
        <InfoModal
          close={() => setShowModal(null)}
          closeLabel="Sulje"
          title={showModal.title}
          width="wide"
        >
          <>
            <P>
              Raportti listaa selvitystilaukset ja niihin liittyviä tietoja
              .csv-muodossa. Raportin voi avata esim. Excelissä.
            </P>
            <VerticalGap $size="m" />
            <P>Raportti ei sisällä selvitystilausten liitetiedostoja.</P>
            <VerticalGap $size="m" />
            <LabeledInput>
              <Label>
                Lataa raportti selvityksistä, joiden tilaus on luotu aikavälillä
              </Label>
              <DateRange
                start={dateRange.startDate}
                end={dateRange.endDate}
                onChange={(data) => setReportInputDateRange(data)}
              />
            </LabeledInput>
            <VerticalGap $size="L" />
            <InlineButton
              icon={faDownload}
              text="Lataa raportti"
              disabled={isLoadingReportCsv}
              onClick={async () => {
                setIsLoadingReportCsv(true)
                await apiGetReportsAsCsv(dateRange).finally(() =>
                  setIsLoadingReportCsv(false)
                )
              }}
            />
          </>
        </InfoModal>
      )}
    </PageContainerWider>
  )
})

const filterReports = (
  reports: ReportDetails[],
  searchQuery: string | null,
  assignee: string | null,
  orderingUnit: string | null
) => {
  const searchQueryToLower = searchQuery ? searchQuery.toLowerCase() : null
  const assigneeLower = assignee ? assignee.toLowerCase() : null
  const unitLower = orderingUnit ? orderingUnit.toLowerCase() : null
  return reports.filter((report) => {
    const reportMainAssignee =
      report.order.assigneeCompanyName?.toLowerCase() ??
      report.order.assignee.toLowerCase()

    const searchQueryMatch = searchQueryToLower
      ? (report.name.toLowerCase().includes(searchQueryToLower) ||
          reportMainAssignee.includes(searchQueryToLower) ||
          report.order.planNumber
            ?.toString()
            .toLowerCase()
            .includes(searchQueryToLower) ||
          report.reportDocumentsString
            ?.toLowerCase()
            .includes(searchQueryToLower)) &&
        (assigneeLower ? reportMainAssignee.includes(assigneeLower) : true)
      : true

    const assigneeMatch = assigneeLower
      ? report.order && reportMainAssignee.includes(assigneeLower)
      : true

    const unitMatch = unitLower
      ? (report.order.orderingUnit?.includes(unitLower) ?? false)
      : true

    return searchQueryMatch && assigneeMatch && unitMatch
  })
}

const StyledInlineButton = styled(InlineButton)`
  margin-right: 32px;
`
