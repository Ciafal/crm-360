import type { ProviderHealth } from './types'

export interface UploadFileOptions {
  path?: string
  filename?: string
  contentType?: string
  isPublic?: boolean
}

export interface StoredFile {
  id: string
  url: string
  filename: string
  size: number
  contentType: string
  createdAt: string
}

export interface FileStorageProvider {
  readonly name: string
  upload(file: File | Blob | ArrayBuffer, options?: UploadFileOptions): Promise<StoredFile>
  delete(fileId: string): Promise<boolean>
  getUrl(fileId: string): Promise<string>
  getHealth(): Promise<ProviderHealth>
}
