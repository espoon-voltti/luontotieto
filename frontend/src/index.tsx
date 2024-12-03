// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import 'core-js/stable'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import './index.css'
import './fonts/fonts.css'
import { appRouter } from './App'

const root = createRoot(document.getElementById('app')!)
root.render(<RouterProvider router={appRouter} />)
