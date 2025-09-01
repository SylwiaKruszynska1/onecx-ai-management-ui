import { ColumnType } from "@onecx/angular-accelerator"
import { AIKnowledgeDocumentSearchActions } from "./aiknowledge-document-search.actions"
import { AIKnowledgeDocumentSearchReducer, initialState } from "./aiknowledge-document-search.reducers"
import { AIKnowledgeDocumentSearchCriteriasSchema } from "./aiknowledge-document-search.parameters"
import { routerNavigatedAction } from "@ngrx/router-store"

describe('AIKnowledgeDocumentSearchReducer', () => {
  it('should set criteria and searchLoadingIndicator on routerNavigatedAction with valid queryParams', () => {
    const validQueryParams = { name: 'test' }
    const action = routerNavigatedAction({
      payload: {
        routerState: {
          root: {
            queryParams: validQueryParams
          }
        }
      }
    } as any)
    jest.spyOn(AIKnowledgeDocumentSearchCriteriasSchema, 'safeParse').mockReturnValue({
      success: true,
      data: validQueryParams
    } as any)
    const state = AIKnowledgeDocumentSearchReducer(initialState, action)
    expect(state.criteria).toEqual(validQueryParams)
    expect(state.searchLoadingIndicator).toBe(true)
  })

  it('should not change state on routerNavigatedAction with invalid queryParams', () => {
    const action = routerNavigatedAction({
      payload: {
        routerState: {
          root: {
            queryParams: {}
          }
        }
      }
    } as any)
    jest.spyOn(AIKnowledgeDocumentSearchCriteriasSchema, 'safeParse').mockReturnValue({
      success: false
    } as any)
    const state = AIKnowledgeDocumentSearchReducer(initialState, action)
    expect(state).toEqual(initialState)
  })

  it('should reset results and criteria on resetButtonClicked', () => {
    const state = AIKnowledgeDocumentSearchReducer(
      { ...initialState, results: [{
        id: '1',
        name: ''
      }], criteria: { name: 'abc' } },
      AIKnowledgeDocumentSearchActions.resetButtonClicked()
    )
    expect(state.results).toEqual(initialState.results)
    expect(state.criteria).toEqual({})
  })

  it('should set searchLoadingIndicator and criteria on searchButtonClicked', () => {
    const criteria = { name: 'abc' }
    const state = AIKnowledgeDocumentSearchReducer(
      initialState,
      AIKnowledgeDocumentSearchActions.searchButtonClicked({ searchCriteria: criteria })
    )
    expect(state.searchLoadingIndicator).toBe(true)
    expect(state.criteria).toEqual(criteria)
  })

  it('should set results on aIKnowledgeDocumentSearchResultsReceived', () => {
    const results = [
      { id: '1', imagePath: '', name: 'Document 1' }
    ]
    const state = AIKnowledgeDocumentSearchReducer(
      initialState,
      AIKnowledgeDocumentSearchActions.aIKnowledgeDocumentSearchResultsReceived({
        results,
        totalNumberOfResults: results.length
      })
    )
    expect(state.results).toEqual(results)
  })

  it('should clear results on aIKnowledgeDocumentSearchResultsLoadingFailed', () => {
    const state = AIKnowledgeDocumentSearchReducer(
      { ...initialState, results: [{
        id: '1',
        name: ''
      }] },
      AIKnowledgeDocumentSearchActions.aIKnowledgeDocumentSearchResultsLoadingFailed({ error: null })
    )
    expect(state.results).toEqual([])
  })

  it('should set chartVisible on chartVisibilityRehydrated', () => {
    const state = AIKnowledgeDocumentSearchReducer(
      initialState,
      AIKnowledgeDocumentSearchActions.chartVisibilityRehydrated({ visible: true })
    )
    expect(state.chartVisible).toBe(true)
  })

  it('should toggle chartVisible on chartVisibilityToggled', () => {
    const state = AIKnowledgeDocumentSearchReducer(
      { ...initialState, chartVisible: false },
      AIKnowledgeDocumentSearchActions.chartVisibilityToggled()
    )
    expect(state.chartVisible).toBe(true)
  })

  it('should set viewMode on viewModeChanged', () => {
    const state = AIKnowledgeDocumentSearchReducer(
      initialState,
      AIKnowledgeDocumentSearchActions.viewModeChanged({ viewMode: 'advanced' })
    )
    expect(state.viewMode).toBe('advanced')
  })

  it('should set displayedColumns on displayedColumnsChanged', () => {
    const displayedColumns = [
      { id: 'col1', nameKey: 'Col1', columnType: ColumnType.STRING },
      { id: 'col2', nameKey: 'Col2', columnType: ColumnType.STRING }
    ]
    const state = AIKnowledgeDocumentSearchReducer(
      initialState,
      AIKnowledgeDocumentSearchActions.displayedColumnsChanged({ displayedColumns })
    )
    expect(state.displayedColumns).toEqual(['col1', 'col2'])
  })
})