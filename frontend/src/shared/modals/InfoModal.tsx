// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import { Button } from 'shared/buttons/Button'
import { VerticalGap } from 'shared/layout'

import BaseModal, { ModalBaseProps, ModalButtons } from './BaseModal'

export interface InfoModalStateProps extends InfoModalActions {
  title: string
  text?: string
}

export interface InfoModalActions {
  resolve?: {
    action: () => void
    label: string
    disabled?: boolean
  }
  reject?: {
    action: () => void
    label: string
  }
}
type Props = Omit<ModalBaseProps, 'mobileFullScreen'> &
  (InfoModalActions & { close: () => void; closeLabel: string })

export default React.memo(function InfoModal({ children, ...props }: Props) {
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
            <Button
              data-qa="modal-okBtn"
              onClick={props.resolve.action}
              disabled={props.resolve.disabled}
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
