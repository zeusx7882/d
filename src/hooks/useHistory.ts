import { useCallback, useMemo, useState } from 'react'

type HistoryState<T> = {
  past: T[]
  present: T
  future: T[]
  baseline: T
}

type SetOptions = {
  record?: boolean
}

export function useHistory<T>(initialPresent: T, limit = 30) {
  const [historyState, setHistoryState] = useState<HistoryState<T>>({
    past: [],
    present: initialPresent,
    future: [],
    baseline: initialPresent,
  })

  const set = useCallback((next: T | ((current: T) => T), options: SetOptions = {}) => {
    setHistoryState((current) => {
      const resolved = typeof next === 'function'
        ? (next as (value: T) => T)(current.present)
        : next

      if (options.record === false) {
        return {
          ...current,
          present: resolved,
        }
      }

      return {
        past: [...current.past.slice(-(limit - 1)), current.present],
        present: resolved,
        future: [],
        baseline: current.baseline,
      }
    })
  }, [limit])


  const commit = useCallback((previous: T, next: T) => {
    setHistoryState((current) => ({
      past: [...current.past.slice(-(limit - 1)), previous],
      present: next,
      future: [],
      baseline: current.baseline,
    }))
  }, [limit])

  const undo = useCallback(() => {
    setHistoryState((current) => {
      const previous = current.past[current.past.length - 1]
      if (previous === undefined) {
        return current
      }

      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future].slice(0, limit),
        baseline: current.baseline,
      }
    })
  }, [limit])

  const redo = useCallback(() => {
    setHistoryState((current) => {
      const [next, ...rest] = current.future
      if (next === undefined) {
        return current
      }

      return {
        past: [...current.past.slice(-(limit - 1)), current.present],
        present: next,
        future: rest,
        baseline: current.baseline,
      }
    })
  }, [limit])

  const reset = useCallback(() => {
    setHistoryState((current) => ({
      past: [],
      present: current.baseline,
      future: [],
      baseline: current.baseline,
    }))
  }, [])

  const replaceBaseline = useCallback((next: T) => {
    setHistoryState({
      past: [],
      present: next,
      future: [],
      baseline: next,
    })
  }, [])

  return useMemo(() => ({
    ...historyState,
    set,
    commit,
    undo,
    redo,
    reset,
    replaceBaseline,
    canUndo: historyState.past.length > 0,
    canRedo: historyState.future.length > 0,
  }), [commit, historyState, redo, replaceBaseline, reset, set, undo])
}
