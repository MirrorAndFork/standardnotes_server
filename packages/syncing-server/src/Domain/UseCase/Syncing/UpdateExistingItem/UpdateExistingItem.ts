import {
  ContentType,
  Dates,
  NotificationPayload,
  NotificationType,
  Result,
  RoleNameCollection,
  Timestamps,
  UniqueEntityId,
  UseCaseInterface,
  Uuid,
  Validator,
} from '@standardnotes/domain-core'
import { DomainEventPublisherInterface } from '@standardnotes/domain-events'
import { TimerInterface } from '@standardnotes/time'

import { Item } from '../../../Item/Item'
import { UpdateExistingItemDTO } from './UpdateExistingItemDTO'
import { DomainEventFactoryInterface } from '../../../Event/DomainEventFactoryInterface'
import { SharedVaultAssociation } from '../../../SharedVault/SharedVaultAssociation'
import { KeySystemAssociation } from '../../../KeySystem/KeySystemAssociation'
import { DetermineSharedVaultOperationOnItem } from '../../SharedVaults/DetermineSharedVaultOperationOnItem/DetermineSharedVaultOperationOnItem'
import { SharedVaultOperationOnItem } from '../../../SharedVault/SharedVaultOperationOnItem'
import { AddNotificationForUser } from '../../Messaging/AddNotificationForUser/AddNotificationForUser'
import { RemoveNotificationsForUser } from '../../Messaging/RemoveNotificationsForUser/RemoveNotificationsForUser'
import { ItemRepositoryResolverInterface } from '../../../Item/ItemRepositoryResolverInterface'

export class UpdateExistingItem implements UseCaseInterface<Item> {
  constructor(
    private itemRepositoryResolver: ItemRepositoryResolverInterface,
    private timer: TimerInterface,
    private domainEventPublisher: DomainEventPublisherInterface,
    private domainEventFactory: DomainEventFactoryInterface,
    private revisionFrequency: number,
    private determineSharedVaultOperationOnItem: DetermineSharedVaultOperationOnItem,
    private addNotificationForUser: AddNotificationForUser,
    private removeNotificationsForUser: RemoveNotificationsForUser,
  ) {}

