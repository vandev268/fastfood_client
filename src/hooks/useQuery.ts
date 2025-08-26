import { useLocation } from 'react-router'

export const useQuery = () => {
  const { search } = useLocation()
  return new URLSearchParams(search)
}
