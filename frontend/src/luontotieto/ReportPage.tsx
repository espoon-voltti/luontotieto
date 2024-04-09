// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  ReportDetails,
  ReportFileDetails,
  apiApproveReport,
  apiGetReport,
  apiGetReportFiles
} from 'api'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { FlexRight, PageContainer, SectionContainer, VerticalGap } from '../shared/layout'
import { H1, Label } from '../shared/typography'
import { Button } from 'shared/buttons/Button'

export const ReportPage = React.memo(function ReportPage() {
  const { id } = useParams()
  if (!id) throw Error('Id not found in path')
  const [report, setReport] = useState<ReportDetails | null>(null)
  const [reportFiles, setReportFiles] = useState<ReportFileDetails[]>([])

  const [approving, setApproving] = useState<boolean>(false)


  useEffect(() => {
    void apiGetReport(id).then(setReport)
    void apiGetReportFiles(id).then(setReportFiles)
  }, [id])
  return (
    <PageContainer>
      <SectionContainer>
        <H1>Selvitys</H1> {report?.approved  && (<>Hyväksytty</>)}
        <VerticalGap $size="L" />
        <Label>Nimi:</Label> {report?.name}
        <VerticalGap />
        <Label>Kuvaus:</Label> {report?.description}
        <VerticalGap />
        <Label>Tiedostot:</Label>
        <ul>
          {reportFiles.map((rf) => (
            <li key={rf.id}>
              <code>{`${rf.fileName} :: ${rf.mediaType} :: ${rf.documentType}`}</code>
            </li>
          ))}
        </ul>
        <VerticalGap />
        <FlexRight>
          <Button
            text="Hyväksy"
            data-qa="approve-button"
            primary
            disabled={!report || approving || report.approved}
            onClick={() => {
              if (!report) return

              setApproving(true)
              apiApproveReport(report.id)
                .then(() =>
                  alert("Hyväksytty ja tiedostot lähetetty PostGIS kantaan.")
                )
                .catch(() => setApproving(false))
            }}
          />
        </FlexRight>
      <VerticalGap $size="m" />
      </SectionContainer>

    </PageContainer>
  )
})
