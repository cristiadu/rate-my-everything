/** Kinds of value an attribute holds. */
enum AttributeValueType {
    /** Free text, such as an author's name. */
    STRING = 'string',
    /** Any number, such as a page count. */
    NUMBER = 'number',
    /** Yes or no, stored as `true` or `false`. */
    BOOLEAN = 'boolean',
    /** A calendar day, stored as `YYYY-MM-DD`. */
    DATE = 'date',
    /** An amount of money in the attribute's `currencyCode`, such as `12.50` for USD 12.50. */
    CURRENCY = 'currency',
    /** A percentage given as its number of percent, such as `85` for 85%. */
    PERCENTAGE = 'percentage',
    /** A web address starting with http:// or https://. */
    URL = 'url',
    /** An email address. */
    EMAIL = 'email',
    /** A length of time in whole minutes, such as `135` for 2 h 15 min. */
    DURATION = 'duration',
}

export default AttributeValueType
