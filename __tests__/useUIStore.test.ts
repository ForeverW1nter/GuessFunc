import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from '../src/store/useUIStore'

describe('useUIStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useUIStore.setState({
      isSidebarOpen: false,
      isSidebarCollapsed: false,
      isSettingsOpen: false,
      isRandomChallengeOpen: false,
      theme: 'dark',
      customPrimaryColor: '#00BCD4',
      isAssistMode: false,
      isDebugMode: false,
      toasts: [],
      storyFontSize: 100,
      storyFontFamily: 'system-ui, -apple-system, sans-serif',
      storyFontUrl: null
    })
  })

  it('should initialize with default values', () => {
    const state = useUIStore.getState()
    expect(state.isSidebarOpen).toBe(false)
    expect(state.theme).toBe('dark')
  })

  it('should toggle sidebar', () => {
    const store = useUIStore.getState()
    store.toggleSidebar()
    expect(useUIStore.getState().isSidebarOpen).toBe(true)
    store.toggleSidebar()
    expect(useUIStore.getState().isSidebarOpen).toBe(false)
  })

  it('should set sidebar open explicitly', () => {
    useUIStore.getState().setSidebarOpen(true)
    expect(useUIStore.getState().isSidebarOpen).toBe(true)
  })

  it('should toggle settings', () => {
    useUIStore.getState().toggleSettings()
    expect(useUIStore.getState().isSettingsOpen).toBe(true)
  })

  it('should set theme and update document element', () => {
    useUIStore.getState().setTheme('light')
    expect(useUIStore.getState().theme).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    useUIStore.getState().setTheme('dark')
    expect(useUIStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('should update custom primary color', () => {
    useUIStore.getState().setCustomPrimaryColor('#FF0000')
    expect(useUIStore.getState().customPrimaryColor).toBe('#FF0000')
  })
})
