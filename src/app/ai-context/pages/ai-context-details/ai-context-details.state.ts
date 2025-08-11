import { AIContext, AIKnowledgeBase, AIKnowledgeVectorDb, AIProvider } from '../../../shared/generated'

export interface AiContextDetailsState {
  details: AIContext | undefined
  detailsLoadingIndicator: boolean
  detailsLoaded: boolean

  aiProviders: AIProvider[] | undefined
  aiProvidersLoaded: boolean
  aiProvidersLoadingIndicator: boolean

  aiKnowledgeBases: AIKnowledgeBase[] | undefined
  aiKnowledgeBasesLoaded: boolean
  aiKnowledgeBasesLoadingIndicator: boolean

  aiKnowledgeVectorDbs: AIKnowledgeVectorDb[] | undefined
  aiKnowledgeVectorDbsLoaded: boolean
  aiKnowledgeVectorDbsLoadingIndicator: boolean

  backNavigationPossible: boolean
  editMode: boolean
  isSubmitting: boolean
}
