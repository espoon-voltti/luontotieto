// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import classNames from 'classnames'
import React, { RefObject, useMemo, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import styled from 'styled-components'

import { FlexColWithGaps } from '../layout'
import { BaseProps, colors, InputWidth, inputWidthCss } from '../theme'
import { P } from '../typography'

import { InputFieldUnderRow, InputInfo } from './InputField'
import { UnderRowStatusIcon } from './StatusIcon'

interface TextAreaInputProps extends BaseProps {
  value: string
  onChange?: (value: string) => void
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void
  readonly?: boolean
  width?: InputWidth
  rows?: number
  maxLength?: number
  type?: string
  autoFocus?: boolean
  placeholder?: string
  info?: InputInfo
  align?: 'left' | 'right'
  id?: string
  'data-qa'?: string
  className?: string
  'aria-describedby'?: string
  hideErrorsBeforeTouched?: boolean
  required?: boolean
  inputRef?: RefObject<HTMLTextAreaElement>
  wrapperClassName?: string
}

export const ReadOnlyTextArea = React.memo(function ReadOnlyTextArea({
  text
}: {
  text: string
}) {
  return (
    <FlexColWithGaps>
      {text.split('\n').map((s, i) => (
        <P key={i}>{s}</P>
      ))}
    </FlexColWithGaps>
  )
})

export const TextArea = React.memo(function TextArea({
  value,
  onChange,
  onFocus,
  onBlur,
  readonly,
  width,
  rows,
  maxLength,
  autoFocus,
  placeholder,
  info,
  id,
  'data-qa': dataQa,
  className,
  'aria-describedby': ariaId,
  hideErrorsBeforeTouched,
  required,
  inputRef
}: TextAreaInputProps) {
  const [touched, setTouched] = useState(false)

  const hideError =
    hideErrorsBeforeTouched && !touched && info?.status === 'warning'
  const infoText = hideError ? undefined : info?.text
  const infoStatus = hideError ? undefined : info?.status

  const handleChange = useMemo(
    () =>
      onChange
        ? (e: React.ChangeEvent<HTMLTextAreaElement>) =>
            onChange(e.target.value)
        : undefined,
    [onChange]
  )

  return (
    <>
      <StyledTextArea
        value={value}
        onChange={handleChange}
        onFocus={onFocus}
        onBlur={(e) => {
          setTouched(true)
          onBlur && onBlur(e)
        }}
        placeholder={placeholder}
        readOnly={readonly}
        $width={width}
        disabled={readonly}
        maxLength={maxLength}
        autoFocus={autoFocus}
        className={classNames(className, infoStatus)}
        data-qa={dataQa}
        id={id}
        aria-describedby={ariaId}
        required={required ?? false}
        ref={inputRef}
        rows={rows}
      />
      {!!infoText && (
        <InputFieldUnderRow className={classNames(infoStatus)}>
          <span data-qa={dataQa ? `${dataQa}-info` : undefined}>
            {infoText}
          </span>
          <UnderRowStatusIcon status={info?.status} />
        </InputFieldUnderRow>
      )}
    </>
  )
})

const StyledTextArea = styled(TextareaAutosize)<{
  $width: InputWidth | undefined
}>`
  ${(p) => (p.$width ? inputWidthCss(p.$width) : '')}
  display: block;
  position: relative;

  width: 100%;
  max-width: 100%;
  height: 38px;
  min-height: 2.5em;
  padding: 6px 10px;

  font-size: 1rem;
  font-family: 'Open Sans', Arial, sans-serif;
  color: ${colors.grayscale.g100};
  line-height: 1.5;
  overflow: hidden;
  overflow-wrap: break-word;
  resize: none;

  background-color: transparent;
  margin: 0;
  border: none;
  border-top: 2px solid transparent;
  border-bottom: 1px solid ${colors.grayscale.g70};
  border-radius: 0;
  box-shadow: none;
  outline: none;

  &:focus,
  &.success,
  &.warning {
    border-bottom-width: 2px;
  }

  &:focus {
    border: 2px solid ${colors.main.m2Focus};
    border-radius: 2px;
    padding-left: 8px;
    padding-right: 8px;
  }

  &.success {
    border-bottom-color: ${colors.status.success};

    &:focus {
      border-color: ${colors.status.success};
    }
  }

  &.warning {
    border-bottom-color: ${colors.status.warning};

    &:focus {
      border-color: ${colors.status.warning};
    }
  }
`
