// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { useCallback, useEffect, useState } from 'react'
import { ReactTags, Tag } from 'react-tag-autocomplete'
import styled from 'styled-components'

const Wrapper = styled.div`
  .react-tags {
    position: relative;
    padding: 0.25rem 0 0 0.25rem;
    border: none;
    border-bottom: 1px solid #536076;
    background: #fff;
    font-size: 1rem;
    line-height: 1.2;
    cursor: text;
  }

  .react-tags.is-active {
    border-color: #4f46e5;
  }

  .react-tags.is-disabled {
    opacity: 0.75;
    background-color: #eaeef2;
    pointer-events: none;
    cursor: not-allowed;
  }

  .react-tags.is-invalid {
    border-color: #fd5956;
    box-shadow: 0 0 0 2px #fd565340;
  }

  .react-tags__label {
    position: absolute;
    left: -10000px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }

  .react-tags__list {
    display: inline;
    padding: 0;
  }

  .react-tags__list-item {
    display: inline;
    list-style: none;
  }

  .react-tags__tag {
    margin: 0 0.25rem 0.25rem 0;
    padding: 0.1rem 0.7rem;
    border: 0;
    border-radius: 30px;
    background: #00358a;
    color: #fff;
    font-size: inherit;
    line-height: inherit;
  }

  .react-tags__tag:after {
    content: '';
    display: inline-block;
    width: 0.65rem;
    height: 0.65rem;
    clip-path: polygon(
      10% 0,
      0 10%,
      40% 50%,
      0 90%,
      10% 100%,
      50% 60%,
      90% 100%,
      100% 90%,
      60% 50%,
      100% 10%,
      90% 0,
      50% 40%
    );
    margin-left: 0.5rem;
    font-size: 0.875rem;
    background-color: #7c7d86;
    color: #fff;
  }

  .react-tags__tag:hover:after {
    background-color: #fff;
  }

  .react-tags__combobox {
    display: inline-block;
    padding: 0.375rem 0.25rem;
    margin-bottom: 0.25rem;
    max-width: 100%;
  }

  .react-tags__combobox-input {
    max-width: 100%;
    margin: 0;
    padding: 0;
    border: 0;
    outline: none;
    background: none;
    font-size: inherit;
    line-height: inherit;
  }

  .react-tags__combobox-input::placeholder {
    color: #7c7d86;
    opacity: 1;
  }

  .react-tags__listbox {
    position: absolute;
    z-index: 1;
    top: calc(100% + 5px);
    left: -2px;
    right: -2px;
    max-height: 12.5rem;
    overflow-y: auto;
    background: #fff;
    border: 1px solid #afb8c1;
    border-radius: 6px;
    box-shadow:
      #0000001a 0 10px 15px -4px,
      #0000000d 0 4px 6px -2px;
  }

  .react-tags__listbox-option {
    padding: 0.6rem 0.5rem;
  }

  .react-tags__listbox-option:hover {
    cursor: pointer;
    background: #eaeef2;
  }

  .react-tags__listbox-option:not([aria-disabled='true']).is-active {
    background: #4f46e5;
    color: #fff;
  }

  .react-tags__listbox-option[aria-disabled='true'] {
    color: #7c7d86;
    cursor: not-allowed;
    pointer-events: none;
  }

  .react-tags__listbox-option[aria-selected='true']:after {
    content: '✓';
    margin-left: 0.5rem;
  }

  .react-tags__listbox-option[aria-selected='true']:not(.is-active):after {
    color: #4f46e5;
  }

  .react-tags__listbox-option-highlight {
    background-color: #fd0;
  }
`

interface Props {
  suggestions: Tag[]
  data: Tag[]
  onChange: (selected: Tag[]) => void
}

export const TagAutoComplete = (props: Props) => {
  const [selected, setSelected] = useState<Tag[]>(props.data ?? [])

  const onAdd = useCallback(
    (newTag: Tag) => {
      setSelected([...selected, newTag])
    },
    [selected]
  )

  const onDelete = useCallback(
    (tagIndex: number) => {
      setSelected(selected.filter((_, i) => i !== tagIndex))
    },
    [selected]
  )

  useEffect(() => {
    props.onChange(selected)
  }, [selected])

  return (
    <Wrapper>
      <ReactTags
        placeholderText="Etsi tai lisää kaava"
        newOptionText="Lisää %value%"
        allowNew={true}
        selected={selected}
        suggestions={props.suggestions}
        onAdd={onAdd}
        onDelete={onDelete}
        noOptionsText="Ei hakutuloksia"
      />
    </Wrapper>
  )
}