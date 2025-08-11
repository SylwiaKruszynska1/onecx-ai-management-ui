import { routerNavigatedAction, RouterNavigatedAction } from '@ngrx/router-store'
import { createReducer, on } from '@ngrx/store'
import { AiContextSearchActions } from './ai-context-search.actions'
import { aiContextSearchColumns } from './ai-context-search.columns'
import { aiContextSearchCriteriasSchema } from './ai-context-search.parameters'
import { AiContextSearchState } from './ai-context-search.state'

export const initialState: AiContextSearchState = {
  columns: aiContextSearchColumns,
  results: [],
  displayedColumns: null,
  chartVisible: false,
  viewMode: 'basic',
  resultComponentState: null,
  searchHeaderComponentState: null,
  diagramComponentState: null,
  searchLoadingIndicator: false,
  criteria: {},
  searchExecuted: false
}

export const aiContextSearchReducer = createReducer(
  initialState,
  on(routerNavigatedAction, (state: AiContextSearchState, action: RouterNavigatedAction) => {
    const results = aiContextSearchCriteriasSchema.safeParse(action.payload.routerState.root.queryParams)
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
    AiContextSearchActions.resetButtonClicked,
    (state: AiContextSearchState): AiContextSearchState => ({
      ...state,
      results: initialState.results,
      criteria: {},
      searchExecuted: false
    })
  ),
  on(
    AiContextSearchActions.searchButtonClicked,
    (state: AiContextSearchState, { searchCriteria }): AiContextSearchState => ({
      ...state,
      searchLoadingIndicator: true,
      criteria: searchCriteria
    })
  ),
  on(
    AiContextSearchActions.aiContextSearchResultsReceived,
    (state: AiContextSearchState, { stream }): AiContextSearchState => ({
      ...state,
      results: stream,
      searchLoadingIndicator: false,
      searchExecuted: true
    })
  ),
  on(
    AiContextSearchActions.aiContextSearchResultsLoadingFailed,
    (state: AiContextSearchState): AiContextSearchState => ({
      ...state,
      results: [],
      searchLoadingIndicator: false
    })
  ),
  on(
    AiContextSearchActions.chartVisibilityToggled,
    (state: AiContextSearchState): AiContextSearchState => ({
      ...state,
      chartVisible: !state.chartVisible
    })
  ),
  on(
    AiContextSearchActions.resultComponentStateChanged,
    (state: AiContextSearchState, resultComponentState): AiContextSearchState => ({
      ...state,
      resultComponentState
    })
  ),
  on(
    AiContextSearchActions.searchHeaderComponentStateChanged,
    (state: AiContextSearchState, searchHeaderComponentState): AiContextSearchState => ({
      ...state,
      searchHeaderComponentState
    })
  ),
  on(
    AiContextSearchActions.diagramComponentStateChanged,
    (state: AiContextSearchState, diagramComponentState): AiContextSearchState => ({
      ...state,
      diagramComponentState
    })
  ),
  on(
    AiContextSearchActions.viewModeChanged,
    (state: AiContextSearchState, { viewMode }): AiContextSearchState => ({
      ...state,
      viewMode: viewMode
    })
  ),
  on(
    AiContextSearchActions.displayedColumnsChanged,
    (state: AiContextSearchState, { displayedColumns }): AiContextSearchState => ({
      ...state,
      displayedColumns: displayedColumns.map((v) => v.id)
    })
  )
)
