import { Repository } from 'typeorm'
import { DBConnection } from '@/index'

export default class BaseService {
  private privateRepository: Repository<any> | null = null

  private repositoryType: any

  constructor(repositoryType: any) {
    this.repositoryType = repositoryType
  }

  protected get repository() {
    if (!this.privateRepository) {
      this.privateRepository = DBConnection.getRepository(this.repositoryType)
    }
    return this.privateRepository
  }
}
