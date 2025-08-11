import { AiContextDetailsState } from './pages/ai-context-details/ai-context-details.state'
import { AiContextSearchState } from './pages/ai-context-search/ai-context-search.state'
export interface AiContextState {
  details: AiContextDetailsState
  search: AiContextSearchState
}
