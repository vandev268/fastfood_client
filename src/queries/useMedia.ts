import mediaApis from '@/apis/media'
import { useMutation } from '@tanstack/react-query'

export const useUploadImagesMutation = () => {
  return useMutation({
    mutationFn: mediaApis.uploadFiles
  })
}
