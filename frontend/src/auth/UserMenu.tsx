// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from 'classnames'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { logoutUrl } from './UserHeader'
import useCloseOnOutsideClick from 'shared/useCloseOnOutsideClick'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { colors } from 'shared/theme'
import { useQueryClient } from '@tanstack/react-query'

const dropDownButtonStyles = css`
    display: inline-flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0px 8px;
    align-items: center;
    border: none;
    background: transparent;
    cursor: pointer;
    font-family: Open Sans;
    line-height: 2rem;
    font-size: 1.125rem;
    font-weight: 600;
    color: ${colors.main.m1};

    &:hover {
        color: ${colors.main.m2Hover};

        .circled-char {
            border-color: ${colors.main.m2Hover};
        }
    }

    &.active {
        color: ${colors.main.m2};
        border-bottom-color: ${colors.main.m2};

        .circled-char {
            border-color: ${colors.main.m2};
        }
    }
`

export const DropDownButton = styled.button`
    ${dropDownButtonStyles}
`

export const DropDownItemButton = styled(DropDownButton)`
    font-weight: 400;
    font-size: 1rem;
`

export const DropDownLink = styled(NavLink)<{ $alignRight?: boolean }>`
    ${dropDownButtonStyles}
    ${(p) => p.$alignRight && 'justify-content: flex-end;'}
`

export const DropDownLocalLink = styled.a`
    ${dropDownButtonStyles}
`

export const UserMenu = React.memo(function LanguageMenu({
                                                             userName
                                                         }: {
    userName: string
}) {
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const toggleOpen = useCallback(() => setOpen((state) => !state), [setOpen])
    const dropDownContainerRef = useCloseOnOutsideClick<HTMLDivElement>(() =>
        setOpen(false)
    )

    const queryClient = useQueryClient()

    const firstButtonRef = useRef<HTMLButtonElement | null>(null)
    useEffect(() => {
        if (open && firstButtonRef.current) {
            firstButtonRef.current.focus()
        }
    }, [open])

    return (
        <DropDownContainer ref={dropDownContainerRef}>
            <DropDownButton
                onClick={toggleOpen}
                data-qa="button-select-language"
                aria-expanded={open}
                aria-haspopup="true"
            >
                {userName}
                <DropDownIcon icon={open ? faChevronUp : faChevronDown}/>
            </DropDownButton>
            {open ? (
                <DropDown $align="right">
                    <DropDownItemButton
                        ref={firstButtonRef}
                        key={'user-management'}
                        className={classNames({active: true})}
                        onClick={() => {
                            navigate(`/luontotieto/käyttäjät`)
                            setOpen(false)
                        }}
                        role="menuitemradio"
                        aria-checked={true}
                    >
                        Käyttäjänhallinta
                    </DropDownItemButton>
                    <DropDownItemButton
                        ref={firstButtonRef}
                        key={'user-settings'}
                        className={classNames({active: true})}
                        onClick={() => {
                            navigate(`/luontotieto/omat-asetukset`)
                            setOpen(false)
                        }}
                        role="menuitemradio"
                        aria-checked={true}
                    >
                        Asetukset
                    </DropDownItemButton>
                    <DropDownItemButton
                        ref={firstButtonRef}
                        key={'logout'}
                        className={classNames({active: true})}
                        onClick={async () => {
                            setOpen(false)
                            await queryClient.invalidateQueries()
                            location.href = logoutUrl
                        }}
                        role="menuitemradio"
                        aria-checked={true}
                    >
                        Kirjaudu ulos
                    </DropDownItemButton>
                </DropDown>
            ) : null}
        </DropDownContainer>
    )
})

export const DropDownContainer = styled.nav`
    position: relative;
`

export const DropDownIcon = styled(FontAwesomeIcon)`
    height: 1em !important;
    width: 0.625em !important;
`

export const DropDown = styled.ul<{ $align: 'left' | 'right' }>`
    position: absolute;
    z-index: 30;
    list-style: none;
    margin: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    background: ${colors.grayscale.g0};
    box-shadow: 0 2px 6px 0 ${colors.grayscale.g15};
    min-width: 240px;
    max-width: 600px;
    width: max-content;
    padding: 8px;
    ${({$align}) =>
            $align === 'left'
                    ? css`
                        left: 0;
                        align-items: flex-start;
                        text-align: left;
                    `
                    : css`
                        right: 0;
                        align-items: flex-end;
                        text-align: right;
                    `}
`

export const DropDownInfo = React.memo(function DropDownInfo({
                                                                 children
                                                             }: {
    children: React.ReactNode
}) {
    return (
        <>
            <DropDownInfoBreak/>
            <DropDownInfoContent>{children}</DropDownInfoContent>
        </>
    )
})

const DropDownInfoBreak = styled.span`
    flex-basis: 100%;
    height: 0;
`

const DropDownInfoContent = styled.span`
    font-weight: normal;
`
