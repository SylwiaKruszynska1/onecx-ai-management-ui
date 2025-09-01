import { ColumnType, DiagramComponentState } from "@onecx/angular-accelerator"
import { AiKnowledgeBaseSearchActions } from "./ai-knowledge-base-search.actions"
import { aiKnowledgeBaseSearchReducer, initialState } from "./ai-knowledge-base-search.reducers"
import { routerNavigatedAction } from "@ngrx/router-store"
import { ZodError } from "zod"
import { aiKnowledgeBaseSearchCriteriasSchema } from "./ai-knowledge-base-search.parameters"

describe('aiKnowledgeBaseSearchReducer', () => {
  it('should return state for unknown action', () => {
    const state = aiKnowledgeBaseSearchReducer(initialState, { type: 'UNKNOWN' } as any)
    expect(state).toBe(initialState)
  })

  it('should reset results and criteria on resetButtonClicked', () => {
    const state = aiKnowledgeBaseSearchReducer(
      { ...initialState, results: [{ id: '1' }], criteria: { name: 'test' }, searchExecuted: true },
      AiKnowledgeBaseSearchActions.resetButtonClicked()
    )
    expect(state.results).toEqual(initialState.results)
    expect(state.criteria).toEqual({})
    expect(state.searchExecuted).toBe(false)
  })

  it('should set criteria on searchButtonClicked', () => {
    const criteria = { name: 'test' }
    const state = aiKnowledgeBaseSearchReducer(
      initialState,
      AiKnowledgeBaseSearchActions.searchButtonClicked({ searchCriteria: criteria })
    )
    expect(state.criteria).toEqual(criteria)
  })

  it('should set results on aiKnowledgeBaseSearchResultsReceived', () => {
    const stream = [{ id: '1' }, { id: '2' }]
    const state = aiKnowledgeBaseSearchReducer(
      initialState,
      AiKnowledgeBaseSearchActions.aiKnowledgeBaseSearchResultsReceived({
        stream,
        size: 2,
        number: 0,
        totalElements: 2,
        totalPages: 1
      })
    )
    expect(state.results).toEqual(stream)
    expect(state.searchLoadingIndicator).toBe(false)
    expect(state.searchExecuted).toBe(true)
  })

  it('should clear results on aiKnowledgeBaseSearchResultsLoadingFailed', () => {
    const state = aiKnowledgeBaseSearchReducer(
      { ...initialState, results: [{ id: '1' }] },
      AiKnowledgeBaseSearchActions.aiKnowledgeBaseSearchResultsLoadingFailed({ error: null })
    )
    expect(state.results).toEqual([])
    expect(state.searchLoadingIndicator).toBe(false)
  })

  it('should toggle chartVisible', () => {
    // false => true
    let state = aiKnowledgeBaseSearchReducer(
      { ...initialState, chartVisible: false },
      AiKnowledgeBaseSearchActions.chartVisibilityToggled()
    )
    expect(state.chartVisible).toBe(true)

    // true => false
    state = aiKnowledgeBaseSearchReducer(
      { ...state, chartVisible: true },
      AiKnowledgeBaseSearchActions.chartVisibilityToggled()
    )
    expect(state.chartVisible).toBe(false)
  })

  it('should set displayedColumns on displayedColumnsChanged', () => {
    const displayedColumns = [
      { id: 'col1', nameKey: 'Col1', columnType: ColumnType.STRING },
      { id: 'col2', nameKey: 'Col2', columnType: ColumnType.STRING }
    ]
    const state = aiKnowledgeBaseSearchReducer(
      initialState,
      AiKnowledgeBaseSearchActions.displayedColumnsChanged({ displayedColumns })
    )
    expect(state.displayedColumns).toEqual(['col1', 'col2'])
  })

  it('should update criteria and searchLoadingIndicator on routerNavigatedAction with valid queryParams', () => {
    jest.spyOn(aiKnowledgeBaseSearchCriteriasSchema, 'safeParse').mockReturnValue({
      success: true,
      data: { name: 'test' }
    })
    const queryParams = { name: 'test' }
    const action = routerNavigatedAction({
      payload: {
        routerState: {
          root: { queryParams }
        }
      }
    } as any)
    const state = aiKnowledgeBaseSearchReducer(initialState, action)
    expect(state.criteria).toEqual({ name: 'test' })
    expect(state.searchLoadingIndicator).toBe(true)
  })

  it('should not update state on routerNavigatedAction with invalid queryParams', () => {
    jest.spyOn(aiKnowledgeBaseSearchCriteriasSchema, 'safeParse').mockReturnValue({
      success: false,
      error: new ZodError([]) 
    })
    const queryParams = { invalid: true }
    const action = routerNavigatedAction({
      payload: {
        routerState: {
          root: { queryParams }
        }
      }
    } as any)
    const state = aiKnowledgeBaseSearchReducer(initialState, action)
    expect(state).toEqual(initialState)
  })

  it('should update resultComponentState on resultComponentStateChanged', () => {
    const payload = { layout: 'grid' } as any
    const state = aiKnowledgeBaseSearchReducer(
      initialState,
      AiKnowledgeBaseSearchActions.resultComponentStateChanged(payload)
    )
    expect(state.resultComponentState).not.toBeNull()
    expect(state.resultComponentState!.layout).toEqual(payload.layout)
  })

  it('should update searchHeaderComponentState on searchHeaderComponentStateChanged', () => {
    const payload = { activeViewMode: 'advanced' } as any
    const state = aiKnowledgeBaseSearchReducer(
      initialState,
      AiKnowledgeBaseSearchActions.searchHeaderComponentStateChanged(payload)
    )
    expect(state.searchHeaderComponentState).not.toBeNull()
    expect(state.searchHeaderComponentState!.activeViewMode).toEqual(payload.activeViewMode)
  })

  it('should update diagramComponentState on diagramComponentStateChanged', () => {
    const payload = { activeDiagramType: 'pie' } as unknown as DiagramComponentState
    const state = aiKnowledgeBaseSearchReducer(
      initialState,
      AiKnowledgeBaseSearchActions.diagramComponentStateChanged(payload)
    )
    expect(state.diagramComponentState).not.toBeNull()
    expect(state.diagramComponentState!.activeDiagramType).toEqual(payload.activeDiagramType)
  })
})