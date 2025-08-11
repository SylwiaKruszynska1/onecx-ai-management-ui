import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { TranslateModule } from '@ngx-translate/core'
import { addInitializeModuleGuard } from '@onecx/angular-integration-interface'
import { startsWith } from '@onecx/angular-webcomponents'
export const routes: Routes = [
  {
    matcher: startsWith('ai-context'),
    loadChildren: () => import('./ai-context/ai-context.module').then((mod) => mod.AiContextModule)
  },
  {
    matcher: startsWith('aiprovider'),
    loadChildren: () => import('./aiprovider/aiprovider.module').then((mod) => mod.AIProviderModule)
  },
  {
    matcher: startsWith('aiknowledge-document'),
    loadChildren: () =>
      import('./aiknowledge-document/aiknowledge-document.module').then((mod) => mod.AIKnowledgeDocumentModule)
  },
  {
    matcher: startsWith('ai-knowledge-vector-db'),
    loadChildren: () =>
      import('./ai-knowledge-vector-db/ai-knowledge-vector-db.module').then((mod) => mod.AIKnowledgeVectorDbModule)
  },
  {
    matcher: startsWith('ai-knowledge-base'),
    loadChildren: () => import('./ai-knowledge-base/ai-knowledge-base.module').then((mod) => mod.AiKnowledgeBaseModule)
  }
]

@NgModule({
  imports: [RouterModule.forRoot(addInitializeModuleGuard(routes)), TranslateModule],
  exports: [RouterModule]
})
export class AppRoutingModule {}
