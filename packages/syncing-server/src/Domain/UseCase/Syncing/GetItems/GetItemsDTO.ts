export interface GetItemsDTO {
  userUuid: string
  roleNames: string[]
  syncToken?: string | null
  cursorToken?: string | null
  limit?: number
  contentType?: string
  sharedVaultUuids?: string[]
}