  async execute(dto: UpdateExistingItemDTO): Promise<Result<Item>> {
    let sessionUuid = null
    if (dto.sessionUuid) {
      const sessionUuidOrError = Uuid.create(dto.sessionUuid)
      if (sessionUuidOrError.isFailed()) {
        return Result.fail(sessionUuidOrError.getError())
      }
      sessionUuid = sessionUuidOrError.getValue()
    }
    dto.existingItem.props.updatedWithSession = sessionUuid

    const userUuidOrError = Uuid.create(dto.performingUserUuid)
    if (userUuidOrError.isFailed()) {
      return Result.fail(userUuidOrError.getError())
    }
    const userUuid = userUuidOrError.getValue()

    const roleNamesOrError = RoleNameCollection.create(dto.roleNames)
    if (roleNamesOrError.isFailed()) {
      return Result.fail(roleNamesOrError.getError())
    }
    const roleNames = roleNamesOrError.getValue()

    if (dto.itemHash.props.content) {
      dto.existingItem.props.content = dto.itemHash.props.content
    }

    if (dto.itemHash.props.content_type) {
      const contentTypeOrError = ContentType.create(dto.itemHash.props.content_type)
      if (contentTypeOrError.isFailed()) {
        return Result.fail(contentTypeOrError.getError())
      }
      const contentType = contentTypeOrError.getValue()
      dto.existingItem.props.contentType = contentType
    }

    if (dto.itemHash.props.deleted !== undefined) {
      dto.existingItem.props.deleted = dto.itemHash.props.deleted
    }

    let wasMarkedAsDuplicate = false
    if (dto.itemHash.props.duplicate_of) {
      const duplicateOfOrError = Uuid.create(dto.itemHash.props.duplicate_of)
      if (duplicateOfOrError.isFailed()) {
        return Result.fail(duplicateOfOrError.getError())
      }
      wasMarkedAsDuplicate = dto.existingItem.props.duplicateOf === null
      dto.existingItem.props.duplicateOf = duplicateOfOrError.getValue()
    }

    if (dto.itemHash.props.auth_hash) {
      dto.existingItem.props.authHash = dto.itemHash.props.auth_hash
    }
    if (dto.itemHash.props.enc_item_key) {
      dto.existingItem.props.encItemKey = dto.itemHash.props.enc_item_key
    }
    if (dto.itemHash.props.items_key_id) {
      dto.existingItem.props.itemsKeyId = dto.itemHash.props.items_key_id
    }

    const updatedAtTimestamp = this.timer.getTimestampInMicroseconds()
    const secondsFromLastUpdate = this.timer.convertMicrosecondsToSeconds(
      updatedAtTimestamp - dto.existingItem.props.timestamps.updatedAt,
    )
    const updatedAtDate = this.timer.convertMicrosecondsToDate(updatedAtTimestamp)

    let createdAtTimestamp: number
    let createdAtDate: Date
    if (dto.itemHash.props.created_at_timestamp) {
      createdAtTimestamp = dto.itemHash.props.created_at_timestamp
      createdAtDate = this.timer.convertMicrosecondsToDate(createdAtTimestamp)
    } else if (dto.itemHash.props.created_at) {
      createdAtTimestamp = this.timer.convertStringDateToMicroseconds(dto.itemHash.props.created_at)
      createdAtDate = this.timer.convertStringDateToDate(dto.itemHash.props.created_at)
    } else {
      return Result.fail('Created at timestamp is required.')
    }

    const datesOrError = Dates.create(createdAtDate, updatedAtDate)
    if (datesOrError.isFailed()) {
      return Result.fail(datesOrError.getError())
    }
    dto.existingItem.props.dates = datesOrError.getValue()

    const timestampsOrError = Timestamps.create(createdAtTimestamp, updatedAtTimestamp)
    if (timestampsOrError.isFailed()) {
      return Result.fail(timestampsOrError.getError())
    }
    dto.existingItem.props.timestamps = timestampsOrError.getValue()

    dto.existingItem.props.contentSize = Buffer.byteLength(JSON.stringify(dto.existingItem))

    let sharedVaultOperation: SharedVaultOperationOnItem | null = null
    if (dto.itemHash.representsASharedVaultItem()) {
      const sharedVaultAssociationOrError = SharedVaultAssociation.create(
        {
          lastEditedBy: userUuid,
          sharedVaultUuid: dto.itemHash.sharedVaultUuid as Uuid,
        },
        new UniqueEntityId(
          dto.existingItem.props.sharedVaultAssociation
            ? dto.existingItem.props.sharedVaultAssociation.id.toString()
            : undefined,
        ),
      )

      if (sharedVaultAssociationOrError.isFailed()) {
        return Result.fail(sharedVaultAssociationOrError.getError())
      }

      dto.existingItem.setSharedVaultAssociation(sharedVaultAssociationOrError.getValue())

      const sharedVaultOperationOrError = await this.determineSharedVaultOperationOnItem.execute({
        existingItem: dto.existingItem,
        itemHash: dto.itemHash,
        userUuid: userUuid.value,
      })
      if (sharedVaultOperationOrError.isFailed()) {
        return Result.fail(sharedVaultOperationOrError.getError())
      }
      sharedVaultOperation = sharedVaultOperationOrError.getValue()
    } else {
      dto.existingItem.unsetSharedVaultAssociation()
    }

    if (dto.itemHash.hasDedicatedKeySystemAssociation()) {
      const keySystemIdentifiedValidationResult = Validator.isNotEmptyString(dto.itemHash.props.key_system_identifier)
      if (keySystemIdentifiedValidationResult.isFailed()) {
        return Result.fail(keySystemIdentifiedValidationResult.getError())
      }
      const keySystemIdentifier = dto.itemHash.props.key_system_identifier as string

      const keySystemAssociationOrError = KeySystemAssociation.create(
        {
          keySystemIdentifier,
        },
        new UniqueEntityId(
          dto.existingItem.props.keySystemAssociation
            ? dto.existingItem.props.keySystemAssociation.id.toString()
            : undefined,
        ),
      )
      if (keySystemAssociationOrError.isFailed()) {
        return Result.fail(keySystemAssociationOrError.getError())
      }

      dto.existingItem.setKeySystemAssociation(keySystemAssociationOrError.getValue())
    } else {
      dto.existingItem.unsetKeySystemAssociation()
    }

    if (dto.itemHash.props.deleted === true) {
      dto.existingItem.props.deleted = true
      dto.existingItem.props.content = null
      dto.existingItem.props.contentSize = 0
      dto.existingItem.props.encItemKey = null
      dto.existingItem.props.authHash = null
      dto.existingItem.props.itemsKeyId = null
    }

    const itemRepository = this.itemRepositoryResolver.resolve(roleNames)

    await itemRepository.save(dto.existingItem)

    if (secondsFromLastUpdate >= this.revisionFrequency) {
      if (
        dto.existingItem.props.contentType.value !== null &&
        [ContentType.TYPES.Note, ContentType.TYPES.File].includes(dto.existingItem.props.contentType.value)
      ) {
        await this.domainEventPublisher.publish(
          this.domainEventFactory.createItemRevisionCreationRequested(
            dto.existingItem.id.toString(),
            dto.existingItem.props.userUuid.value,
          ),
        )
      }
    }

    if (wasMarkedAsDuplicate) {
      await this.domainEventPublisher.publish(
        this.domainEventFactory.createDuplicateItemSyncedEvent(
          dto.existingItem.id.toString(),
          dto.existingItem.props.userUuid.value,
        ),
      )
    }

    const notificationsResult = await this.addNotifications(dto.existingItem.uuid, userUuid, sharedVaultOperation)
    if (notificationsResult.isFailed()) {
      return Result.fail(notificationsResult.getError())
    }

    return Result.ok(dto.existingItem)
  }

