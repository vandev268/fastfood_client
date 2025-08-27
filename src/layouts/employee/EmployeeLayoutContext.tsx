import { createContext, useContext, useState, type ReactNode } from 'react'

interface EmployeeLayoutContextType {
  isNavVisible: boolean
  setIsNavVisible: (visible: boolean) => void
}

const EmployeeLayoutContext = createContext<EmployeeLayoutContextType | undefined>(undefined)

export const useEmployeeLayout = () => {
  const context = useContext(EmployeeLayoutContext)
  if (!context) {
    throw new Error('useEmployeeLayout must be used within EmployeeLayoutProvider')
  }
  return context
}

export function EmployeeLayoutProvider({ children }: { children: ReactNode }) {
  const [isNavVisible, setIsNavVisible] = useState(true)

  return (
    <EmployeeLayoutContext.Provider value={{ isNavVisible, setIsNavVisible }}>
      {children}
    </EmployeeLayoutContext.Provider>
  )
}
