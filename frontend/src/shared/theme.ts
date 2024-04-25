// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { css } from 'styled-components'

export const tabletMin = '600px'

const blueColors = {
  m1: '#00358a',
  m2: '#0047b6',
  m3: '#4d7fcc',
  m4: '#d9e4f4'
}

export const colors = {
  main: {
    ...blueColors,
    m2Hover: blueColors.m1,
    m2Active: blueColors.m1,
    m2Focus: blueColors.m3
  },
  grayscale: {
    g100: '#091c3b',
    g70: '#536076',
    g35: '#a9b0bb',
    g15: '#dadde2',
    g4: '#f7f7f7',
    g0: '#ffffff'
  },
  status: {
    danger: '#ff4f57',
    warning: '#ff8e31',
    success: '#70c673',
    info: blueColors.m2
  }
}

export interface BaseProps {
  className?: string
  'data-qa'?: string
}

export type IconSize = 's' | 'm' | 'L' | 'XL'

const inputWidths = {
  xs: '60px',
  s: '120px',
  m: '240px',
  L: '360px',
  XL: '480px'
} as const

export type InputWidth = keyof typeof inputWidths

export const inputWidthCss = (width: InputWidth) => css`
  width: ${inputWidths[width]};
  max-width: ${inputWidths[width]};

  @media (max-width: ${tabletMin}) {
    ${width === 'L' || width === 'XL'
      ? css`
          width: 100%;
          max-width: 100%;
        `
      : ''}
  }
`

export const theme = { colors }
