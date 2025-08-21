import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { BreadcrumbService, PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { PrimeIcons } from 'primeng/api'
import { combineLatest, of } from 'rxjs'
import { AiKnowledgeBaseDetailsComponent } from './ai-knowledge-base-details.component'
import { AiKnowledgeBaseDetailsHarness } from './ai-knowledge-base-details.harness'
import { aiKnowledgeBaseDetailsReducer, initialState } from './ai-knowledge-base-details.reducers'
import { selectAiKnowledgeBaseDetailsViewModel } from './ai-knowledge-base-details.selectors'
import { AiKnowledgeBaseDetailsViewModel } from './ai-knowledge-base-details.viewmodel'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ofType } from '@ngrx/effects'
import { AiKnowledgeBaseDetailsActions } from './ai-knowledge-base-details.actions'
import { AIContext, AIKnowledgeBase } from 'src/app/shared/generated'
import { firstValueFrom } from 'rxjs'

describe('AiKnowledgeBaseDetailsComponent', () => {
  const origAddEventListener = window.addEventListener
  const origPostMessage = window.postMessage

  let listeners: any[] = []
  window.addEventListener = (_type: any, listener: any) => {
    listeners.push(listener)
  }

  window.removeEventListener = (_type: any, listener: any) => {
    listeners = listeners.filter((l) => l !== listener)
  }

  window.postMessage = (m: any) => {
    listeners.forEach((l) =>
      l({
        data: m,
        stopImmediatePropagation: () => {},
        stopPropagation: () => {}
      })
    )
  }

  afterAll(() => {
    window.addEventListener = origAddEventListener
    window.postMessage = origPostMessage
  })

  let component: AiKnowledgeBaseDetailsComponent
  let fixture: ComponentFixture<AiKnowledgeBaseDetailsComponent>
  let store: MockStore<Store>
  let breadcrumbService: BreadcrumbService
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
        BreadcrumbService,
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
    breadcrumbService = TestBed.inject(BreadcrumbService)
    fixture.detectChanges()
    aiKnowledgeBaseDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, AiKnowledgeBaseDetailsHarness)
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display correct breadcrumbs', async () => {
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const pageHeader = await aiKnowledgeBaseDetails.getHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Details')
    expect(await searchBreadcrumbItem!.getText()).toEqual('Details')
  })

  it('should display translated headers', async () => {
    const pageHeader = await aiKnowledgeBaseDetails.getHeader()
    expect(await pageHeader.getHeaderText()).toEqual('AiKnowledgeBase Details')
    expect(await pageHeader.getSubheaderText()).toEqual('Display of AiKnowledgeBase Details')
  })

  it('should have 2 inline actions', async () => {
    const pageHeader = await aiKnowledgeBaseDetails.getHeader()
    const inlineActions = await pageHeader.getInlineActionButtons()
    expect(inlineActions.length).toBe(2)

    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    expect(backAction).toBeTruthy()

    const moreAction = await pageHeader.getInlineActionButtonByIcon(PrimeIcons.ELLIPSIS_V)
    expect(moreAction).toBeNull()
  })

  describe('Actions', () => {
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
  describe('Observable logic', () => {
    it('should merge aiContexts and missing contexts in displayContexts$ (pokrycie kodu w komponencie)', (done) => {
      const details: AIKnowledgeBase = {
        id: 'kb1',
        name: 'Test KB',
        description: 'desc',
        aiContext: [{ id: '1' }, { id: '2' }],
        modificationCount: 1
      }
      const contexts: AIContext[] = [{ id: '1' }]
      store.overrideSelector(selectAiKnowledgeBaseDetailsViewModel, {
        details,
        contexts,
        detailsLoaded: true,
        detailsLoadingIndicator: false,
        contextsLoaded: true,
        contextsLoadingIndicator: false,
        backNavigationPossible: true,
        editMode: false,
        isSubmitting: false
      })
      store.refreshState()
      fixture.detectChanges()

      component.displayContexts$.subscribe((result: AIContext[]) => {
        expect(result).toEqual([{ id: '1' }, { id: '2' }, { id: '2' }])
        done()
      })
    })
    
    it('should display item details in page header', async () => {
      component.headerLabels$ = of([
        {
          label: 'first',
          value: 'first value'
        },
        {
          label: 'second',
          value: 'second value'
        },
        {
          label: 'third',
          icon: PrimeIcons.PLUS
        },
        {
          label: 'fourth',
          value: 'fourth value',
          icon: PrimeIcons.QUESTION
        }
      ])

      const pageHeader = await aiKnowledgeBaseDetails.getHeader()
      const objectDetails = await pageHeader.getObjectInfos()
      expect(objectDetails.length).toBe(4)

      const firstDetailItem = await pageHeader.getObjectInfoByLabel('first')
      expect(await firstDetailItem?.getLabel()).toEqual('first')
      expect(await firstDetailItem?.getValue()).toEqual('first value')
      expect(await firstDetailItem?.getIcon()).toBeUndefined()

      const secondDetailItem = await pageHeader.getObjectInfoByLabel('second')
      expect(await secondDetailItem?.getLabel()).toEqual('second')
      expect(await secondDetailItem?.getValue()).toEqual('second value')
      expect(await secondDetailItem?.getIcon()).toBeUndefined()

      const thirdDetailItem = await pageHeader.getObjectInfoByLabel('third')
      expect(await thirdDetailItem?.getLabel()).toEqual('third')
      expect(await thirdDetailItem?.getValue()).toEqual('')
      expect(await thirdDetailItem?.getIcon()).toEqual(PrimeIcons.PLUS)

      const fourthDetailItem = await pageHeader.getObjectInfoByLabel('fourth')
      expect(await fourthDetailItem?.getLabel()).toEqual('fourth')
      expect(await fourthDetailItem?.getValue()).toEqual('fourth value')
      expect(await fourthDetailItem?.getIcon()).toEqual(PrimeIcons.QUESTION)
      })
      it('should patch formGroup with details and matchedContexts in combineLatest subscription', (done) => {
        const details = { id: '123', name: 'TestName', description: 'TestDesc', aiContext: [{ id: '1' }, { id: '2' }] }
        const contexts: AIContext[] = [{ id: '1' }, { id: '2' }, { id: '3' }]
        const viewModel$ = of({ details, contexts, editMode: false })
        const displayContexts$ = of([{ id: '1' }, { id: '2' }, { id: '3' }])
    
        const formGroup = new FormGroup({
          id: new FormControl<string | null>(''),
          name: new FormControl<string | null>(''),
          description: new FormControl<string | null>(''),
          aiContext: new FormControl<AIContext[] | null>([])
        })
    
        combineLatest([viewModel$, displayContexts$]).subscribe(([vm, displayContexts]) => {
          if (!vm.editMode) {
            const chosenContexts = vm.details?.aiContext ?? []
            const matchedContexts = displayContexts.filter((context: AIContext) =>
              chosenContexts.some((chosen: AIContext) => context.id === chosen.id)
            )
    
            formGroup.patchValue({
              id: vm.details?.id,
              name: vm.details?.name,
              description: vm.details?.description,
              aiContext: matchedContexts
            })
            formGroup.markAsPristine()
    
            expect(formGroup.value.aiContext).toEqual([{ id: '1' }, { id: '2' }])
            done()
          }
        })
      })
      it('should use details.aiContext when it is an array in displayContexts$', (done) => {
      const details: AIKnowledgeBase = {
        id: 'kb1',
        name: 'Test KB',
        description: 'desc',
        aiContext: [{ id: '1' }, { id: '2' }], 
        modificationCount: 1
      }
      const contexts: AIContext[] = [{ id: '1' }, { id: '2' }]
      store.overrideSelector(selectAiKnowledgeBaseDetailsViewModel, {
        details,
        contexts,
        detailsLoaded: true,
        detailsLoadingIndicator: false,
        contextsLoaded: true,
        contextsLoadingIndicator: false,
        backNavigationPossible: true,
        editMode: false,
        isSubmitting: false
      })
      store.refreshState()
      fixture.detectChanges()

      component.displayContexts$.subscribe((result: AIContext[]) => {
        expect(result).toEqual([{ id: '1' }, { id: '2' }])
        done()
      })
    })
    
  })

  describe('selectAiKnowledgeBaseDetailsViewModel', () => {
    it('should build AiKnowledgeBaseDetailsViewModel correctly', () => {
      const details: AIKnowledgeBase = {
        id: 'id1',
        name: 'Test KB',
        description: 'desc',
        aiContext: [],
        modificationCount: 1
      }
      const contexts: AIContext[] = [{ id: 'ctx1', name: 'Context 1' }]

      const result = selectAiKnowledgeBaseDetailsViewModel.projector(
        details,
        true,
        false,
        contexts,
        true,
        false,
        true,
        false,
        false
      )

      expect(result).toEqual({
        details,
        detailsLoaded: true,
        detailsLoadingIndicator: false,
        contexts,
        contextsLoaded: true,
        contextsLoadingIndicator: false,
        backNavigationPossible: true,
        editMode: false,
        isSubmitting: false
      } as AiKnowledgeBaseDetailsViewModel)
    })
  })
  
  
  describe('aiKnowledgeBaseDetailsReducer', () => {
    it('should handle aiKnowledgeBaseDetailsReceived', () => {
      const details = { id: '1', name: 'Test', description: 'Desc', aiContext: [], modificationCount: 1 }
      const state = aiKnowledgeBaseDetailsReducer(
        initialState,
        AiKnowledgeBaseDetailsActions.aiKnowledgeBaseDetailsReceived({ details })
      )
      expect(state.details).toEqual(details)
      expect(state.detailsLoadingIndicator).toBe(false)
      expect(state.detailsLoaded).toBe(true)
    })
  
    it('should handle aiKnowledgeBaseDetailsLoadingFailed', () => {
      const state = aiKnowledgeBaseDetailsReducer(
        initialState,
        AiKnowledgeBaseDetailsActions.aiKnowledgeBaseDetailsLoadingFailed({ error: null })
      )
      expect(state.details).toEqual(initialState.details)
      expect(state.detailsLoadingIndicator).toBe(false)
      expect(state.detailsLoaded).toBe(false)
    })
  
    it('should handle aiKnowledgeBaseContextsReceived', () => {
      const contexts = [{ id: 'ctx1', name: 'Context 1' }]
      const state = aiKnowledgeBaseDetailsReducer(
        initialState,
        AiKnowledgeBaseDetailsActions.aiKnowledgeBaseContextsReceived({ contexts })
      )
      expect(state.contexts).toEqual(contexts)
      expect(state.contextsLoadingIndicator).toBe(false)
      expect(state.contextsLoaded).toBe(true)
    })
  
    it('should handle aiKnowledgeBaseContextsLoadingFailed', () => {
      const state = aiKnowledgeBaseDetailsReducer(
        initialState,
        AiKnowledgeBaseDetailsActions.aiKnowledgeBaseContextsLoadingFailed({ error: null })
      )
      expect(state.contexts).toEqual(initialState.contexts)
      expect(state.contextsLoadingIndicator).toBe(false)
      expect(state.contextsLoaded).toBe(false)
    })
  
    it('should handle navigatedToDetailsPage', () => {
      const state = aiKnowledgeBaseDetailsReducer(
        { ...initialState, editMode: true },
        AiKnowledgeBaseDetailsActions.navigatedToDetailsPage({ id: undefined })
      )
      expect(state).toEqual(initialState)
    })
  
    it('should handle editButtonClicked', () => {
      const state = aiKnowledgeBaseDetailsReducer(
        initialState,
        AiKnowledgeBaseDetailsActions.editButtonClicked()
      )
      expect(state.editMode).toBe(true)
    })
  
    it('should handle saveButtonClicked', () => {
      const details = { id: '2', name: 'Save', description: 'Desc', aiContext: [], modificationCount: 2 }
      const state = aiKnowledgeBaseDetailsReducer(
        initialState,
        AiKnowledgeBaseDetailsActions.saveButtonClicked({ details })
      )
      expect(state.details).toEqual(details)
      expect(state.editMode).toBe(false)
      expect(state.isSubmitting).toBe(true)
    })
  
    it('should handle navigateBackButtonClicked', () => {
      const state = aiKnowledgeBaseDetailsReducer(
        initialState,
        AiKnowledgeBaseDetailsActions.navigateBackButtonClicked()
      )
      expect(state).toEqual(initialState)
    })
  
    it('should handle cancelEditConfirmClicked and related actions', () => {
      const actions = [
        AiKnowledgeBaseDetailsActions.cancelEditConfirmClicked(),
        AiKnowledgeBaseDetailsActions.cancelEditNotDirty(),
        AiKnowledgeBaseDetailsActions.updateAiKnowledgeBaseCancelled(),
        AiKnowledgeBaseDetailsActions.updateAiKnowledgeBaseSucceeded()
      ]
      actions.forEach(action => {
        const state = aiKnowledgeBaseDetailsReducer(
          { ...initialState, editMode: true, isSubmitting: true },
          action
        )
        expect(state.editMode).toBe(false)
        expect(state.isSubmitting).toBe(false)
      })
    })
  
    it('should handle updateAiKnowledgeBaseFailed', () => {
      const state = aiKnowledgeBaseDetailsReducer(
        { ...initialState, isSubmitting: true },
        AiKnowledgeBaseDetailsActions.updateAiKnowledgeBaseFailed({ error: null })
      )
      expect(state.isSubmitting).toBe(false)
    })
  })
})
