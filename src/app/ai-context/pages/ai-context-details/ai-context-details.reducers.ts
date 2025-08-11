import { createReducer, on } from '@ngrx/store'
import { AiContextDetailsActions } from './ai-context-details.actions'
import { AiContextDetailsState } from './ai-context-details.state'

export const initialState: AiContextDetailsState = {
  details: undefined,
  detailsLoadingIndicator: true,
  detailsLoaded: false,
  aiProviders: [],
  aiProvidersLoadingIndicator: true,
  aiProvidersLoaded: false,
  aiKnowledgeBases: [],
  aiKnowledgeBasesLoadingIndicator: true,
  aiKnowledgeBasesLoaded: false,
  aiKnowledgeVectorDbs: [],
  aiKnowledgeVectorDbsLoadingIndicator: true,
  aiKnowledgeVectorDbsLoaded: false,
  backNavigationPossible: true,
  editMode: false,
  isSubmitting: false
}

export const aiContextDetailsReducer = createReducer(
  initialState,
  on(
    AiContextDetailsActions.aiContextDetailsReceived,
    (state: AiContextDetailsState, { details }): AiContextDetailsState => ({
      ...state,
      details,
      detailsLoadingIndicator: false,
      detailsLoaded: true
    })
  ),
  on(
    AiContextDetailsActions.aiContextDetailsLoadingFailed,
    (state: AiContextDetailsState): AiContextDetailsState => ({
      ...state,
      details: undefined,
      detailsLoadingIndicator: false,
      detailsLoaded: false
    })
  ),
  on(
    AiContextDetailsActions.aiContextProvidersReceived,
    (state: AiContextDetailsState, { providers }): AiContextDetailsState => ({
      ...state,
      aiProviders: providers,
      aiProvidersLoadingIndicator: false,
      aiProvidersLoaded: true
    })
  ),
  on(
    AiContextDetailsActions.aiContextProvidersLoadingFailed,
    (state: AiContextDetailsState): AiContextDetailsState => ({
      ...state,
      aiProviders: [],
      aiProvidersLoadingIndicator: false,
      aiProvidersLoaded: false
    })
  ),
  on(
    AiContextDetailsActions.aiContextAiKnowledgeBasesReceived,
    (state: AiContextDetailsState, { aiKnowledgeBases }): AiContextDetailsState => ({
      ...state,
      aiKnowledgeBases,
      aiKnowledgeBasesLoadingIndicator: false,
      aiKnowledgeBasesLoaded: true
    })
  ),
  on(
    AiContextDetailsActions.aiContextAiKnowledgeBasesLoadingFailed,
    (state: AiContextDetailsState): AiContextDetailsState => ({
      ...state,
      aiKnowledgeBases: [],
      aiKnowledgeBasesLoadingIndicator: false,
      aiKnowledgeBasesLoaded: false
    })
  ),
  on(
    AiContextDetailsActions.aiContextAiKnowledgeVectorDbsReceived,
    (state: AiContextDetailsState, { aiKnowledgeVectorDbs }): AiContextDetailsState => ({
      ...state,
      aiKnowledgeVectorDbs,
      aiKnowledgeVectorDbsLoadingIndicator: false,
      aiKnowledgeVectorDbsLoaded: true
    })
  ),
  on(
    AiContextDetailsActions.aiContextAiKnowledgeVectorDbsLoadingFailed,
    (state: AiContextDetailsState): AiContextDetailsState => ({
      ...state,
      aiKnowledgeVectorDbs: [],
      aiKnowledgeVectorDbsLoadingIndicator: false,
      aiKnowledgeVectorDbsLoaded: false
    })
  ),
  on(
    AiContextDetailsActions.navigatedToDetailsPage,
    (): AiContextDetailsState => ({
      ...initialState
    })
  ),
  on(
    AiContextDetailsActions.editButtonClicked,
    (state: AiContextDetailsState): AiContextDetailsState => ({
      ...state,
      editMode: true
    })
  ),
  on(
    AiContextDetailsActions.saveButtonClicked,
    (state: AiContextDetailsState, { details }): AiContextDetailsState => ({
      ...state,
      details,
      editMode: false,
      isSubmitting: true
    })
  ),
  on(
    AiContextDetailsActions.navigateBackButtonClicked,
    (state: AiContextDetailsState): AiContextDetailsState => ({
      ...state
    })
  ),
  on(
    AiContextDetailsActions.cancelEditConfirmClicked,
    AiContextDetailsActions.cancelEditNotDirty,
    AiContextDetailsActions.updateAiContextCancelled,
    AiContextDetailsActions.updateAiContextSucceeded,
    (state: AiContextDetailsState): AiContextDetailsState => ({
      ...state,
      editMode: false,
      isSubmitting: false
    })
  ),
  on(
    AiContextDetailsActions.updateAiContextFailed,
    (state: AiContextDetailsState): AiContextDetailsState => ({
      ...state,
      isSubmitting: false
    })
  )
)
