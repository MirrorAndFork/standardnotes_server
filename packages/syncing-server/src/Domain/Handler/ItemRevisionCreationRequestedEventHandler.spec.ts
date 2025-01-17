import 'reflect-metadata'

import {
  DomainEventPublisherInterface,
  DomainEventService,
  ItemRevisionCreationRequestedEvent,
} from '@standardnotes/domain-events'

import { Item } from '../Item/Item'
import { ItemRepositoryInterface } from '../Item/ItemRepositoryInterface'
import { ItemRevisionCreationRequestedEventHandler } from './ItemRevisionCreationRequestedEventHandler'
import { ItemBackupServiceInterface } from '../Item/ItemBackupServiceInterface'
import { DomainEventFactoryInterface } from '../Event/DomainEventFactoryInterface'
import { Uuid, ContentType, Dates, Timestamps, UniqueEntityId } from '@standardnotes/domain-core'

describe('ItemRevisionCreationRequestedEventHandler', () => {
  let primaryItemRepository: ItemRepositoryInterface
  let secondaryItemRepository: ItemRepositoryInterface | null
  let event: ItemRevisionCreationRequestedEvent
  let item: Item
  let itemBackupService: ItemBackupServiceInterface
  let domainEventFactory: DomainEventFactoryInterface
  let domainEventPublisher: DomainEventPublisherInterface

  const createHandler = () =>
    new ItemRevisionCreationRequestedEventHandler(
      primaryItemRepository,
      secondaryItemRepository,
      itemBackupService,
      domainEventFactory,
      domainEventPublisher,
    )

  beforeEach(() => {
    item = Item.create(
      {
        userUuid: Uuid.create('00000000-0000-0000-0000-000000000000').getValue(),
        updatedWithSession: null,
        content: 'foobar1',
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
    primaryItemRepository.findByUuid = jest.fn().mockReturnValue(item)

    event = {} as jest.Mocked<ItemRevisionCreationRequestedEvent>
    event.createdAt = new Date(1)
    event.payload = {
      itemUuid: '00000000-0000-0000-0000-000000000000',
    }
    event.meta = {
      correlation: {
        userIdentifier: '1-2-3',
        userIdentifierType: 'uuid',
      },
      origin: DomainEventService.SyncingServer,
    }

    itemBackupService = {} as jest.Mocked<ItemBackupServiceInterface>
    itemBackupService.dump = jest.fn().mockReturnValue('foo://bar')

    domainEventFactory = {} as jest.Mocked<DomainEventFactoryInterface>
    domainEventFactory.createItemDumpedEvent = jest.fn()

    domainEventPublisher = {} as jest.Mocked<DomainEventPublisherInterface>
    domainEventPublisher.publish = jest.fn()
  })

  it('should create a revision for an item', async () => {
    await createHandler().handle(event)

    expect(domainEventPublisher.publish).toHaveBeenCalled()
    expect(domainEventFactory.createItemDumpedEvent).toHaveBeenCalled()
  })

  it('should create a revision for an item in the secondary repository', async () => {
    secondaryItemRepository = {} as jest.Mocked<ItemRepositoryInterface>
    secondaryItemRepository.findByUuid = jest.fn().mockReturnValue(item)

    await createHandler().handle(event)

    expect(domainEventPublisher.publish).toHaveBeenCalled()
    expect(domainEventFactory.createItemDumpedEvent).toHaveBeenCalled()

    secondaryItemRepository = null
  })

  it('should not create a revision for an item that does not exist', async () => {
    primaryItemRepository.findByUuid = jest.fn().mockReturnValue(null)

    await createHandler().handle(event)

    expect(domainEventPublisher.publish).not.toHaveBeenCalled()
  })

  it('should not create a revision for an item if the dump was not created', async () => {
    itemBackupService.dump = jest.fn().mockReturnValue('')

    await createHandler().handle(event)

    expect(domainEventPublisher.publish).not.toHaveBeenCalled()
    expect(domainEventFactory.createItemDumpedEvent).not.toHaveBeenCalled()
  })

  it('should not create a revision if the item uuid is invalid', async () => {
    event.payload.itemUuid = 'invalid-uuid'

    await createHandler().handle(event)

    expect(domainEventPublisher.publish).not.toHaveBeenCalled()
    expect(domainEventFactory.createItemDumpedEvent).not.toHaveBeenCalled()
  })
})
