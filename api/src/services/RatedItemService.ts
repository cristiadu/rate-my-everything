import RatedItem, {
  AttributeFilter, MAX_GRADE, MIN_GRADE, RatingFilters, RatingUpdate,
} from '@/models/RatedItem'
import RankingScope from '@/models/RankingScope'
import BaseService from '@/services/BaseService'
import { SessionUser } from '@/models/User'
import { RatingNotOwned } from '@/errors/RatingNotOwned'
import { canModerate } from '@/helpers/RouteHelper'

/** Relations returned with every rating so clients can show what was rated and its category. */
const RATING_RELATIONS = { item: { category: true } }

/** SQL keeping the items whose personal grade from :userId, the average of their ratings, is within :minGrade and :maxGrade. */
const PERSONAL_GRADE_SQL = `item.id IN (
  SELECT personal.item_id FROM rated_item personal
  WHERE personal.user_id = :userId
  GROUP BY personal.item_id
  HAVING AVG(personal.rating) BETWEEN :minGrade AND :maxGrade)`

/** SQL keeping the items whose collective grade, the average of each user's personal grade, is within :minGrade and :maxGrade. */
const COLLECTIVE_GRADE_SQL = `item.id IN (
  SELECT personal.item_id FROM (
    SELECT item_id, AVG(rating) AS grade FROM rated_item GROUP BY item_id, user_id
  ) personal
  GROUP BY personal.item_id
  HAVING AVG(personal.grade) BETWEEN :minGrade AND :maxGrade)`

/** SQL keeping the items holding the value for attribute filter number `index`: text contains it, other types equal it. */
const attributeFilterSql = (index: number): string => `EXISTS (
  SELECT 1 FROM attribute_value value${index}
  JOIN attribute attribute${index} ON attribute${index}.id = value${index}.attribute_id
  WHERE value${index}.item_id = item.id AND value${index}.attribute_id = :attributeId${index}
  AND CASE WHEN attribute${index}."valueType" = 'string'
    THEN strpos(lower(value${index}.value), lower(:attributeValue${index})) > 0
    ELSE value${index}.value = :attributeValue${index} END)`

/** Parameters of attribute filter number `index` in attributeFilterSql. */
const attributeFilterParameters = (attributeFilter: AttributeFilter, index: number) => ({
  [`attributeId${index}`]: attributeFilter.attributeId,
  [`attributeValue${index}`]: attributeFilter.value,
})

class RatedItemService extends BaseService<RatedItem> {
  constructor() {
    super(RatedItem)
  }

  /** Create a new RatedItem for the given item and user. */
  public async create(itemId: number, userId: number, rating: number, notes?: string): Promise<RatedItem> {
    const newRatedItem = this.repository.create({ item: { id: itemId }, user: { id: userId }, rating, notes })
    const savedRatedItem = await this.repository.save(newRatedItem)
    return this.repository.findOneOrFail({ where: { id: savedRatedItem.id }, relations: RATING_RELATIONS })
  }

  /** Read a RatedItem by id. */
  public async get(id: number): Promise<RatedItem | null> {
    const ratedItem = await this.repository.findOne({ where: { id }, relations: RATING_RELATIONS })
    return ratedItem
  }

  /** Update a RatedItem; only the user who gave it may change it. */
  public async update(id: number, changes: RatingUpdate, sessionUser: SessionUser): Promise<RatedItem | null> {
    const updatedRatedItem = await this.get(id)
    if (!updatedRatedItem) {
      return null
    }
    if (updatedRatedItem.userId !== sessionUser.id) {
      throw new RatingNotOwned(id)
    }
    this.repository.merge(updatedRatedItem, changes)
    return this.repository.save(updatedRatedItem)
  }

  /** Delete a RatedItem; only the user who gave it or a moderator may delete it. */
  public async delete(id: number, sessionUser: SessionUser): Promise<void> {
    const ratedItem = await this.get(id)
    if (!ratedItem) {
      return
    }
    if (ratedItem.userId !== sessionUser.id && !canModerate(sessionUser.roles)) {
      throw new RatingNotOwned(id)
    }
    await this.repository.delete(ratedItem.id)
  }

  /**
   * Get every rating of the items matching the filters, which the database applies.
   * userId is the signed-in user, whose ratings the MINE scope is about.
   */
  public async getAll(filters: RatingFilters, userId: number): Promise<RatedItem[]> {
    const { name, categoryIds, attributes, scope } = filters
    const query = this.repository.createQueryBuilder('ratedItem')
      .innerJoinAndSelect('ratedItem.item', 'item')
      .leftJoinAndSelect('item.category', 'category')
    if (name) {
      query.andWhere('strpos(lower(item.name), lower(:name)) > 0', { name })
    }
    if (categoryIds.length > 0) {
      query.andWhere('category.id IN (:...categoryIds)', { categoryIds })
    }
    attributes.forEach((attributeFilter, index) => {
      query.andWhere(attributeFilterSql(index), attributeFilterParameters(attributeFilter, index))
    })

    const gradeRange = { minGrade: filters.minGrade ?? MIN_GRADE, maxGrade: filters.maxGrade ?? MAX_GRADE }
    if (scope === RankingScope.MINE) {
      query.andWhere(PERSONAL_GRADE_SQL, { ...gradeRange, userId })
    } else if (filters.minGrade !== undefined || filters.maxGrade !== undefined) {
      query.andWhere(COLLECTIVE_GRADE_SQL, gradeRange)
    }
    return query.orderBy('ratedItem.id', 'ASC').getMany()
  }

  /** Get every user's ratings of one item. */
  public async getAllByItemId(itemId: number): Promise<RatedItem[]> {
    return this.repository.find({ where: { item: { id: itemId } }, relations: RATING_RELATIONS })
  }

  /** Get all RatedItems by user_id. */
  public async getAllByUserId(userId: number): Promise<RatedItem[]> {
    return this.repository.find({ where: { user: { id: userId } }, relations: RATING_RELATIONS })
  }
}

export default RatedItemService
