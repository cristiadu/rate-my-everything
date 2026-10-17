import React from 'react'
import type { RatedItemResponse } from '@/api/generated/api'
import { collectiveGrade, gradeColor, personalGrade, raterCount } from '@/components/rankings/rankingData'
import { NOT_RATED } from '@/components/rankings/RankingTableItem'

/** Props for one big, color-coded grade. */
interface GradeBoxProps {
  /** What the grade is, shown big under it. */
  label: string;
  /** The grade, or null when there is none yet. */
  grade: number | null;
  /** How many ratings the grade comes from. */
  detail: string;
}

/** Shows one grade as a big number in a box colored by how good the grade is, with its label under it. */
const GradeBox: React.FC<GradeBoxProps> = ({ label, grade, detail }) => (
  <div className="has-text-centered">
    <div className={`notification is-${gradeColor(grade)} grade-box mb-2`}>
      <p className="title is-1">{grade === null ? NOT_RATED : grade.toFixed(1)}</p>
    </div>
    <p className="is-size-5 is-size-6-mobile has-text-weight-bold mb-0">{label}</p>
    <p className="is-size-7 has-text-grey">{detail}</p>
  </div>
)

/** Props for an item's personal and collective grades. */
interface ItemGradesProps {
  /** Every user's ratings of the item, the signed-in user's included. */
  itemRatings: RatedItemResponse[];
  /** Id of the signed-in user, whose personal grade is shown. */
  userId: number | null;
}

/** Shows the signed-in user's grade of an item next to everyone's grade, each as a big color-coded box. */
const ItemGrades: React.FC<ItemGradesProps> = ({ itemRatings, userId }) => {
  /** Every time the signed-in user rated the item. */
  const myRatings = itemRatings.filter((ratedItem) => ratedItem.userId === userId)

  return (
    <div className="columns is-mobile is-centered">
      <div className="column is-narrow">
        <GradeBox label="My grade" grade={personalGrade(itemRatings, userId)} detail={`from ${myRatings.length} of my ratings`} />
      </div>
      <div className="column is-narrow">
        <GradeBox
          label="Everyone's grade"
          grade={itemRatings.length > 0 ? collectiveGrade(itemRatings) : null}
          detail={`from ${raterCount(itemRatings)} ${raterCount(itemRatings) === 1 ? 'user' : 'users'}`}
        />
      </div>
    </div>
  )
}

export default ItemGrades
