# MARSIL CHANGELOG [MEMORY]

## [2026-05-30] — Session: Continuous Autonomous Evolution - Wave 1

### Added
- Created MARSIL_CHANGELOG.md and MARSIL_ROADMAP.md documentation system
- Enhanced ParticleReactor with Jarvis-style multi-layered concentric rings (7 rings), dual tick-mark orbits (72/36 ticks), and floating stats readouts (SYS, PWR, SIG, NET, TMP, VLT, TKN, MEM) with animated bracket decorations
- Added purple accent ring and enhanced core glow layers to the reactor core
- Added ARWES-style clip-path diagonal corner cuts to all `.tech-panel` elements
- Added self-drawing header underline animation on panel hover
- Added animated corner bracket decorations (`::before`/`::after`) on panels that expand on hover
- Added CRT scanline overlay with horizontal scanning beam animation
- Added cybernetic flicker animation (`cyberFlicker`) for critical indicators
- Added vignette overlay for center-focus visual depth
- Added perspective grid with animated pulse
- Added telemetry data-grid cells (`tech-cell`) with left-glow accent on hover
- Added tech bracket-wrapped headers (`tech-header-brackets`) for panel titles
- Added `tech-telem-row` for diagnostic data pairs with `>` prefix and neon values
- Added `tech-panel-badge`, `tech-panel-warning`, `tech-panel-danger` status indicators
- Added `cyber-btn` component with shimmer hover effect and variant styles (primary, danger)
- Added `glass-card` pattern for reusable glassmorphic containers
- Added `glitch-text` effect for critical display elements
- Added `data-stream` background animation for the top bar
- Added skeleton loading shimmer animation for async content
- Added `spin-animation` keyframe for loading indicators
- Enhanced AudioVisualizer with 12-bar circular spectrogram for listening, multi-frequency Siri-style waves for speaking, radar sweep with grid wave for thinking, and heartbeat baseline ripple for idle
- Added NetworkQuality indicator component with color-coded latency display
- Added DiagDot component for real-time subsystem status (WS, API, CLD, PRX)
- Added Toast notification system with slide-in animation and sound feedback
- Enhanced StatusBar with LiveSparkline components for CPU/memory history and hover preview tooltips
- Added PerfMonitor with real-time FPS tracking, frame timing, and FPS sparkline (Ctrl+Shift+M)
- Added DataFlow component with animated SVG particle streams between panels
- Added HexGrid with rotating hexagonal background that pulses with system status
- Added CyberSplash boot sequence with sequential subsystem diagnostic checks
- Added responsive 3-column cybernetic IDE layout with resizable panels
- Added glassmorphic transparency overrides for reactor background shine-through
- Added RTL support for Arabic language mode with Cairo font and proper panel mirroring
- Added custom scrollbar styling with thin cybernetic theme
- Added cyber ring expand animation and terminal bar dot decorations
- Added comprehensive keyboard shortcuts system (Ctrl+K focus, Escape close, ? shortcuts, Ctrl+Shift+C/S/E/L/X)
- Added voice system integration with hands-free dialog mode and voice readout
- Added token history sparkline with auto-scaling bar chart
- Added estimated cost calculation display
- Added EvolutionModal with roadmap/changelog display and trigger button
- Added SettingsModal for provider/model/budget configuration
- Added ErrorBoundary for graceful error handling

### Enhanced (This Session)
- Upgraded ParticleReactor to 9 concentric rings (was 7) + 3 tick-mark orbits (was 2) + 12 floating stats readouts (was 8) with bracket decorations
- Added cardinal direction labels (N/S/E/W) to reactor background
- Added 5th rotating arc and extra dashed innermost ring to reactor
- Added tertiary cyan glow ring to reactor core
- Added ARWES-style self-drawing animated corner frame system (`arwes-frame` with `af-t/r/b/l` lines) that traces panel borders on hover with staggered delays
- Added `glowPulseIntense` keyframe for enhanced cybernetic glow on active elements
- Added `data-scroller` component for animated scrolling telemetry text
- Added `hologramFlicker` keyframe for holographic projection effect on modals
- Added `borderGradientShift` keyframe for animated neon border cycling
- Added `matrix-bg` overlay for terminal background scan effect
- Added `spin` and `spin-slow` keyframe animations for loading states
- Enhanced AudioVisualizer listening mode with outer glow ring and dynamic pulse
- Enhanced AudioVisualizer speaking mode with 5 frequency waves (was 3) including red and blue spectrum
- Added ARWES frame elements to all 6 IDE panels (left-top, left-bottom, mid-top, mid-bottom, right-top, right-bottom)
- Added LATENCY telemetry row to system diagnostics panel
- Added [GIT] badge to workspace panel header
- Enhanced agent status badge with animated pulse when active and role-specific labels (PROCESSING, EXECUTING)
- Added `box-shadow` focus glow to file tree search input
- Added background highlight on file tree item hover
- Added cyan border highlight on git branch selector hover
