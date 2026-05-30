# MARSIL CHANGELOG [MEMORY]

## [2026-05-30] — Session: Continuous Autonomous Evolution - Wave 2

### Added
- **SparklineChart component**: Reusable canvas-based mini line chart with gradient fill, glow effects, animated data points, and background grid lines for live telemetry visualization
- **Enhanced CRT overlay**: RGB sub-pixel simulation with color fringing at edges, improved scan-beam with trailing glow effect and smoother animation keyframes
- **Corner bracket extension system**: `corner-bracket-ext` (cbe-tl/tr/bl/br) elements on all 6 IDE panels with hover-expand animation and glow shadow effects
- **Tech bracket status indicators**: `tech-bracket-status` component with active/warning/danger/info variants for panel headers and status badges
- **Status dot bracket**: `status-dot-bracket` with animated pulsing dot (online/warning/offline states) for live connection indicators
- **Enhanced data-grid cells**: `tech-cell.enhanced` with animated border sweep on hover and data pulse animation for changing values
- **Orbiting mini-rings**: 4 additional Jarvis-style dashed orbit rings in ParticleReactor with independent rotation speeds and directions for enhanced depth
- **Secondary hex grid layer**: Counter-rotating smaller hex grid in HexGrid for parallax depth illusion, plus center glow pulse on active states
- **Live CPU/RAM sparklines**: Integrated into telemetry panel showing real-time rolling 40-point history charts with color-coded headers
- **Cybernetic splash screen**: Enhanced CyberSplash with corner bracket decorations, version display, background grid, top scanline, and bottom status bar

### Enhanced
- **CRT scan-beam**: Upgraded from 3px to 4px with trailing glow `::after` pseudo-element, smoother 8s animation with fade-in/out phases
- **ParticleReactor floating stats**: Enhanced pill backgrounds with higher opacity, animated `┃` bracket decorations with glow, improved label/value font rendering
- **ParticleReactor orbit rings**: Added 4 new orbiting mini-rings at radii 0.5/0.7/1.25/1.5 with varying dash patterns, speeds, and alpha levels
- **Panel corner brackets**: All 6 IDE panels now have extended corner brackets (cbe-tl/tr/bl/br) that expand from 20px to 28px on hover with neon glow
- **Tech badges**: Replaced `tech-panel-badge` with `tech-bracket-status` for workspace panel badges (SECURE LINK, READ-ONLY, GIT, ONLINE/OFFLINE)
- **Telemetry panel header**: Added live uptime badge and animated status dot bracket alongside the LIVE indicator
- **System diagnostics**: Enhanced signal core status with dynamic color based on agent state, added animated status dot for connection state
- **CSS variables**: Added `--crt-rgb-glow` and `--sparkline-height` CSS custom properties for consistent theming
- **Sparkline CSS**: Added complete sparkline-container styling with hover effects, header layout, and canvas wrapper
