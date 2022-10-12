import { WorkspaceAccessLevel } from '@standardnotes/common'
import { inject, injectable } from 'inversify'

import TYPES from '../../../Bootstrap/Types'
import { WorkspaceRepositoryInterface } from '../../Workspace/WorkspaceRepositoryInterface'
import { WorkspaceUserRepositoryInterface } from '../../Workspace/WorkspaceUserRepositoryInterface'
import { UseCaseInterface } from '../UseCaseInterface'

import { ListWorkspacesDTO } from './ListWorkspacesDTO'
import { ListWorkspacesResponse } from './ListWorkspacesResponse'

@injectable()
export class ListWorkspaces implements UseCaseInterface {
  constructor(
    @inject(TYPES.WorkspaceRepository) private workspaceRepository: WorkspaceRepositoryInterface,
    @inject(TYPES.WorkspaceUserRepository) private workspaceUserRepository: WorkspaceUserRepositoryInterface,
  ) {}

  async execute(dto: ListWorkspacesDTO): Promise<ListWorkspacesResponse> {
    const workspaceAssociations = await this.workspaceUserRepository.findByUserUuid(dto.userUuid)

    const ownedWorkspacesUuids = []
    const joinedWorkspacesUuids = []
    for (const workspaceAssociation of workspaceAssociations) {
      if ([WorkspaceAccessLevel.Admin, WorkspaceAccessLevel.Owner].includes(workspaceAssociation.accessLevel)) {
        ownedWorkspacesUuids.push(workspaceAssociation.uuid)
      } else {
        joinedWorkspacesUuids.push(workspaceAssociation.uuid)
      }
    }

    const ownedWorkspaces = await this.workspaceRepository.findByUuids(ownedWorkspacesUuids)
    const joinedWorkspaces = await this.workspaceRepository.findByUuids(joinedWorkspacesUuids)

    return {
      ownedWorkspaces,
      joinedWorkspaces,
    }
  }
}