import http from '@/lib/http'
import type { UploadFilesResType } from '@/schemaValidations/media.schema'

const BASE_URL = '/media'

const mediaApis = {
  uploadFiles(body: FormData) {
    return http.post<UploadFilesResType>(`${BASE_URL}/images/upload`, body, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default mediaApis
