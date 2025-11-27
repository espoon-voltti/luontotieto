// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { FocusEventHandler, useState } from 'react'
import { IconButton } from 'shared/buttons/IconButton'
import { VerticalGap } from 'shared/layout'
import { colors, defaultMargins, tabletMin, SpacingSize } from 'shared/theme'
import { H1, P } from 'shared/typography'
import styled, { css } from 'styled-components'

import ModalBackground from './ModalBackground'
import { modalZIndex } from './z-helpers'

export interface ModalBaseProps {
  title: string
  text?: React.ReactNode
  className?: string
  icon?: IconProp
  type?: ModalType
  mobileFullScreen?: boolean
  zIndex?: number
  children?: React.ReactNode
  'data-qa'?: string
  width?: ModalWidth
  padding?: SpacingSize
}

export type ModalType = 'info' | 'success' | 'warning' | 'danger'

interface Props extends ModalBaseProps {
  close: () => void
  closeLabel: string
}

export default React.memo(function BaseModal(props: Props) {
  return (
    <ModalBackground zIndex={props.zIndex}>
      <ModalWrapper
        className={props.className}
        $zIndex={props.zIndex}
        data-qa={props['data-qa']}
      >
        <ModalContainer
          $mobileFullScreen={props.mobileFullScreen}
          $margin="auto"
          data-qa="modal"
          $width={props.width}
          $padding={props.padding}
          role="alert"
        >
          <ModalTitle>
            {props.icon && (
              <>
                <ModalIcon $type={props.type}>
                  <FontAwesomeIcon icon={props.icon} />
                </ModalIcon>
                <VerticalGap $size="m" />
              </>
            )}
            {!!props.title && (
              <ModalHeader
                headingComponent={(props) => (
                  <H1 {...props} data-qa="title">
                    {props.children}
                  </H1>
                )}
              >
                {props.title}
              </ModalHeader>
            )}
            {!!props.text && <P data-qa="text">{props.text}</P>}
          </ModalTitle>
          {props.children}
          <ModalCloseButton close={props.close} closeLabel={props.closeLabel} />
        </ModalContainer>
      </ModalWrapper>
    </ModalBackground>
  )
})

export const ModalButtons = styled.div<{
  $justifyContent?: 'center' | 'space-between'
}>`
  display: flex;
  flex-direction: row-reverse;
  margin-top: ${defaultMargins.XXL};
  margin-bottom: ${defaultMargins.X3L};
  justify-content: ${({ $justifyContent }) => $justifyContent};

  @media (max-width: ${tabletMin}) {
    margin-bottom: ${defaultMargins.L};
  }
`

const CloseButton = styled(IconButton)`
  position: absolute;
  top: ${defaultMargins.s};
  right: ${defaultMargins.s};
  color: ${colors.grayscale.g0};
`

export const ModalCloseButton = React.memo(function ModalCloseButton({
  close,
  closeLabel,
  'data-qa': dataQa
}: {
  close: () => void
  closeLabel: string
  'data-qa'?: string
}) {
  return (
    <CloseButton
      icon={faTimes}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        close()
      }}
      aria-label={closeLabel}
      data-qa={dataQa}
    />
  )
})

type ModalWidth = 'normal' | 'wide' | 'extra-wide'

const ModalContainer = styled.div<{
  $mobileFullScreen?: boolean
  $padding?: SpacingSize | null
  $margin: string
  $width?: ModalWidth
}>`
  position: relative;
  width: min(
    ${(p) =>
      p.$width === 'extra-wide'
        ? '1280px'
        : p.$width === 'wide'
          ? '720px'
          : '500px'},
    calc(100vw - 2 * ${defaultMargins.xxs})
  );
  max-height: calc(100vh - 2 * ${defaultMargins.s});
  background: ${colors.grayscale.g0};
  overflow-x: visible;
  box-shadow: 0 15px 75px 0 rgba(0, 0, 0, 0.5);
  border-radius: 2px;
  ${(p) =>
    p.$padding === null
      ? ''
      : `padding-left: ${defaultMargins[p.$padding ?? 'XXL']}`};
  ${(p) =>
    p.$padding === null
      ? ''
      : `padding-right: ${defaultMargins[p.$padding ?? 'XXL']}`};
  margin: ${(p) => p.$margin};
  overflow-y: auto;

  @media (max-width: ${tabletMin}) {
    ${(p) =>
      p.$padding === null
        ? ''
        : `padding-left: ${defaultMargins[p.$padding ?? 's']}`};
    ${(p) =>
      p.$padding === null
        ? ''
        : `padding-right: ${defaultMargins[p.$padding ?? 's']}`};
    margin-left: ${defaultMargins.s};
    margin-right: ${defaultMargins.s};

    ${(p) =>
      p.$mobileFullScreen
        ? css`
            margin-left: 0;
            margin-right: 0;
            max-width: 100vw;
            max-height: 100vh;
            width: 100vw;
            height: 100vh;
          `
        : ''}
  }
`

const ModalWrapper = styled.div<{ $zIndex?: number }>`
  align-items: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
  position: fixed;
  z-index: ${(p) => (p.$zIndex ? p.$zIndex : modalZIndex)};
  bottom: 0;
  left: 0;
  right: 0;
  top: 0;
`

const ModalIcon = styled.div<{ $type?: ModalType }>`
  background: ${({ $type = 'info' }) => colors.status[$type]};
  font-size: 36px;
  border-radius: 50%;
  line-height: 60px;
  height: 60px;
  width: 60px;
  text-align: center;
  color: ${colors.grayscale.g0};
  margin: auto;
`

const ModalTitle = styled.div<{ wide?: boolean }>`
  margin-bottom: ${defaultMargins.XXL};
  margin-top: ${defaultMargins.XXL};
  text-align: ${(p) => (p.wide ? 'left' : 'center')};

  @media (max-width: ${tabletMin}) {
    margin-bottom: ${defaultMargins.L};
    margin-top: ${defaultMargins.L};
  }
`

const StaticallyPositionedModal = styled(ModalWrapper)`
  justify-content: flex-start;
`

type PlainModalProps = Pick<
  ModalBaseProps,
  'className' | 'zIndex' | 'data-qa' | 'mobileFullScreen' | 'children'
> & {
  margin: string
}

export const PlainModal = React.memo(function PlainModal(
  props: PlainModalProps
) {
  return (
    <ModalBackground>
      <StaticallyPositionedModal
        className={props.className}
        $zIndex={props.zIndex}
        data-qa={props['data-qa']}
      >
        <ModalContainer
          $padding={null}
          $mobileFullScreen={props.mobileFullScreen}
          $margin={props.margin}
          className="modal-container"
          data-qa="modal"
        >
          {props.children}
        </ModalContainer>
      </StaticallyPositionedModal>
    </ModalBackground>
  )
})

export const ModalHeader = React.memo(function ModalHeader({
  children,
  headingComponent: HeadingComponent = H1,
  ...props
}: {
  children: React.ReactNode
  headingComponent: React.ComponentType<{
    children: React.ReactNode
    tabIndex?: number
    onBlur?: FocusEventHandler<HTMLElement>
  }>
}) {
  const [isFocusable, setIsFocusable] = useState(true)

  return (
    <HeadingComponent
      tabIndex={isFocusable ? 0 : undefined}
      onBlur={() => setIsFocusable(false)}
      {...props}
    >
      {children}
    </HeadingComponent>
  )
})
