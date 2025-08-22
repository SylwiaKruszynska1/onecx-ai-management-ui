import { routerNavigatedAction } from "@ngrx/router-store"
import { AIProviderSearchActions } from "./aiprovider-search.actions"
import { AIProviderSearchReducer, initialState } from "./aiprovider-search.reducers"

describe('AIProviderSearchReducer', () => {
  it('should parse query params on routerNavigatedAction (success)', () => {
    const action = routerNavigatedAction({
      payload: {
        routerState: {
          root: {
            queryParams: { name: 'Test' }
          }
        }
      }
    } as any)
    const state = AIProviderSearchReducer(initialState, action)
    expect(state.criteria).toEqual({ name: 'Test' })
    expect(state.searchLoadingIndicator).toBe(true)
  })

  it('should not change state on routerNavigatedAction (fail)', () => {
    const action = routerNavigatedAction({
      payload: {
        routerState: {
          root: {
            queryParams: { invalid: 'value' }
          }
        }
      }
    } as any)
    jest.spyOn(require('./aiprovider-search.parameters').AIProviderSearchCriteriasSchema, 'safeParse').mockReturnValue({ success: false })
    const state = AIProviderSearchReducer(initialState, action)
    expect(state).toEqual(initialState)
  })

  it('should reset results and criteria on resetButtonClicked', () => {
    const prevState = { ...initialState, results: [{ id: '1' }], criteria: { name: 'Test' } }
    const action = AIProviderSearchActions.resetButtonClicked()
    const state = AIProviderSearchReducer(prevState, action)
    expect(state.results).toEqual([])
    expect(state.criteria).toEqual({})
  })

  it('should set loading and criteria on searchButtonClicked', () => {
    const action = AIProviderSearchActions.searchButtonClicked({ searchCriteria: { name: 'Test' } })
    const state = AIProviderSearchReducer(initialState, action)
    expect(state.searchLoadingIndicator).toBe(true)
    expect(state.criteria).toEqual({ name: 'Test' })
  })

  it('should set results on aiproviderSearchResultsReceived', () => {
    const action = AIProviderSearchActions.aiproviderSearchResultsReceived({
      results: [{ id: '1' }],
      totalNumberOfResults: 1
    })
    const state = AIProviderSearchReducer(initialState, action)
    expect(state.results).toEqual([{ id: '1' }])
  })

  it('should clear results on aiproviderSearchResultsLoadingFailed', () => {
    const prevState = { ...initialState, results: [{ id: '1' }] }
    const action = AIProviderSearchActions.aiproviderSearchResultsLoadingFailed({ error: null })
    const state = AIProviderSearchReducer(prevState, action)
    expect(state.results).toEqual([])
  })

  it('should set chartVisible on chartVisibilityRehydrated', () => {
    const action = AIProviderSearchActions.chartVisibilityRehydrated({ visible: true })
    const state = AIProviderSearchReducer(initialState, action)
    expect(state.chartVisible).toBe(true)
  })

  it('should toggle chartVisible on chartVisibilityToggled', () => {
    const prevState = { ...initialState, chartVisible: false }
    const action = AIProviderSearchActions.chartVisibilityToggled()
    const state = AIProviderSearchReducer(prevState, action)
    expect(state.chartVisible).toBe(true)
  })

  it('should set viewMode on viewModeChanged', () => {
    const action = AIProviderSearchActions.viewModeChanged({ viewMode: 'advanced' })
    const state = AIProviderSearchReducer(initialState, action)
    expect(state.viewMode).toBe('advanced')
  })

  it('should set displayedColumns on displayedColumnsChanged', () => {
    const action = AIProviderSearchActions.displayedColumnsChanged({
      displayedColumns: [
        { id: 'col1' },
        { id: 'col2' }
      ] as any
    })
    const state = AIProviderSearchReducer(initialState, action)
    expect(state.displayedColumns).toEqual(['col1', 'col2'])
  })
})
