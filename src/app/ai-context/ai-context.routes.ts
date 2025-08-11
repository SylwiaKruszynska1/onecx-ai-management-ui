import { Routes } from '@angular/router'
import { AiContextDetailsComponent } from './pages/ai-context-details/ai-context-details.component'
import { AiContextSearchComponent } from './pages/ai-context-search/ai-context-search.component'

export const routes: Routes = [
  { path: 'details/:id', component: AiContextDetailsComponent, pathMatch: 'full' },
  { path: '', component: AiContextSearchComponent, pathMatch: 'full' }
]
