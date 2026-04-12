/// <reference types="../src/types/desmos" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DesmosFunctionEditor } from '../src/features/tools/components/DesmosFunctionEditor';
import * as desmosLoader from '../src/utils/desmosLoader';

describe('DesmosFunctionEditor', () => {
  type MockCalculator = {
    setExpression: ReturnType<typeof vi.fn<(state: Desmos.ExpressionState) => void>>
    getExpressions: ReturnType<typeof vi.fn<() => Desmos.ExpressionState[]>>
    observeEvent: ReturnType<typeof vi.fn<(eventName: string, callback: () => void) => void>>
    destroy: ReturnType<typeof vi.fn<() => void>>
  }
  let mockCalculator: MockCalculator

  beforeEach(() => {
    vi.clearAllMocks()

    mockCalculator = {
      setExpression: vi.fn(),
      getExpressions: vi.fn().mockReturnValue([{ id: 'target-function', latex: 'x^2' }]),
      observeEvent: vi.fn(),
      destroy: vi.fn()
    }

    vi.spyOn(desmosLoader, 'loadDesmos').mockResolvedValue(undefined)
    
    // Mock window.Desmos
    // @ts-expect-error Mocking partial Desmos for test
    window.Desmos = {
      GraphingCalculator: vi.fn().mockReturnValue(mockCalculator)
    };
    
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // @ts-expect-error cleaning up mock
    delete window.Desmos;
  })

  it('initializes Desmos calculator on mount', async () => {
    const { container } = render(<DesmosFunctionEditor initialFunction="x" onChange={() => {}} />)

    expect(container.firstChild).toHaveClass('absolute inset-0')

    await waitFor(() => {
      expect(desmosLoader.loadDesmos).toHaveBeenCalled()
      expect(window.Desmos.GraphingCalculator).toHaveBeenCalled()
    })

    expect(mockCalculator.setExpression).toHaveBeenCalledWith({
      id: 'target-function',
      latex: 'x',
      color: '#3b82f6'
    })
    expect(mockCalculator.observeEvent).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('handles Desmos load failure gracefully', async () => {
    vi.spyOn(desmosLoader, 'loadDesmos').mockRejectedValue(new Error('Load failed'))

    render(<DesmosFunctionEditor initialFunction="x" onChange={() => {}} />)

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to load Desmos', expect.any(Error))
    })
    expect(window.Desmos.GraphingCalculator).not.toHaveBeenCalled()
  })

  it('triggers onChange when Desmos emits change event', async () => {
    const onChangeMock = vi.fn()
    render(<DesmosFunctionEditor initialFunction="x" onChange={onChangeMock} />)

    await waitFor(() => {
      expect(mockCalculator.observeEvent).toHaveBeenCalled()
    })

    // Extract the registered change callback
    const changeCallback = mockCalculator.observeEvent.mock.calls[0][1]

    // Simulate change event
    mockCalculator.getExpressions.mockReturnValue([{ id: 'test-id', latex: 'x^3' }])
    changeCallback()

    expect(onChangeMock).toHaveBeenCalledWith('x^3', undefined)
  })

  it('updates calculator expression when initialFunction prop changes', async () => {
    const { rerender } = render(<DesmosFunctionEditor initialFunction="x" onChange={() => {}} />)

    await waitFor(() => {
      expect(mockCalculator.setExpression).toHaveBeenCalledWith({
        id: 'target-function',
        latex: 'x',
        color: '#3b82f6'
      })
    })

    // Clear initial calls
    mockCalculator.setExpression.mockClear()

    // Simulate current state of expressions in calculator
    mockCalculator.getExpressions.mockReturnValue([{ id: 'target-function', latex: 'x' }])

    // Rerender with a new function
    rerender(<DesmosFunctionEditor initialFunction="x^2" onChange={() => {}} />)

    await waitFor(() => {
      expect(mockCalculator.setExpression).toHaveBeenCalledWith({
        id: 'target-function',
        latex: 'x^2',
        color: '#3b82f6'
      })
    })
  })

  it('cleans up calculator on unmount', async () => {
    const { unmount } = render(<DesmosFunctionEditor initialFunction="x" onChange={() => {}} />)

    await waitFor(() => {
      expect(window.Desmos.GraphingCalculator).toHaveBeenCalled()
    })

    unmount()

    expect(mockCalculator.destroy).toHaveBeenCalled()
  })
})