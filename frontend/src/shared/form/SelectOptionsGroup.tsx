// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { FocusEventHandler, useCallback, useMemo } from 'react'
import styled from 'styled-components'

import { colors, InputWidth, inputWidthCss } from '../theme'

type Group<T> = {
  label: string
  items: readonly T[]
}

type SelectOption = {
  value: string
  label: string
  dataQa?: string
}

export type SelectWithOptionGroupsProps<T> = {
  id?: string
  items: readonly Group<T>[]
  disabled?: boolean
  width?: InputWidth
  getItemLabel?: (item: T) => string
  getItemValue?: (item: T) => string
  getItemDataQa?: (item: T) => string | undefined
  name?: string
  onFocus?: FocusEventHandler<HTMLSelectElement>
  'data-qa'?: string
} & (
  | {
      placeholder: string
      selectedItem: T | null
      onChange: (item: T | null) => void
    }
  | {
      placeholder?: undefined
      selectedItem: T
      onChange: (item: T) => void
    }
)

function GenericSelect<T>(props: SelectWithOptionGroupsProps<T>) {
  const {
    id,
    name,
    'data-qa': dataQa,
    items,
    selectedItem,
    getItemLabel = (item) => String(item),
    getItemValue = (item) => String(item),
    getItemDataQa,
    onFocus,
    width,
    disabled
  } = props

  const flatItems = items.flatMap((group) => group.items)

  const mapItem = useCallback(
    (item: T): SelectOption => ({
      value: getItemValue(item),
      label: getItemLabel(item),
      dataQa: getItemDataQa?.(item)
    }),
    [getItemLabel, getItemValue, getItemDataQa]
  )

  const options = useMemo(
    () =>
      items.map((group) => ({
        label: group.label,
        items: group.items.map((item) => mapItem(item))
      })),
    [items, mapItem]
  )

  return (
    <Root $width={width}>
      <Wrapper>
        <StyledSelect
          id={id}
          data-qa={dataQa}
          name={name}
          value={selectedItem ? getItemValue(selectedItem) : ''}
          onChange={(e) => {
            const newSelectedItem = flatItems.find(
              (item) => getItemValue(item) === e.target.value
            )
            if (props.placeholder === undefined) {
              props.onChange(newSelectedItem ?? flatItems[0])
            } else {
              props.onChange(newSelectedItem ?? null)
            }
          }}
          disabled={disabled}
          onFocus={onFocus}
        >
          {props.placeholder !== undefined && (
            <option value="">{props.placeholder}</option>
          )}
          {options.map((group, groupIndex) => (
            <optgroup key={groupIndex} label={group.label}>
              {group.items.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                  data-qa={item.dataQa}
                >
                  {item.label}
                </option>
              ))}
            </optgroup>
          ))}
        </StyledSelect>
        <Icon size="sm" icon={faChevronDown} />
      </Wrapper>
    </Root>
  )
}

export const Root = styled.div<{ $width: InputWidth | undefined }>`
  ${(p) => (p.$width ? inputWidthCss(p.$width) : '')}
  border-radius: 2px;
  border: 2px solid transparent;

  &.active {
    border-color: ${colors.main.m2Active};
  }
`

const Wrapper = styled.div`
  position: relative;
`

const StyledSelect = styled.select`
  appearance: none;
  color: ${colors.grayscale.g100};
  background-color: ${colors.grayscale.g0};
  display: block;
  font-size: 1rem;
  font-weight: normal;
  width: 100%;
  padding: 8px 30px 8px 12px;
  border: 1px solid ${colors.grayscale.g70};
  border-radius: 4px;
  box-shadow: none;
`

const Icon = styled(FontAwesomeIcon)`
  pointer-events: none;
  position: absolute;
  font-size: 1rem;
  right: 12px;
  top: 12px;
`

export const SelectOptionsGroup = React.memo(
  GenericSelect
) as typeof GenericSelect
