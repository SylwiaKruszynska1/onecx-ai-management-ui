import { createFeatureSelector } from '@ngrx/store'
import { aiContextFeature } from './ai-context.reducers'
import { AiContextState } from './ai-context.state'

export const selectAiContextFeature = createFeatureSelector<AiContextState>(aiContextFeature.name)