  private async addNotifications(
    itemUuid: Uuid,
    userUuid: Uuid,
    sharedVaultOperation: SharedVaultOperationOnItem | null,
  ): Promise<Result<void>> {
    if (
      sharedVaultOperation &&
      sharedVaultOperation.props.type === SharedVaultOperationOnItem.TYPES.RemoveFromSharedVault
    ) {
      const notificationPayloadOrError = NotificationPayload.create({
        sharedVaultUuid: sharedVaultOperation.props.sharedVaultUuid,
        type: NotificationType.create(NotificationType.TYPES.SharedVaultItemRemoved).getValue(),
        itemUuid: itemUuid,
        version: '1.0',
      })
      if (notificationPayloadOrError.isFailed()) {
        return Result.fail(notificationPayloadOrError.getError())
      }
      const payload = notificationPayloadOrError.getValue()

      const result = await this.addNotificationForUser.execute({
        payload,
        type: NotificationType.TYPES.SharedVaultItemRemoved,
        userUuid: userUuid.value,
        version: '1.0',
      })
      if (result.isFailed()) {
        return Result.fail(result.getError())
      }
    }

    if (sharedVaultOperation && sharedVaultOperation.props.type === SharedVaultOperationOnItem.TYPES.AddToSharedVault) {
      const result = await this.removeNotificationsForUser.execute({
        type: NotificationType.TYPES.SharedVaultItemRemoved,
        userUuid: userUuid.value,
      })
      if (result.isFailed()) {
        return Result.fail(result.getError())
      }
    }

    return Result.ok()
  }
}
