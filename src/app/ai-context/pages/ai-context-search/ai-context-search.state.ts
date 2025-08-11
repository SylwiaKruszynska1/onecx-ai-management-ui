import {
  DataTableColumn,
  DiagramComponentState,
  InteractiveDataViewComponentState,
  SearchHeaderComponentState
} from '@onecx/portal-integration-angular'
import { AIContext } from 'src/app/shared/generated'
import { AiContextSearchCriteria } from './ai-context-search.parameters'

export interface AiContextSearchState {
  columns: DataTableColumn[]
  results: AIContext[]
  displayedColumns: string[] | null
  viewMode: 'basic' | 'advanced'
  chartVisible: boolean
  resultComponentState: InteractiveDataViewComponentState | null
  searchHeaderComponentState: SearchHeaderComponentState | null
  diagramComponentState: DiagramComponentState | null
  searchLoadingIndicator: boolean
  criteria: AiContextSearchCriteria
  searchExecuted: boolean
}
