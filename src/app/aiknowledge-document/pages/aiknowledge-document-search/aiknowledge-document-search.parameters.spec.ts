import { AIKnowledgeDocumentStatusEnum } from "src/app/shared/generated"
import { AIKnowledgeDocumentSearchCriteriasSchema } from "./aiknowledge-document-search.parameters"

describe('AIKnowledgeDocumentSearch parameters', () => {
  it('should transform status string to AIKnowledgeDocumentStatusEnum', () => {
    const input = { status: 'NEW' }
    const result = AIKnowledgeDocumentSearchCriteriasSchema.parse(input)
    expect(result.status).toBe('NEW' as AIKnowledgeDocumentStatusEnum)
  })

  it('should allow undefined status', () => {
    const input = {}
    const result = AIKnowledgeDocumentSearchCriteriasSchema.parse(input)
    expect(result.status).toBeUndefined()
  })
})