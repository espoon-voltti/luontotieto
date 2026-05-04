#!/bin/bash

# SPDX-FileCopyrightText: 2017-2026 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

set -euo pipefail

curl https://mise.run/bash | bash
export PATH="$HOME/.local/bin:$PATH"
mise trust
mise install uv
mise install
eval "$(mise activate bash)"

curl -fsSL https://claude.ai/install.sh | bash
mkdir -p ~/.claude
cat > ~/.claude/settings.json <<'SETTINGS'
{
  "attribution": {
    "commit": "",
    "pr": ""
  }
}
SETTINGS
