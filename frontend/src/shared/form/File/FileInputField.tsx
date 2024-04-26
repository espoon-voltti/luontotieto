// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { IconProp } from '@fortawesome/fontawesome-svg-core'
import classNames from 'classnames'
import React, { HTMLAttributes, RefObject, useState } from 'react'
import { BaseProps, InputWidth, inputWidthCss } from 'shared/theme'
import styled from 'styled-components'

import { InputFieldUnderRow, InputInfo, StyledInput } from '../InputField'
import { UnderRowStatusIcon } from '../StatusIcon'

export interface FileInputProps extends BaseProps {
  onChange?: (files: FileList | null) => void
  onChangeTarget?: (target: EventTarget & HTMLInputElement) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  readonly?: boolean
  width?: InputWidth

  autoComplete?: string
  placeholder?: string
  info?: InputInfo
  align?: 'left' | 'right'
  icon?: IconProp
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  onKeyDown?: HTMLAttributes<HTMLInputElement>['onKeyDown']
  symbol?: string
  maxLength?: number
  step?: number
  id?: string
  'data-qa'?: string
  name?: string
  'aria-describedby'?: string
  hideErrorsBeforeTouched?: boolean
  required?: boolean
  autoFocus?: boolean
  inputRef?: RefObject<HTMLInputElement>
  wrapperClassName?: string
}

const Wrapper = styled.div<{ $width: InputWidth | undefined }>`
  position: relative;
  display: inline-block;
  ${(p) => (p.$width ? inputWidthCss(p.$width) : '')}
  flex-grow: 1;
`

export const FileInputField = React.memo(function FileInputField({
  onChange,
  onFocus,
  onBlur,
  readonly,
  width,
  placeholder,
  info,
  inputMode,
  align,
  autoComplete,
  'data-qa': dataQa,
  className,
  icon,
  symbol,
  maxLength,
  step,
  hideErrorsBeforeTouched,
  id,
  inputRef,
  'aria-describedby': ariaId,
  required,
  autoFocus,
  onChangeTarget,
  ...rest
}: FileInputProps) {
  const [touched, setTouched] = useState(false)

  const hideError =
    hideErrorsBeforeTouched && !touched && info?.status === 'warning'
  const infoText = hideError ? undefined : info?.text
  const infoStatus = hideError ? undefined : info?.status

  return (
    <Wrapper className={className} $width={width}>
      <StyledInput
        autoComplete={autoComplete}
        onChange={(e) => {
          e.preventDefault()
          if (!readonly) {
            onChange?.(e.target.files)
            onChangeTarget?.(e.target)
          }
        }}
        onFocus={onFocus}
        onBlur={(e) => {
          setTouched(true)
          onBlur && onBlur(e)
        }}
        placeholder={placeholder}
        readOnly={readonly}
        disabled={readonly}
        inputMode={inputMode}
        $align={align}
        className={classNames(className, infoStatus, 'fileInput')}
        data-qa={dataQa}
        type="file"
        maxLength={maxLength}
        step={step}
        id={id}
        aria-describedby={ariaId}
        required={required ?? false}
        ref={inputRef}
        autoFocus={autoFocus}
        {...rest}
      />
      {!!infoText && (
        <InputFieldUnderRow className={classNames(infoStatus)}>
          <span data-qa={dataQa ? `${dataQa}-info` : undefined}>
            {infoText}
          </span>
          <UnderRowStatusIcon status={info?.status} />
        </InputFieldUnderRow>
      )}
    </Wrapper>
  )
})
