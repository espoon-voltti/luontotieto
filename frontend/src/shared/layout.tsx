// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import styled, { css } from 'styled-components'

import { colors } from './theme'

export const FlexCol = styled.div`
  display: flex;
  flex-direction: column;
`

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`

export const FlexColWithGaps = styled(FlexCol)<{
  $gapSize?: 's' | 'm' | 'L' | 'XL'
}>`
  > * {
    margin-bottom: ${(p) =>
      p.$gapSize === 'XL'
        ? '64px'
        : p.$gapSize === 'L'
          ? '32px'
          : p.$gapSize === 'm'
            ? '16px'
            : '8px'};

    &:last-child {
      margin-bottom: 0;
    }
  }
`

export const FlexRowWithGaps = styled(FlexRow)<{
  $gapSize?: 's' | 'm' | 'L' | 'XL'
}>`
  > * {
    margin-right: ${(p) =>
      p.$gapSize === 'XL'
        ? '64px'
        : p.$gapSize === 'L'
          ? '32px'
          : p.$gapSize === 'm'
            ? '16px'
            : '8px'};

    &:last-child {
      margin-right: 0;
    }
  }
`

export const FlexLeftRight = styled(FlexRow)`
  justify-content: space-between;
  align-items: center;
`

export const FlexRight = styled(FlexRow)`
  justify-content: flex-end;
  align-items: center;
`

export const VerticalGap = styled.div<{ $size?: 's' | 'm' | 'L' | 'XL' }>`
  height: ${(p) =>
    p.$size === 'XL'
      ? '62px'
      : p.$size === 'L'
        ? '32px'
        : p.$size === 'm'
          ? '16px'
          : '8px'};
`

export const Table = styled.table`
  border-collapse: collapse;

  tr {
    border-bottom: 1px solid #888;
    padding: 8px;
  }

  td,
  th {
    padding: 8px;
  }
`

export const pageWidth = '1152px'

export const PageContainer = styled.div`
  max-width: ${pageWidth};
  margin: 0 auto;
`

export const sectionPadding = '32px'

export const SectionContainer = styled.div<{
  $sidePadding?: string
  $minHeight?: string
}>`
  ${(p) =>
    p.$sidePadding ? `padding: 32px ${p.$sidePadding};` : 'padding: 32px;'}
  background-color: #fff;
  ${(p) => (p.$minHeight ? `min-height: ${p.$minHeight};` : '')}
`

const widthByTwelveColLayout = (columns: number) => css`
  width: calc(${columns / 12} * (${pageWidth} - 2 * ${sectionPadding}) - 32px);
  flex-grow: 0;
  flex-shrink: 0;
`

export const FixedWidthDiv = styled.div<{ $cols: number }>`
  ${(p) => widthByTwelveColLayout(p.$cols)}
`

export const LabeledInput = styled(FlexColWithGaps)<{ $cols?: number }>`
  ${(p) =>
    p.$cols
      ? widthByTwelveColLayout(p.$cols)
      : css`
          flex-grow: 1;
        `}
`

export const RowOfInputs = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  flex-grow: 1;

  > * {
    margin-right: 32px;

    &:last-child {
      margin-right: 0;
    }
  }
`

export const GroupOfInputRows = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;

  > * {
    margin-bottom: 32px;

    &:last-child {
      margin-bottom: 0;
    }
  }
`

export const Separator = styled.div`
  border-top: 1px solid ${colors.grayscale.g15};
  margin: 12px 0;
  width: 100%;
`
