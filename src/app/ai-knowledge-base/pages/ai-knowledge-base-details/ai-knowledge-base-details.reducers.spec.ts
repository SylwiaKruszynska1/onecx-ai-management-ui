import { AiKnowledgeBaseDetailsActions } from "./ai-knowledge-base-details.actions"
import { aiKnowledgeBaseDetailsReducer, initialState } from "./ai-knowledge-base-details.reducers"

describe('aiKnowledgeBaseDetailsReducer', () => {
  it('should handle aiKnowledgeBaseDetailsReceived', () => {
    const details = { id: '1', name: 'Test', description: 'Desc', aiContext: [], modificationCount: 1 }
    const state = aiKnowledgeBaseDetailsReducer(
      initialState,
      AiKnowledgeBaseDetailsActions.aiKnowledgeBaseDetailsReceived({ details })
    )
    expect(state.details).toEqual(details)
    expect(state.detailsLoadingIndicator).toBe(false)
    expect(state.detailsLoaded).toBe(true)
  })

  it('should handle aiKnowledgeBaseDetailsLoadingFailed', () => {
    const state = aiKnowledgeBaseDetailsReducer(
      initialState,
      AiKnowledgeBaseDetailsActions.aiKnowledgeBaseDetailsLoadingFailed({ error: null })
    )
    expect(state.details).toEqual(initialState.details)
    expect(state.detailsLoadingIndicator).toBe(false)
    expect(state.detailsLoaded).toBe(false)
  })

  it('should handle aiKnowledgeBaseContextsReceived', () => {
    const contexts = [{ id: 'ctx1', name: 'Context 1' }]
    const state = aiKnowledgeBaseDetailsReducer(
      initialState,
      AiKnowledgeBaseDetailsActions.aiKnowledgeBaseContextsReceived({ contexts })
    )
    expect(state.contexts).toEqual(contexts)
    expect(state.contextsLoadingIndicator).toBe(false)
    expect(state.contextsLoaded).toBe(true)
  })

  it('should handle aiKnowledgeBaseContextsLoadingFailed', () => {
    const state = aiKnowledgeBaseDetailsReducer(
      initialState,
      AiKnowledgeBaseDetailsActions.aiKnowledgeBaseContextsLoadingFailed({ error: null })
    )
    expect(state.contexts).toEqual(initialState.contexts)
    expect(state.contextsLoadingIndicator).toBe(false)
    expect(state.contextsLoaded).toBe(false)
  })

  it('should handle navigatedToDetailsPage', () => {
    const state = aiKnowledgeBaseDetailsReducer(
      { ...initialState, editMode: true },
      AiKnowledgeBaseDetailsActions.navigatedToDetailsPage({ id: undefined })
    )
    expect(state).toEqual(initialState)
  })

  it('should handle editButtonClicked', () => {
    const state = aiKnowledgeBaseDetailsReducer(
      initialState,
      AiKnowledgeBaseDetailsActions.editButtonClicked()
    )
    expect(state.editMode).toBe(true)
  })

  it('should handle saveButtonClicked', () => {
    const details = { id: '2', name: 'Save', description: 'Desc', aiContext: [], modificationCount: 2 }
    const state = aiKnowledgeBaseDetailsReducer(
      initialState,
      AiKnowledgeBaseDetailsActions.saveButtonClicked({ details })
    )
    expect(state.details).toEqual(details)
    expect(state.editMode).toBe(false)
    expect(state.isSubmitting).toBe(true)
  })

  it('should handle navigateBackButtonClicked', () => {
    const state = aiKnowledgeBaseDetailsReducer(
      initialState,
      AiKnowledgeBaseDetailsActions.navigateBackButtonClicked()
    )
    expect(state).toEqual(initialState)
  })

  it('should handle cancelEditConfirmClicked and related actions', () => {
    const actions = [
      AiKnowledgeBaseDetailsActions.cancelEditConfirmClicked(),
      AiKnowledgeBaseDetailsActions.cancelEditNotDirty(),
      AiKnowledgeBaseDetailsActions.updateAiKnowledgeBaseCancelled(),
      AiKnowledgeBaseDetailsActions.updateAiKnowledgeBaseSucceeded()
    ]
    actions.forEach(action => {
      const state = aiKnowledgeBaseDetailsReducer(
        { ...initialState, editMode: true, isSubmitting: true },
        action
      )
      expect(state.editMode).toBe(false)
      expect(state.isSubmitting).toBe(false)
    })
  })

  it('should handle updateAiKnowledgeBaseFailed', () => {
    const state = aiKnowledgeBaseDetailsReducer(
      { ...initialState, isSubmitting: true },
      AiKnowledgeBaseDetailsActions.updateAiKnowledgeBaseFailed({ error: null })
    )
    expect(state.isSubmitting).toBe(false)
  })
})