import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { AiKnowledgeBaseDetailsComponent } from './ai-knowledge-base-details.component'
import { AiKnowledgeBaseDetailsHarness } from './ai-knowledge-base-details.harness'
import { initialState } from './ai-knowledge-base-details.reducers'
import { selectAiKnowledgeBaseDetailsViewModel } from './ai-knowledge-base-details.selectors'
import { AiKnowledgeBaseDetailsViewModel } from './ai-knowledge-base-details.viewmodel'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ofType } from '@ngrx/effects'
import { AiKnowledgeBaseDetailsActions } from './ai-knowledge-base-details.actions'
import { firstValueFrom } from 'rxjs'

describe('Actions', () => {
  let component: AiKnowledgeBaseDetailsComponent
  let fixture: ComponentFixture<AiKnowledgeBaseDetailsComponent>
  let store: MockStore<Store>
  let aiKnowledgeBaseDetails: AiKnowledgeBaseDetailsHarness

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseAiKnowledgeBaseDetailsViewModel: AiKnowledgeBaseDetailsViewModel = {
    details: undefined,
    detailsLoaded: true,
    detailsLoadingIndicator: false,
    contexts: [],
    contextsLoaded: true,
    contextsLoadingIndicator: false,
    backNavigationPossible: true,
    editMode: false,
    isSubmitting: false
    }

    beforeEach(async () => {
        await TestBed.configureTestingModule({
        declarations: [AiKnowledgeBaseDetailsComponent],
        imports: [
            PortalCoreModule,
            LetDirective,
            FormsModule,
            ReactiveFormsModule,
            TranslateTestingModule.withTranslations('en', require('./../../../../assets/i18n/en.json')).withTranslations(
            'de',
            require('./../../../../assets/i18n/de.json')
            ),
            HttpClientTestingModule
        ],
        providers: [
            provideMockStore({
            initialState: { aiKnowledgeBase: { details: initialState } }
            }),
            { provide: ActivatedRoute, useValue: mockActivatedRoute }
        ]
        }).compileComponents()

        const userService = TestBed.inject(UserService)
        userService.hasPermission = () => true
        const translateService = TestBed.inject(TranslateService)
        translateService.use('en')

        store = TestBed.inject(MockStore)
        jest.spyOn(store, 'dispatch') 
        store.overrideSelector(selectAiKnowledgeBaseDetailsViewModel, baseAiKnowledgeBaseDetailsViewModel)
        store.refreshState()

        fixture = TestBed.createComponent(AiKnowledgeBaseDetailsComponent)
        component = fixture.componentInstance
        fixture.detectChanges()
        aiKnowledgeBaseDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, AiKnowledgeBaseDetailsHarness)
    })
    it('should dispatch navigateBackButtonClicked action on back button click', async () => {
      jest.spyOn(window.history, 'back')
      const doneFn = jest.fn()

      const pageHeader = await aiKnowledgeBaseDetails.getHeader()
      const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
      store.scannedActions$.pipe(ofType(AiKnowledgeBaseDetailsActions.navigateBackButtonClicked)).subscribe(() => {
        doneFn()
      })
      await backAction?.click()
      expect(doneFn).toHaveBeenCalledTimes(1)
    })
    it('should dispatch editButtonClicked action on edit button click', async () => {
      const doneFn = jest.fn()
      store.scannedActions$.pipe(ofType(AiKnowledgeBaseDetailsActions.editButtonClicked)).subscribe(() => {
        doneFn()
      })

      const pageHeader = await aiKnowledgeBaseDetails.getHeader()
      const editAction = await pageHeader.getInlineActionButtonByLabel('Edit')
      await editAction?.click()
      expect(doneFn).toHaveBeenCalledTimes(1)
    })

    it('should dispatch cancelButtonClicked action on cancel button click', async () => {
      store.overrideSelector(selectAiKnowledgeBaseDetailsViewModel, {
        ...baseAiKnowledgeBaseDetailsViewModel,
        editMode: true
      })
      store.refreshState()

      const doneFn = jest.fn()
      store.scannedActions$.pipe(ofType(AiKnowledgeBaseDetailsActions.cancelButtonClicked)).subscribe(() => {
        doneFn()
      })

      const pageHeader = await aiKnowledgeBaseDetails.getHeader()
      const cancelAction = await pageHeader.getInlineActionButtonByLabel('Cancel')
      await cancelAction?.click()
      expect(doneFn).toHaveBeenCalledTimes(1)
    })

    it('should dispatch saveButtonClicked action on save button click', async () => {
      store.overrideSelector(selectAiKnowledgeBaseDetailsViewModel, {
        ...baseAiKnowledgeBaseDetailsViewModel,
        editMode: true
      })
      store.refreshState()

      const doneFn = jest.fn()
      store.scannedActions$.pipe(ofType(AiKnowledgeBaseDetailsActions.saveButtonClicked)).subscribe(() => {
        doneFn()
      })

      const pageHeader = await aiKnowledgeBaseDetails.getHeader()
      const saveAction = await pageHeader.getInlineActionButtonByLabel('Save')
      await saveAction?.click()
      expect(doneFn).toHaveBeenCalledTimes(1)
    })

    it('should call delete() and dispatch deleteButtonClicked when DELETE actionCallback is triggered', async () => {
      const actions = await firstValueFrom(component.headerActions$)
      const deleteAction = actions.find(a => a.labelKey === 'AI_KNOWLEDGE_BASE_DETAILS.GENERAL.DELETE')
      expect(deleteAction).toBeTruthy()

      const deleteSpy = jest.spyOn(component, 'delete')
      if (deleteAction) {
        deleteAction.actionCallback()
        expect(deleteSpy).toHaveBeenCalled()
        expect(store.dispatch).toHaveBeenCalledWith(
          AiKnowledgeBaseDetailsActions.deleteButtonClicked()
        )
      }
    })
  })