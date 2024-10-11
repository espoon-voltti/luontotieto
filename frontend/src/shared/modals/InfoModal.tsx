// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import { AsyncButton } from 'shared/buttons/AsyncButton'
import { Button } from 'shared/buttons/Button'
import { VerticalGap } from 'shared/layout'

import BaseModal, { ModalBaseProps, ModalButtons } from './BaseModal'

export interface InfoModalStateProps extends InfoModalActions<unknown> {
  title: string
  text?: string
}

export interface InfoModalActions<T> {
  resolve?: {
    action: () => Promise<T> | void
    onSuccess?: (value: T) => void
    label: string
    disabled?: boolean
  }
  reject?: {
    action: () => void
    label: string
  }
}
type Props<T> = Omit<ModalBaseProps, 'mobileFullScreen'> &
  (InfoModalActions<T> & {
    close: () => void
    closeLabel: string
    disabled?: boolean
  })

export default React.memo(function InfoModal({
  children,
  ...props
}: Props<unknown>) {
  return (
    <BaseModal
      {...props}
      close={props.close}
      closeLabel={props.closeLabel}
      mobileFullScreen={false}
    >
      {children}
      {'resolve' in props ? (
        <ModalButtons
          $justifyContent={!props.reject ? 'center' : 'space-between'}
        >
          {props.resolve && (
            <AsyncButton
              data-qa="modal-okBtn"
              onClick={props.resolve.action}
              onSuccess={
                props.resolve.onSuccess ||
                (() => {
                  /* intentionally empty */
                })
              }
              disabled={props.disabled || props.resolve.disabled}
              text={props.resolve.label}
              primary
            />
          )}

          {props.reject && (
            <Button
              onClick={props.reject.action}
              data-qa="modal-cancelBtn"
              text={props.reject.label}
            />
          )}
        </ModalButtons>
      ) : (
        <VerticalGap $size="L" />
      )}
    </BaseModal>
  )
})
