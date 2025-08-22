import { AIKnowledgeDocument } from "src/app/shared/generated"
import { selectAIKnowledgeDocumentDetailsViewModel } from "./aiknowledge-document-details.selectors"

describe('selectAIKnowledgeDocumentDetailsViewModel', () => {
  it('should return view model with details', () => {
    const details: AIKnowledgeDocument = { id: 'doc1', name: 'Document 1' } as AIKnowledgeDocument
    const result = selectAIKnowledgeDocumentDetailsViewModel.projector(details)
    expect(result).toEqual({ details })
  })

  it('should return view model with undefined details', () => {
    const result = selectAIKnowledgeDocumentDetailsViewModel.projector(undefined)
    expect(result).toEqual({ details: undefined })
  })
})