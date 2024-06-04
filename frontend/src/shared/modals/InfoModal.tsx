// SPDX-FileCopyrightText: 2017-2022 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import { Button } from 'shared/buttons/Button'
import { VerticalGap } from 'shared/layout'

import BaseModal, { ModalBaseProps, ModalButtons } from './BaseModal'

type Props = Omit<ModalBaseProps, 'mobileFullScreen'> &
  (
    | {
        resolve: {
          action: () => void
          label: string
          disabled?: boolean
        }
        reject?: {
          action: () => void
          label: string
        }
      }
    | { close: () => void; closeLabel: string }
  )

export default React.memo(function InfoModal({ children, ...props }: Props) {
  return (
    <BaseModal
      {...props}
      close={
        'close' in props
          ? props.close
          : props.reject
            ? props.reject.action
            : props.resolve.action
      }
      closeLabel={
        'close' in props
          ? props.closeLabel
          : props.reject
            ? props.reject.label
            : props.resolve.label
      }
      mobileFullScreen={false}
    >
      {children}
      {'resolve' in props ? (
        <ModalButtons
          $justifyContent={!props.reject ? 'center' : 'space-between'}
        >
          <Button
            data-qa="modal-okBtn"
            onClick={props.resolve.action}
            disabled={props.resolve.disabled}
            text={props.resolve.label}
            primary
          />
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
