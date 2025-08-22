import { AIContext, AIKnowledgeBase } from "src/app/shared/generated"
import { selectAiKnowledgeBaseDetailsViewModel } from "./ai-knowledge-base-details.selectors"
import { AiKnowledgeBaseDetailsViewModel } from "./ai-knowledge-base-details.viewmodel"

describe('selectAiKnowledgeBaseDetailsViewModel', () => {
  it('should build AiKnowledgeBaseDetailsViewModel correctly', () => {
    const details: AIKnowledgeBase = {
      id: 'id1',
      name: 'Test KB',
      description: 'desc',
      aiContext: [],
      modificationCount: 1
    }
    const contexts: AIContext[] = [{ id: 'ctx1', name: 'Context 1' }]

    const result = selectAiKnowledgeBaseDetailsViewModel.projector(
      details,
      true,
      false,
      contexts,
      true,
      false,
      true,
      false,
      false
    )

    expect(result).toEqual({
      details,
      detailsLoaded: true,
      detailsLoadingIndicator: false,
      contexts,
      contextsLoaded: true,
      contextsLoadingIndicator: false,
      backNavigationPossible: true,
      editMode: false,
      isSubmitting: false
    } as AiKnowledgeBaseDetailsViewModel)
  })
})
