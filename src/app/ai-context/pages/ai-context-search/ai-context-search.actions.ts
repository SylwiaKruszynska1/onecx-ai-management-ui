import { createActionGroup, emptyProps, props } from '@ngrx/store'
import {
  DataTableColumn,
  GroupByCountDiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/portal-integration-angular'
import { AIContext } from '../../../shared/generated'
import { AiContextSearchCriteria } from './ai-context-search.parameters'

export const AiContextSearchActions = createActionGroup({
  source: 'AiContextSearch',
  events: {
    'Details button clicked': props<{
      id: number | string
    }>(),

    'Delete aiContext button clicked': props<{
      id: number | string
    }>(),
    'Delete aiContext cancelled': emptyProps(),
    'Delete aiContext succeeded': emptyProps(),
    'Delete aiContext failed': props<{
      error: string | null
    }>(),

    'Create aiContext button clicked': emptyProps(),
    'Edit aiContext button clicked': props<{
      id: number | string
    }>(),
    'Create aiContext cancelled': emptyProps(),
    'Update aiContext cancelled': emptyProps(),
    'Create aiContext succeeded': emptyProps(),
    'Update aiContext succeeded': emptyProps(),
    'Create aiContext failed': props<{
      error: string | null
    }>(),
    'Update aiContext failed': props<{
      error: string | null
    }>(),
    'Search button clicked': props<{
      searchCriteria: AiContextSearchCriteria
    }>(),
    'Reset button clicked': emptyProps(),
    'aiContext search results received': props<{
      stream: AIContext[]
      size: number
      number: number
      totalElements: number
      totalPages: number
    }>(),
    'aiContext search results loading failed': props<{ error: string | null }>(),
    'Export button clicked': emptyProps(),
    'Result component state changed': props<InteractiveDataViewComponentState>(),
    'Search header component state changed': props<SearchHeaderComponentState>(),
    'Diagram component state changed': props<GroupByCountDiagramComponentState>(),
    'Chart visibility toggled': emptyProps(),
    'View mode changed': props<{
      viewMode: 'basic' | 'advanced'
    }>(),
    'Displayed columns changed': props<{
      displayedColumns: DataTableColumn[]
    }>()
  }
})
