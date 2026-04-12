import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ErrorBoundary } from '../src/features/ui/components/ErrorBoundary'
import { GAME_CONSTANTS } from '../src/utils/constants'

// Mock component that throws an error
const ThrowErrorComponent = ({ shouldThrow }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test Error Message')
  }
  return <div>Normal Content</div>
}

describe('ErrorBoundary', () => {
  const originalConsoleError = console.error
  const originalConsoleWarn = console.warn

  beforeEach(() => {
    console.error = vi.fn()
    console.warn = vi.fn()
    window.history.replaceState({}, '', '/__error-test__')
    localStorage.clear()
  })

  afterEach(() => {
    console.error = originalConsoleError
    console.warn = originalConsoleWarn
  })

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Normal Content')).toBeInTheDocument()
    expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
  })

  it('should render fallback UI when an error is thrown', () => {
    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow />
      </ErrorBoundary>
    )

    expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test Error Message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Return to Home/i })).toBeInTheDocument()
  })

  it('should clear non-essential localStorage on Return to Home click', () => {
    // Set some mock localStorage items
    localStorage.setItem('guess-func-storage', 'keep')
    localStorage.setItem(GAME_CONSTANTS.STORAGE_KEYS.CURRENT_SLOT, 'keep')
    localStorage.setItem('guess-func-audio-storage', 'keep')
    localStorage.setItem('temp-data', 'remove')
    localStorage.setItem(GAME_CONSTANTS.STORAGE_KEYS.SLOT_PREFIX + '1', 'keep')

    render(
      <ErrorBoundary>
        <ThrowErrorComponent shouldThrow />
      </ErrorBoundary>
    )

    const button = screen.getByRole('button', { name: /Return to Home/i })
    fireEvent.click(button)

    // Essential items should be kept
    expect(localStorage.getItem('guess-func-storage')).toBe('keep')
    expect(localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.CURRENT_SLOT)).toBe('keep')
    expect(localStorage.getItem('guess-func-audio-storage')).toBe('keep')
    expect(localStorage.getItem(GAME_CONSTANTS.STORAGE_KEYS.SLOT_PREFIX + '1')).toBe('keep')

    // Non-essential items should be removed
    expect(localStorage.getItem('temp-data')).toBeNull()

    expect(console.warn).toHaveBeenCalled()
  })
})
