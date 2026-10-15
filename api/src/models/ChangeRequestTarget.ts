/** Kind of shared data a change request proposes to change. */
enum ChangeRequestTarget {
    /** An interest (item) that everyone rates. */
    ITEM = 'item',
    /** A category, including the attributes linked to it. */
    CATEGORY = 'category',
}

export default ChangeRequestTarget
