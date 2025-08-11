import { routerNavigatedAction, RouterNavigatedAction } from '@ngrx/router-store'
import { createReducer, on } from '@ngrx/store'
import { AIKnowledgeDocumentSearchActions } from './aiknowledge-document-search.actions'
import { AIKnowledgeDocumentSearchColumns } from './aiknowledge-document-search.columns'
import { AIKnowledgeDocumentSearchCriteriasSchema } from './aiknowledge-document-search.parameters'
import { AIKnowledgeDocumentSearchState } from './aiknowledge-document-search.state'

export const initialState: AIKnowledgeDocumentSearchState = {
  columns: AIKnowledgeDocumentSearchColumns,
  results: [],
  displayedColumns: null,
  viewMode: 'basic',
  chartVisible: false,
  searchLoadingIndicator: false,
  criteria: {}
}

export const AIKnowledgeDocumentSearchReducer = createReducer(
  initialState,
  on(routerNavigatedAction, (state: AIKnowledgeDocumentSearchState, action: RouterNavigatedAction) => {
    const results = AIKnowledgeDocumentSearchCriteriasSchema.safeParse(action.payload.routerState.root.queryParams)
    if (results.success) {
      return {
        ...state,
        criteria: results.data,
        searchLoadingIndicator: Object.keys(action.payload.routerState.root.queryParams).length != 0
      }
    }
    return state
  }),
  on(
    AIKnowledgeDocumentSearchActions.resetButtonClicked,
    (state: AIKnowledgeDocumentSearchState): AIKnowledgeDocumentSearchState => ({
      ...state,
      results: initialState.results,
      criteria: {}
    })
  ),
  on(
    AIKnowledgeDocumentSearchActions.searchButtonClicked,
    (state: AIKnowledgeDocumentSearchState, { searchCriteria }): AIKnowledgeDocumentSearchState => ({
      ...state,
      searchLoadingIndicator: true,
      criteria: searchCriteria
    })
  ),
  on(
    AIKnowledgeDocumentSearchActions.aIKnowledgeDocumentSearchResultsReceived,
    (state: AIKnowledgeDocumentSearchState, { results }): AIKnowledgeDocumentSearchState => ({
      ...state,
      results
    })
  ),
  on(
    AIKnowledgeDocumentSearchActions.aIKnowledgeDocumentSearchResultsLoadingFailed,
    (state: AIKnowledgeDocumentSearchState): AIKnowledgeDocumentSearchState => ({
      ...state,
      results: []
    })
  ),
  on(
    AIKnowledgeDocumentSearchActions.chartVisibilityRehydrated,
    (state: AIKnowledgeDocumentSearchState, { visible }): AIKnowledgeDocumentSearchState => ({
      ...state,
      chartVisible: visible
    })
  ),
  on(
    AIKnowledgeDocumentSearchActions.chartVisibilityToggled,
    (state: AIKnowledgeDocumentSearchState): AIKnowledgeDocumentSearchState => ({
      ...state,
      chartVisible: !state.chartVisible
    })
  ),
  on(
    AIKnowledgeDocumentSearchActions.viewModeChanged,
    (state: AIKnowledgeDocumentSearchState, { viewMode }): AIKnowledgeDocumentSearchState => ({
      ...state,
      viewMode: viewMode
    })
  ),
  on(
    AIKnowledgeDocumentSearchActions.displayedColumnsChanged,
    (state: AIKnowledgeDocumentSearchState, { displayedColumns }): AIKnowledgeDocumentSearchState => ({
      ...state,
      displayedColumns: displayedColumns.map((v) => v.id)
    })
  )
)
