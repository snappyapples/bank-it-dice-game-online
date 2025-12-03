'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface HeaderContextType {
  autoHide: boolean
  setAutoHide: (value: boolean) => void
}

const HeaderContext = createContext<HeaderContextType>({
  autoHide: false,
  setAutoHide: () => {},
})

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [autoHide, setAutoHide] = useState(false)

  return (
    <HeaderContext.Provider value={{ autoHide, setAutoHide }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeaderContext() {
  return useContext(HeaderContext)
}
