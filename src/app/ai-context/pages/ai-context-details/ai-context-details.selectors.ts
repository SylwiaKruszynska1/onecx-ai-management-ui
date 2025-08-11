import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'
import { AIContext, AIKnowledgeBase, AIKnowledgeVectorDb, AIProvider } from '../../../shared/generated'
import { aiContextFeature } from '../../ai-context.reducers'
import { initialState } from './ai-context-details.reducers'
import { AiContextDetailsViewModel } from './ai-context-details.viewmodel'

export const aiContextDetailsSelectors = createChildSelectors(aiContextFeature.selectDetails, initialState)

export const selectAiContextDetailsViewModel = createSelector(
  aiContextDetailsSelectors.selectDetails,
  aiContextDetailsSelectors.selectDetailsLoadingIndicator,
  aiContextDetailsSelectors.selectDetailsLoaded,
  aiContextDetailsSelectors.selectAiProviders,
  aiContextDetailsSelectors.selectAiProvidersLoadingIndicator,
  aiContextDetailsSelectors.selectAiProvidersLoaded,
  aiContextDetailsSelectors.selectAiKnowledgeBases,
  aiContextDetailsSelectors.selectAiKnowledgeBasesLoadingIndicator,
  aiContextDetailsSelectors.selectAiKnowledgeBasesLoaded,
  aiContextDetailsSelectors.selectAiKnowledgeVectorDbs,
  aiContextDetailsSelectors.selectAiKnowledgeVectorDbsLoadingIndicator,
  aiContextDetailsSelectors.selectAiKnowledgeVectorDbsLoaded,
  selectBackNavigationPossible,
  aiContextDetailsSelectors.selectEditMode,
  aiContextDetailsSelectors.selectIsSubmitting,
  (
    details: AIContext | undefined,
    detailsLoadingIndicator: boolean,
    detailsLoaded: boolean,
    aiProviders: AIProvider[] | undefined,
    aiProvidersLoadingIndicator: boolean,
    aiProvidersLoaded: boolean,
    aiKnowledgeBases: AIKnowledgeBase[] | undefined,
    aiKnowledgeBasesLoadingIndicator: boolean,
    aiKnowledgeBasesLoaded: boolean,
    aiKnowledgeVectorDbs: AIKnowledgeVectorDb[] | undefined,
    aiKnowledgeVectorDbsLoadingIndicator: boolean,
    aiKnowledgeVectorDbsLoaded: boolean,
    backNavigationPossible: boolean,
    editMode: boolean,
    isSubmitting: boolean
  ): AiContextDetailsViewModel => ({
    details,
    detailsLoadingIndicator,
    detailsLoaded,
    aiProviders,
    aiProvidersLoadingIndicator,
    aiProvidersLoaded,
    aiKnowledgeBases,
    aiKnowledgeBasesLoaded,
    aiKnowledgeBasesLoadingIndicator,
    aiKnowledgeVectorDbs,
    aiKnowledgeVectorDbsLoadingIndicator,
    aiKnowledgeVectorDbsLoaded,
    backNavigationPossible,
    editMode,
    isSubmitting
  })
)
