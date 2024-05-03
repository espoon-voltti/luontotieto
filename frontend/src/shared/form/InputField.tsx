// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faTimes } from '@fortawesome/free-solid-svg-icons/faTimes'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import React, { HTMLAttributes, RefObject, useState } from 'react'
import styled, { css } from 'styled-components'

import { IconButton } from '../buttons/IconButton'
import { BaseProps, colors, InputWidth, inputWidthCss } from '../theme'

import { InfoStatus, UnderRowStatusIcon } from './StatusIcon'

const Wrapper = styled.div<{ $width: InputWidth | undefined }>`
  position: relative;
  display: inline-block;
  ${(p) => (p.$width ? inputWidthCss(p.$width) : '')}
  flex-grow: 1;
`

interface StyledInputProps {
  $align?: 'left' | 'right'
  $icon?: boolean
  $backgroundColor?: string
}

export const StyledInput = styled.input<StyledInputProps>`
  width: 100%;
  margin: 0;
  border: none;
  border-top: 2px solid transparent;
  border-bottom: 1px solid ${colors.grayscale.g70};
  border-radius: 0;
  outline: none;
  text-align: ${(p) => p.$align ?? 'left'};
  background-color: ${(p) => p.$backgroundColor ?? colors.grayscale.g0};
  font-size: 1rem;
  color: ${colors.grayscale.g100};
  padding: 6px 10px;

  ${({ $icon }) =>
    $icon
      ? css`
          padding-right: calc(10px + 1rem + 12px);
        `
      : ''}
  &::placeholder {
    color: ${colors.grayscale.g70};
    font-family: 'Open Sans', 'Arial', sans-serif;
  }

  &:focus,
  &.success,
  &.warning {
    border-bottom-width: 2px;
    margin-bottom: -1px;
  }

  &:focus {
    border: 2px solid ${colors.main.m2Focus};
    border-radius: 2px;
    padding-left: 8px;
    padding-right: 8px;
    ${({ $icon }) =>
      $icon
        ? css`
            padding-right: calc(8px + 1rem + 12px);
          `
        : ''}
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

  &:read-only {
    border-bottom-style: dashed;
    color: ${colors.grayscale.g70};
    background: none;
  }
  &.fileInput {
    border: none;
    background-color: #f7f7f7;
    padding: 20px;
  }
`

const IconContainer = styled.div<{ $clickable: boolean }>`
  position: absolute;
  right: 12px;
  top: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1rem;

  ${(p) =>
    !p.$clickable
      ? css`
          pointer-events: none;
        `
      : ''}
`

const StyledIconButton = styled(IconButton)`
  color: ${colors.grayscale.g70};

  &:hover {
    color: ${colors.grayscale.g100};
  }
`

export const InputFieldUnderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  font-size: 1rem;
  line-height: 1rem;
  margin-top: 4px;

  color: ${colors.grayscale.g70};

  &.success {
    color: ${colors.status.success};
  }

  &.warning {
    color: ${colors.status.warning};
  }
`

export type InputInfo = {
  text: string | string[]
  status?: InfoStatus
}

export interface InputProps extends BaseProps {
  value: string
  onChange?: (value: string) => void
  onChangeTarget?: (target: EventTarget & HTMLInputElement) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  readonly?: boolean
  width?: InputWidth

  autoComplete?: string
  placeholder?: string
  info?: InputInfo
  align?: 'left' | 'right'
  backgroundColor?: string
  icon?: IconProp
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  onKeyDown?: HTMLAttributes<HTMLInputElement>['onKeyDown']
  symbol?: string
  type?: string
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

interface ClearableInputProps extends OtherInputProps {
  clearable: true
  clearLabel: string
}

interface DateInputProps extends InputProps {
  type: 'date'
  min?: string
  max?: string
}

interface OtherInputProps extends InputProps {
  min?: number
  max?: number
}

export type TextInputProps =
  | OtherInputProps
  | DateInputProps
  | ClearableInputProps

export const InputField = React.memo(function InputField({
  value,
  onChange,
  onFocus,
  onBlur,
  readonly,
  width,
  placeholder,
  info,
  inputMode,
  align,
  backgroundColor,
  autoComplete,
  'data-qa': dataQa,
  className,
  icon,
  symbol,
  type,
  min,
  max,
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
}: TextInputProps) {
  const [touched, setTouched] = useState(false)

  const hideError =
    hideErrorsBeforeTouched && !touched && info?.status === 'warning'
  const infoText = hideError ? undefined : info?.text
  const infoStatus = hideError ? undefined : info?.status

  const clearable = 'clearable' in rest && rest.clearable

  const showIcon = !!(clearable || icon || symbol)

  return (
    <Wrapper className={className} $width={width}>
      <StyledInput
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => {
          e.preventDefault()
          if (!readonly) {
            onChange?.(e.target.value)
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
        $icon={showIcon}
        inputMode={inputMode}
        $backgroundColor={backgroundColor}
        $align={align}
        className={classNames(className, infoStatus)}
        data-qa={dataQa}
        type={type}
        min={min}
        max={max}
        maxLength={maxLength}
        step={step}
        id={id}
        aria-describedby={ariaId}
        required={required ?? false}
        ref={inputRef}
        autoFocus={autoFocus}
        {...rest}
      />
      {showIcon && (
        <IconContainer $clickable={clearable}>
          {clearable && value ? (
            <StyledIconButton
              icon={faTimes}
              onClick={() => onChange && onChange('')}
              aria-label={rest.clearLabel}
            />
          ) : icon ? (
            <FontAwesomeIcon icon={icon} />
          ) : (
            symbol
          )}
        </IconContainer>
      )}
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
