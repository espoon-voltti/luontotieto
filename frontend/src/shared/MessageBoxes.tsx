// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faExclamation } from '@fortawesome/free-solid-svg-icons/faExclamation'
import { faInfo } from '@fortawesome/free-solid-svg-icons/faInfo'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import styled from 'styled-components'

import { FlexColWithGaps } from './layout'
import { BaseProps, colors } from './theme'

interface MessageBoxContainerProps {
  $color: string
  $width: string
  $backGroundColor?: string
  $thin?: boolean
  $noMargin?: boolean
}

const MessageBoxContainer = styled.div<MessageBoxContainerProps>`
  width: ${(props) => props.$width};
  padding: ${(props) => (props.$thin ? '4px 16px' : '16px')};
  border-style: solid;
  border-width: 1px;
  border-color: ${(props) => props.$color};
  border-radius: ${(props) => (props.$thin ? '0' : '4px')};

  ${(props) =>
    props.$backGroundColor && `background-color: ${props.$backGroundColor};`}

  .message-container {
    display: flex;
    align-items: center;
    word-break: break-word;
  }

  .icon-wrapper {
    margin-right: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    min-width: 24px;
    height: 24px;
    background: ${(props) => props.$color};
    border-radius: 100%;
  }

  .message-title {
    font-weight: 600;
  }
`

interface BaseMessageBoxProps {
  title?: string
  message?: string | React.ReactNode
  icon: IconProp
  color: string
  backGroundColor?: string
  width?: string
  thin?: boolean
  'data-qa'?: string
}

const BaseMessageBox = React.memo(function MessageBox({
  title,
  message,
  icon,
  color,
  backGroundColor,
  width,
  thin,
  'data-qa': dataQa
}: BaseMessageBoxProps) {
  if (!title && !message) {
    return null
  }

  return (
    <MessageBoxContainer
      $backGroundColor={backGroundColor}
      $color={color}
      $width={width ?? 'fit-content'}
      $thin={thin}
      data-qa={dataQa}
    >
      <div className="message-container">
        <div className="icon-wrapper">
          <FontAwesomeIcon icon={icon} size="1x" color={color} inverse />
        </div>
        <FlexColWithGaps $gapSize="s">
          {!!title && <span className="message-title">{title}</span>}
          {!!message &&
            (typeof message === 'string' ? <span>{message}</span> : message)}
        </FlexColWithGaps>
      </div>
    </MessageBoxContainer>
  )
})

interface MessageBoxProps extends BaseProps {
  title?: string
  message?: string | React.ReactNode
  wide?: boolean
  thin?: boolean
}

export const InfoBox = React.memo(function InfoBox({
  title,
  message,
  wide,
  thin,
  'data-qa': dataQa
}: MessageBoxProps) {
  return (
    <BaseMessageBox
      title={title}
      message={message}
      icon={faInfo}
      color={colors.main.m1}
      backGroundColor={colors.main.m4}
      width={wide ? '100%' : 'fit-content'}
      thin={thin}
      data-qa={dataQa}
    />
  )
})

export const AlertBox = React.memo(function AlertBox({
  title,
  message,
  wide,
  thin,
  'data-qa': dataQa
}: MessageBoxProps) {
  return (
    <BaseMessageBox
      title={title}
      message={message}
      icon={faExclamation}
      color={colors.status.warning}
      width={wide ? '100%' : 'fit-content'}
      thin={thin}
      data-qa={dataQa}
    />
  )
})
