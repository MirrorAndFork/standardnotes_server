import 'reflect-metadata'

import { AccountDeletionRequestedEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'
import { Item } from '../Item/Item'
import { ItemRepositoryInterface } from '../Item/ItemRepositoryInterface'
import { AccountDeletionRequestedEventHandler } from './AccountDeletionRequestedEventHandler'
import { Uuid, ContentType, Dates, Timestamps, UniqueEntityId } from '@standardnotes/domain-core'

describe('AccountDeletionRequestedEventHandler', () => {
  let primaryItemRepository: ItemRepositoryInterface
  let secondaryItemRepository: ItemRepositoryInterface | null
  let logger: Logger
  let event: AccountDeletionRequestedEvent
  let item: Item

  const createHandler = () =>
    new AccountDeletionRequestedEventHandler(primaryItemRepository, secondaryItemRepository, logger)

  beforeEach(() => {
    item = Item.create(
      {
        userUuid: Uuid.create('00000000-0000-0000-0000-000000000000').getValue(),
        updatedWithSession: null,
        content: 'foobar',
        contentType: ContentType.create(ContentType.TYPES.Note).getValue(),
        encItemKey: null,
        authHash: null,
        itemsKeyId: null,
        duplicateOf: null,
        deleted: false,
        dates: Dates.create(new Date(1616164633241311), new Date(1616164633241311)).getValue(),
        timestamps: Timestamps.create(1616164633241311, 1616164633241311).getValue(),
      },
      new UniqueEntityId('00000000-0000-0000-0000-000000000000'),
    ).getValue()

    primaryItemRepository = {} as jest.Mocked<ItemRepositoryInterface>
    primaryItemRepository.findAll = jest.fn().mockReturnValue([item])
    primaryItemRepository.deleteByUserUuid = jest.fn()

    logger = {} as jest.Mocked<Logger>
    logger.info = jest.fn()

    event = {} as jest.Mocked<AccountDeletionRequestedEvent>
    event.createdAt = new Date(1)
    event.payload = {
      userUuid: '2-3-4',
      userCreatedAtTimestamp: 1,
      regularSubscriptionUuid: '1-2-3',
    }
  })

  it('should remove all items for a user', async () => {
    await createHandler().handle(event)

    expect(primaryItemRepository.deleteByUserUuid).toHaveBeenCalledWith('2-3-4')
  })

  it('should remove all items for a user from secondary repository', async () => {
    secondaryItemRepository = {} as jest.Mocked<ItemRepositoryInterface>
    secondaryItemRepository.deleteByUserUuid = jest.fn()

    await createHandler().handle(event)

    expect(secondaryItemRepository.deleteByUserUuid).toHaveBeenCalledWith('2-3-4')

    secondaryItemRepository = null
  })
})
