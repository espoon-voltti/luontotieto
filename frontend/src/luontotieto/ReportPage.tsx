// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import {
  ReportDetails,
  ReportFileDetails,
  apiGetReport,
  apiGetReportFiles
} from 'api'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { PageContainer, SectionContainer, VerticalGap } from '../shared/layout'
import { H1, Label } from '../shared/typography'

export const ReportPage = React.memo(function ReportPage() {
  const { id } = useParams()
  if (!id) throw Error('Id not found in path')
  const [report, setReport] = useState<ReportDetails | null>(null)
  const [reportFiles, setReportFiles] = useState<ReportFileDetails[]>([])

  useEffect(() => {
    void apiGetReport(id).then(setReport)
    void apiGetReportFiles(id).then(setReportFiles)
  }, [id])

  return (
    <PageContainer>
      <SectionContainer>
        <H1>Selvitys</H1>
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
      </SectionContainer>
      <VerticalGap $size="m" />
    </PageContainer>
  )
})
