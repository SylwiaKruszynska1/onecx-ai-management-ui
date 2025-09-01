import { AIKnowledgeDocumentDetailsActions } from "./aiknowledge-document-details.actions"
import { AIKnowledgeDocumentDetailsReducer, initialState } from "./aiknowledge-document-details.reducers"

describe('AIKnowledgeDocumentDetailsReducer', () => {
  it('should set details on aIKnowledgeDocumentDetailsReceived', () => {
    const details = { id: 'doc1', name: 'Document 1' }
    const state = AIKnowledgeDocumentDetailsReducer(
      initialState,
      AIKnowledgeDocumentDetailsActions.aIKnowledgeDocumentDetailsReceived({ details })
    )
    expect(state.details).toEqual(details)
  })

  it('should clear details on aIKnowledgeDocumentDetailsLoadingFailed', () => {
    const stateWithDetails = { ...initialState, details: { id: 'doc1', name: 'Document 1' } }
    const state = AIKnowledgeDocumentDetailsReducer(
      stateWithDetails,
      AIKnowledgeDocumentDetailsActions.aIKnowledgeDocumentDetailsLoadingFailed({ error: null })
    )
    expect(state.details).toBeUndefined()
  })

  it('should reset state on navigatedToDetailsPage', () => {
    const stateWithDetails = { ...initialState, details: { id: 'doc1', name: 'Document 1' } }
    const state = AIKnowledgeDocumentDetailsReducer(
      stateWithDetails,
      AIKnowledgeDocumentDetailsActions.navigatedToDetailsPage({ id: 'doc1' }) 
    )
    expect(state).toEqual(initialState)
  })
})