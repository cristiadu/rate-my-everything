import { EntityTarget, Repository } from 'typeorm'
import { DBConnection } from '@/index'

export default class BaseService<T extends object> {
  private privateRepository: Repository<T> | null = null

  private repositoryType: EntityTarget<T>

  constructor(repositoryType: EntityTarget<T>) {
    this.repositoryType = repositoryType
  }

  protected get repository() {
    if (!this.privateRepository) {
      this.privateRepository = DBConnection.getRepository(this.repositoryType)
    }
    return this.privateRepository
  }
}
