describe('AiContextSearchReducer', () => {
    const { aiContextSearchReducer, initialState } = require('./ai-context-search.reducers')
    const { AiContextSearchActions } = require('./ai-context-search.actions')

    it('should reset results and criteria on resetButtonClicked', () => {
      const preState = { ...initialState, results: [{ id: '1' }], criteria: { test: 'val' } }
      const action = AiContextSearchActions.resetButtonClicked()
      const state = aiContextSearchReducer(preState, action)
      expect(state.results).toEqual([])
      expect(state.criteria).toEqual({})
    })

    it('should set searchLoadingIndicator and criteria on searchButtonClicked', () => {
      const searchCriteria = { name: 'foo' }
      const action = AiContextSearchActions.searchButtonClicked({ searchCriteria })
      const state = aiContextSearchReducer(initialState, action)
      expect(state.searchLoadingIndicator).toBe(true)
      expect(state.criteria).toEqual(searchCriteria)
    })

    it('should set results on aiContextSearchResultsReceived', () => {
      const stream = [{ id: '1' }, { id: '2' }]
      const action = AiContextSearchActions.aiContextSearchResultsReceived({ stream })
      const state = aiContextSearchReducer(initialState, action)
      expect(state.results).toEqual(stream)
    })

    it('should clear results on aiContextSearchResultsLoadingFailed', () => {
      const preState = { ...initialState, results: [{ id: '1' }] }
      const action = AiContextSearchActions.aiContextSearchResultsLoadingFailed()
      const state = aiContextSearchReducer(preState, action)
      expect(state.results).toEqual([])
    })

    it('should toggle chartVisible on chartVisibilityToggled', () => {
      const initialStateWithChartHidden = { ...initialState, chartVisible: false }
      const action = AiContextSearchActions.chartVisibilityToggled()
      let state = aiContextSearchReducer(initialStateWithChartHidden, action)
      expect(state.chartVisible).toBe(true)

      const stateWithChartVisible = { ...initialState, chartVisible: true }
      state = aiContextSearchReducer(stateWithChartVisible, action)
      expect(state.chartVisible).toBe(false)
    })

    it('should update resultComponentState when resultComponentStateChanged', () => {
      const newComponentState = {
        groupKey: 'someValue'
      }

      const action = AiContextSearchActions.resultComponentStateChanged(newComponentState)
      const state = aiContextSearchReducer(initialState, action)

      expect(state.resultComponentState).toBeDefined()
      expect(state.resultComponentState.groupKey).toBe('someValue')
      expect(state).not.toBe(initialState)
    })

    it('should update searchHeaderComponentState when searchHeaderComponentStateChanged', () => {
      const newHeaderState = {
        activeViewMode: 'basic',
        selectedSearchConfig: 'config1'
      }

      const action = AiContextSearchActions.searchHeaderComponentStateChanged(newHeaderState)
      const state = aiContextSearchReducer(initialState, action)

      expect(state.searchHeaderComponentState).toBeDefined()
      expect(state.searchHeaderComponentState.activeViewMode).toBe('basic')
      expect(state.searchHeaderComponentState.selectedSearchConfig).toBe('config1')
      expect(state).not.toBe(initialState)
    })

    it('should update diagramComponentState when diagramComponentStateChanged', () => {
      const newDiagramState = {
        activeDiagramType: 'PIE'
      }

      const action = AiContextSearchActions.diagramComponentStateChanged(newDiagramState)
      const state = aiContextSearchReducer(initialState, action)

      expect(state.diagramComponentState).toBeDefined()
      expect(state.diagramComponentState.activeDiagramType).toBe('PIE')
      expect(state).not.toBe(initialState)
    })

    it('should set viewMode on viewModeChanged', () => {
      const action = AiContextSearchActions.viewModeChanged({ viewMode: 'advanced' })
      const state = aiContextSearchReducer(initialState, action)
      expect(state.viewMode).toBe('advanced')
    })

    it('should set displayedColumns on displayedColumnsChanged', () => {
      const displayedColumns = [{ id: 'col1' }, { id: 'col2' }]
      const action = AiContextSearchActions.displayedColumnsChanged({ displayedColumns })
      const state = aiContextSearchReducer(initialState, action)
      expect(state.displayedColumns).toEqual(['col1', 'col2'])
    })

    it('should set criteria and searchLoadingIndicator=true when routerNavigatedAction succeeds and queryParams present', () => {
      const { routerNavigatedAction } = require('@ngrx/router-store')
      const mockSchema = require('./ai-context-search.parameters')
      jest.spyOn(mockSchema.aiContextSearchCriteriasSchema, 'safeParse').mockReturnValue({
        success: true,
        data: { foo: 'bar' }
      })
      const preState = { ...initialState, criteria: {}, searchLoadingIndicator: false }
      const action = routerNavigatedAction({ payload: { routerState: { root: { queryParams: { foo: 'bar' } } } } })
      const state = aiContextSearchReducer(preState, action)
      expect(state.criteria).toEqual({ foo: 'bar' })
      expect(state.searchLoadingIndicator).toBe(true)
    })

    it('should not change state when routerNavigatedAction fails schema parse', () => {
      const { routerNavigatedAction } = require('@ngrx/router-store')
      const mockSchema = require('./ai-context-search.parameters')
      jest.spyOn(mockSchema.aiContextSearchCriteriasSchema, 'safeParse').mockReturnValue({
        success: false
      })
      const preState = { ...initialState, criteria: { foo: 'bar' }, searchLoadingIndicator: true }
      const action = routerNavigatedAction({ payload: { routerState: { root: { queryParams: { foo: 'bar' } } } } })
      const state = aiContextSearchReducer(preState, action)
      expect(state).toBe(preState)
    })
  })