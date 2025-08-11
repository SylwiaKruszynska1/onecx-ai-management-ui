import {
  DataTableColumn,
  DiagramComponentState,
  InteractiveDataViewComponentState,
  RowListGridData,
  SearchHeaderComponentState
} from '@onecx/portal-integration-angular'
import { AiContextSearchCriteria } from './ai-context-search.parameters'

export interface AiContextSearchViewModel {
  columns: DataTableColumn[]
  searchCriteria: AiContextSearchCriteria
  results: RowListGridData[]
  displayedColumns: DataTableColumn[]
  resultComponentState: InteractiveDataViewComponentState | null
  searchHeaderComponentState: SearchHeaderComponentState | null
  diagramComponentState: DiagramComponentState | null
  chartVisible: boolean
  searchLoadingIndicator: boolean
  searchExecuted: boolean
}
