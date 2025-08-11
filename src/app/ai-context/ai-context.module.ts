import { CommonModule } from '@angular/common'
import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { EffectsModule } from '@ngrx/effects'
import { StoreModule } from '@ngrx/store'
import { TranslateModule } from '@ngx-translate/core'
import {
  addInitializeModuleGuard,
  PortalCoreModule,
  providePortalDialogService
} from '@onecx/portal-integration-angular'
import { CalendarModule } from 'primeng/calendar'
import { TableModule } from 'primeng/table'
import { MultiSelectModule } from 'primeng/multiselect'
import { AutoCompleteModule } from 'primeng/autocomplete'
import { DropdownModule } from 'primeng/dropdown'
import { SharedModule } from '../shared/shared.module'
import { aiContextFeature } from './ai-context.reducers'
import { routes } from './ai-context.routes'
import { AiContextSearchComponent } from './pages/ai-context-search/ai-context-search.component'
import { AiContextSearchEffects } from './pages/ai-context-search/ai-context-search.effects'
import { AiContextCreateUpdateComponent } from './pages/ai-context-search/dialogs/ai-context-create-update/ai-context-create-update.component'
import { AiContextDetailsComponent } from './pages/ai-context-details/ai-context-details.component'
import { AiContextDetailsEffects } from './pages/ai-context-details/ai-context-details.effects'

@NgModule({
  providers: [providePortalDialogService()],
  declarations: [AiContextDetailsComponent, AiContextCreateUpdateComponent, AiContextSearchComponent],
  imports: [
    CommonModule,
    SharedModule,
    LetDirective,
    PortalCoreModule.forMicroFrontend(),
    RouterModule.forChild(addInitializeModuleGuard(routes)),
    FormsModule,
    ReactiveFormsModule,
    CalendarModule,
    TableModule,
    MultiSelectModule,
    DropdownModule,
    AutoCompleteModule,
    StoreModule.forFeature(aiContextFeature),
    EffectsModule.forFeature([AiContextDetailsEffects, AiContextSearchEffects]),
    TranslateModule
  ]
})
export class AiContextModule {}
