import { Result } from '../Core/Result'
import { ValueObject } from '../Core/ValueObject'
import { NotificationTypeProps } from './NotificationTypeProps'

export class NotificationType extends ValueObject<NotificationTypeProps> {
  static readonly TYPES = {
    SharedVaultItemRemoved: 'shared_vault_item_removed',
    RemovedFromSharedVault: 'removed_from_shared_vault',
    SharedVaultFileUploaded: 'shared_vault_file_uploaded',
    SharedVaultFileRemoved: 'shared_vault_file_removed',
  }

  get value(): string {
    return this.props.value
  }

  private constructor(props: NotificationTypeProps) {
    super(props)
  }

  static create(notificationType: string): Result<NotificationType> {
    const isValidType = Object.values(this.TYPES).includes(notificationType)
    if (!isValidType) {
      return Result.fail<NotificationType>(`Invalid notification type: ${notificationType}`)
    } else {
      return Result.ok<NotificationType>(new NotificationType({ value: notificationType }))
    }
  }
}
