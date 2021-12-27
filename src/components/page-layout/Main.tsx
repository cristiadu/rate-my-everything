import React from 'react'
import { Columns } from 'react-bulma-components'
import FilterMenu from './FilterMenu'
import MainContent from './MainContent'

export default () => (
  <Columns>
    <Columns.Column size="one-fifth">
      <FilterMenu />
    </Columns.Column>
    <Columns.Column size="four-fifths">
      <MainContent />
    </Columns.Column>
  </Columns>
)
