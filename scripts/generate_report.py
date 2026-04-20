#!/usr/bin/env python3
"""Delegates to `apps/web/scripts/generate_report.py` (BNHub investor PDF — ReportLab)."""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "apps" / "web" / "scripts" / "generate_report.py"

raise SystemExit(subprocess.call([sys.executable, str(TARGET), *sys.argv[1:]]))
