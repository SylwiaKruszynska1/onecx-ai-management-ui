import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store, ScannedActionsSubject } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { PortalCoreModule, UserService, PortalDialogService } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { AiKnowledgeBaseDetailsComponent } from './ai-knowledge-base-details.component'
import { AiKnowledgeBaseDetailsHarness } from './ai-knowledge-base-details.harness'
import { initialState } from './ai-knowledge-base-details.reducers'
import { selectAiKnowledgeBaseDetailsViewModel } from './ai-knowledge-base-details.selectors'
import { AiKnowledgeBaseDetailsViewModel } from './ai-knowledge-base-details.viewmodel'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ofType, Actions } from '@ngrx/effects'
import { AiKnowledgeBaseDetailsActions } from './ai-knowledge-base-details.actions'
import { AiKnowledgeBaseBffService } from 'src/app/shared/generated/api/aiKnowledgeBaseBffService.service'
import { AiKnowledgeBaseDetailsEffects } from './ai-knowledge-base-details.effects'
import { ReplaySubject, of } from 'rxjs'
import { HttpResponse } from '@angular/common/http'

describe('Actions', () => {
  let fixture: ComponentFixture<AiKnowledgeBaseDetailsComponent>
  let store: MockStore<Store>
  let aiKnowledgeBaseDetails: AiKnowledgeBaseDetailsHarness
  const actions$ = new ReplaySubject<any>(1)

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const portalDialogServiceMock = {
    openDialog: jest.fn(() => of(true))
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
            initialState: { 
              aiKnowledgeBase: { details: initialState },
              onecx: { backNavigationPossible: true }
            }
            }),
            { provide: ActivatedRoute, useValue: mockActivatedRoute },
            AiKnowledgeBaseDetailsEffects,
            { provide: ScannedActionsSubject, useValue: new ReplaySubject<any>(1) },
            { provide: PortalDialogService, useValue: portalDialogServiceMock },
            { provide: Actions, useValue: actions$ }
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

  it('should call deleteAiKnowledgeBase in effect when deleteButtonClicked is dispatched', (done) => {
    const aiKnowledgeBaseService = TestBed.inject(AiKnowledgeBaseBffService)
    const spy = jest.spyOn(aiKnowledgeBaseService, 'deleteAiKnowledgeBase').mockReturnValue(of(new HttpResponse({ status: 200 })))
    const effects = TestBed.inject(AiKnowledgeBaseDetailsEffects)
    const itemToDelete = { id: '123', name: 'test' }

    jest.spyOn(effects['store'], 'select').mockReturnValue(of(itemToDelete))

    effects.deleteButtonClicked$.subscribe(() => {
      expect(spy).toHaveBeenCalledWith('123')
      done()
    })

    actions$.next(AiKnowledgeBaseDetailsActions.deleteButtonClicked())
  })

  it('should throw error when item to delete is null/undefined', (done) => {
    const effects = TestBed.inject(AiKnowledgeBaseDetailsEffects)
    
    // Mock null item - tests the first part of optional chaining
    jest.spyOn(effects['store'], 'select').mockReturnValue(of(null))
    jest.spyOn(effects['portalDialogService'], 'openDialog').mockReturnValue(
      of({ button: 'primary', result: true })
    )

    effects.deleteButtonClicked$.subscribe({
      error: (error) => {
        expect(error.message).toBe('Item to delete not found!')
        done()
      }
    })

    actions$.next(AiKnowledgeBaseDetailsActions.deleteButtonClicked())
  })

  it('should throw error when item exists but has no ID', (done) => {
    const effects = TestBed.inject(AiKnowledgeBaseDetailsEffects)
    
    // Mock item without ID - tests the second part of optional chaining
    jest.spyOn(effects['store'], 'select').mockReturnValue(of({ name: 'test' }))
    jest.spyOn(effects['portalDialogService'], 'openDialog').mockReturnValue(
      of({ button: 'primary', result: true })
    )

    effects.deleteButtonClicked$.subscribe({
      error: (error) => {
        expect(error.message).toBe('Item to delete not found!')
        done()
      }
    })

    actions$.next(AiKnowledgeBaseDetailsActions.deleteButtonClicked())
  })

  it('should throw error when item exists but has falsy ID', (done) => {
    const effects = TestBed.inject(AiKnowledgeBaseDetailsEffects)
    
    // Mock item with falsy ID - tests another case of optional chaining
    jest.spyOn(effects['store'], 'select').mockReturnValue(of({ name: 'test', id: '' }))
    jest.spyOn(effects['portalDialogService'], 'openDialog').mockReturnValue(
      of({ button: 'primary', result: true })
    )

    effects.deleteButtonClicked$.subscribe({
      error: (error) => {
        expect(error.message).toBe('Item to delete not found!')
        done()
      }
    })

    actions$.next(AiKnowledgeBaseDetailsActions.deleteButtonClicked())
  })

  describe('navigateBack$ effect', () => {
    let effects: AiKnowledgeBaseDetailsEffects
    let historySpy: jest.SpyInstance

    beforeEach(() => {
      effects = TestBed.inject(AiKnowledgeBaseDetailsEffects)
      historySpy = jest.spyOn(globalThis.history, 'back').mockImplementation(() => {})
    })

    afterEach(() => {
      historySpy.mockRestore()
    })

    it('should call globalThis.history.back() when back navigation is possible', (done) => {
      jest.spyOn(effects['store'], 'select').mockReturnValue(of(true))

      effects.navigateBack$.subscribe((action) => {
        expect(historySpy).toHaveBeenCalled()
        expect(action.type).toBe(AiKnowledgeBaseDetailsActions.backNavigationStarted.type)
        done()
      })

      actions$.next(AiKnowledgeBaseDetailsActions.navigateBackButtonClicked())
    })

    it('should not call globalThis.history.back() when back navigation is not possible', (done) => {
      jest.spyOn(effects['store'], 'select').mockReturnValue(of(false))

      effects.navigateBack$.subscribe((action) => {
        expect(historySpy).not.toHaveBeenCalled()
        expect(action.type).toBe(AiKnowledgeBaseDetailsActions.backNavigationFailed.type)
        done()
      })

      actions$.next(AiKnowledgeBaseDetailsActions.navigateBackButtonClicked())
    })
  })
})