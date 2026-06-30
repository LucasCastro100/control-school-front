"use client"

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react"

interface PageHeaderContextType {
  left: ReactNode
  right: ReactNode
  setHeader: (left: ReactNode, right: ReactNode) => void
}

const PageHeaderContext = createContext<PageHeaderContextType>({
  left: null,
  right: null,
  setHeader: () => {},
})

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [left, setLeft] = useState<ReactNode>(null)
  const [right, setRight] = useState<ReactNode>(null)

  const setHeader = useCallback((left: ReactNode, right: ReactNode) => {
    setLeft(left)
    setRight(right)
  }, [])

  const value = useMemo(() => ({ left, right, setHeader }), [left, right, setHeader])

  return (
    <PageHeaderContext.Provider value={value}>
      {children}
    </PageHeaderContext.Provider>
  )
}

export function usePageHeader() {
  return useContext(PageHeaderContext)
}
