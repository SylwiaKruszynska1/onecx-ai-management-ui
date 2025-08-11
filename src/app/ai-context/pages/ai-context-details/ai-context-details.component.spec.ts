import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, ActivatedRouteSnapshot, EventType, Router } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import {
  BreadcrumbService,
  PortalCoreModule,
  PortalDialogService,
  PortalMessageService,
  UserService
} from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { AiContextDetailsComponent } from './ai-context-details.component'
import { AiContextDetailsHarness } from './ai-context-details.harness'
import { aiContextDetailsReducer, initialState } from './ai-context-details.reducers'
import { aiContextDetailsSelectors, selectAiContextDetailsViewModel } from './ai-context-details.selectors'
import { AiContextDetailsViewModel } from './ai-context-details.viewmodel'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import {
  AIKnowledgeDocumentStatusEnum,
  AIContextBffService,
  UpdateAIContextResponse,
  GetAIContextByIdResponse,
  AiKnowledgeBaseBffService,
  SearchAIKnowledgeBaseResponse,
  AIProviderBffService,
  AIKnowledgeVectorDbBffService
} from 'src/app/shared/generated'
import { ofType } from '@ngrx/effects'
import { AiContextDetailsActions } from './ai-context-details.actions'
import { ReplaySubject, of, throwError } from 'rxjs'
import { AiContextDetailsEffects } from './ai-context-details.effects'
import { provideMockActions } from '@ngrx/effects/testing'
import { HttpResponse } from '@angular/common/http'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'
import { selectRouteParam } from 'src/app/shared/selectors/router.selectors'
import { routerNavigatedAction } from '@ngrx/router-store'
import { AutoCompleteModule } from 'primeng/autocomplete'
import { MultiSelectModule } from 'primeng/multiselect'
import { InputTextModule } from 'primeng/inputtext'
import { PrimeIcons } from 'primeng/api'
import { AiContextDetailsState } from './ai-context-details.state'

describe('AiContextDetailsComponent', () => {
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

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }

  afterAll(() => {
    window.addEventListener = origAddEventListener
    window.postMessage = origPostMessage
  })

  let component: AiContextDetailsComponent
  let fixture: ComponentFixture<AiContextDetailsComponent>
  let store: MockStore<Store>
  let breadcrumbService: BreadcrumbService
  let AiContextDetails: AiContextDetailsHarness
  let effects: AiContextDetailsEffects
  let actions$: ReplaySubject<any>
  let aiContextService: jest.Mocked<AIContextBffService>
  let aiProviderService: jest.Mocked<AIProviderBffService>
  let aiKnowledgeBaseService: jest.Mocked<AiKnowledgeBaseBffService>
  let aiKnowledgeVectorDbs: jest.Mocked<AIKnowledgeVectorDbBffService>
  let portalDialogService: jest.Mocked<PortalDialogService>
  let messageService: jest.Mocked<PortalMessageService>
  let router: jest.Mocked<Router>

  const baseAiContextDetailsViewModel: AiContextDetailsViewModel = {
    details: {
      id: 'id-1',
      appId: 'appid-1',
      name: 'details name',
      description: 'details description',
      modificationCount: 1,
      modificationUser: 'user-1',
      creationUser: 'user-1',
      AIKnowledgeBase: {
        modificationCount: 1,
        id: 'id-1',
        name: 'name-1',
        description: 'description-1',
        aiContext: []
      },
      provider: {
        modificationCount: 1,
        id: 'id-1',
        name: 'name-1',
        description: 'description-1',
        llmUrl: 'llmUrl-1',
        appId: 'appId-1',
        modelName: 'modelName-1',
        modelVersion: 'modelVersion-1',
        apiKey: 'apiKey-1'
      },
      aIKnowledgeVectorDb: {
        modificationCount: 1,
        id: 'id-1',
        name: 'aIKnowledgeVectorDb name',
        description: 'aIKnowledgeVectorDb description',
        vdb: 'vdb-1',
        vdbCollection: 'vdbCollection-1',
        aiContext: {}
      },
      aIKnowledgeUrl: [
        {
          modificationCount: 1,
          modificationUser: 'user-1',
          creationUser: 'user-1',
          id: 'id-1',
          url: 'url-1',
          name: 'aIKnowledgeUrl name',
          description: 'aIKnowledgeUrl description'
        }
      ],
      aIKnowledgeDbs: [
        {
          modificationCount: 1,
          modificationUser: 'user-1',
          id: 'id-1',
          name: 'aIKnowledgeDb name',
          description: 'aIKnowledgeDb description',
          db: 'db-1',
          user: 'user-1',
          pwd: 'string',
          tables: ['string']
        }
      ],
      aIKnowledgeDocuments: [
        {
          modificationCount: 1,
          id: 'id-1',
          name: 'aIKnowledgeDocument name',
          documentRefId: 'refId-1',
          status: AIKnowledgeDocumentStatusEnum.New
        }
      ]
    },
    detailsLoaded: true,
    detailsLoadingIndicator: false,
    aiProviders: [
      {
        modificationCount: 1,
        id: 'id-1',
        name: 'aIProvider name',
        description: 'aIProvider description',
        llmUrl: 'aIProvider llmUrl',
        appId: 'aIProvider appId',
        modelName: 'aIProvider modelName',
        modelVersion: 'aIProvider modelVersion',
        apiKey: 'aIProvider apiKey'
      }
    ],
    aiProvidersLoaded: true,
    aiProvidersLoadingIndicator: false,
    aiKnowledgeBases: [
      {
        modificationCount: 1,
        id: 'id-1',
        name: 'aIKnowledgeBase name',
        description: 'aIKnowledgeBase description',
        aiContext: []
      }
    ],
    aiKnowledgeBasesLoaded: true,
    aiKnowledgeBasesLoadingIndicator: false,
    aiKnowledgeVectorDbs: [
      {
        modificationCount: 1,
        id: 'id-1',
        name: 'aIKnowledgeVectorDb name',
        description: 'aIKnowledgeVectorDb description',
        vdb: 'vdb-1',
        vdbCollection: 'vdbCollection-1',
        aiContext: {}
      }
    ],
    aiKnowledgeVectorDbsLoaded: true,
    aiKnowledgeVectorDbsLoadingIndicator: false,
    backNavigationPossible: true,
    editMode: false,
    isSubmitting: false
  }

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)
    aiContextService = {
      getAIContextById: jest.fn(),
      updateAIContext: jest.fn(),
      deleteAIContext: jest.fn(),
      searchAIContexts: jest.fn()
    } as unknown as jest.Mocked<AIContextBffService>

    aiProviderService = {
      searchAIProvider: jest.fn()
    } as unknown as jest.Mocked<AIProviderBffService>

    aiKnowledgeBaseService = {
      searchAIKnowledgeBases: jest.fn()
    } as unknown as jest.Mocked<AiKnowledgeBaseBffService>

    aiKnowledgeVectorDbs = {
      searchAIKnowledgeVectorDbs: jest.fn()
    } as unknown as jest.Mocked<AIKnowledgeVectorDbBffService>

    portalDialogService = {
      openDialog: jest.fn()
    } as unknown as jest.Mocked<PortalDialogService>

    const mockId = '123'
    router = {
      events: of(),
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
      parseUrl: jest.fn().mockImplementation((url: string) => ({
        queryParams: {},
        fragment: null,
        toString: () => url,
        url
      })),
      createUrlTree: jest.fn().mockImplementation((commands: any[]) => ({
        toString: () => commands.join('/')
      })),
      isActive: jest.fn(),
      serializeUrl: jest.fn().mockImplementation((urlTree: any) => urlTree.toString()),
      routerState: {
        root: {
          component: AiContextDetailsComponent,
          firstChild: {
            component: AiContextDetailsComponent,
            paramMap: new Map([['id', mockId]]),
            url: '',
            urlSegments: [],
            outlet: 'primary',
            params: {},
            queryParams: {},
            fragment: null,
            data: {},
            children: []
          }
        },
        snapshot: {
          url: '',
          root: {
            component: AiContextDetailsComponent,
            firstChild: {
              component: AiContextDetailsComponent,
              paramMap: new Map([['id', mockId]]),
              url: '',
              urlSegments: [],
              outlet: 'primary',
              params: {},
              queryParams: {},
              fragment: null,
              data: {},
              children: []
            }
          }
        }
      }
    } as unknown as jest.Mocked<Router>

    messageService = {
      success: jest.fn(),
      error: jest.fn()
    } as unknown as jest.Mocked<PortalMessageService>

    await TestBed.configureTestingModule({
      declarations: [AiContextDetailsComponent],
      imports: [
        PortalCoreModule,
        LetDirective,
        FormsModule,
        ReactiveFormsModule,
        AutoCompleteModule,
        MultiSelectModule,
        InputTextModule,
        TranslateTestingModule.withTranslations('en', require('./../../../../assets/i18n/en.json')).withTranslations(
          'de',
          require('./../../../../assets/i18n/de.json')
        ),
        HttpClientTestingModule
      ],
      providers: [
        AiContextDetailsEffects,
        provideMockStore({
          initialState: { AiContext: { details: initialState, backNavigationPossible: true } }
        }),
        provideMockActions(() => actions$),

        BreadcrumbService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: AIContextBffService, useValue: aiContextService },
        { provide: AIProviderBffService, useValue: aiProviderService },
        { provide: AiKnowledgeBaseBffService, useValue: aiKnowledgeBaseService },
        { provide: AIKnowledgeVectorDbBffService, useValue: aiKnowledgeVectorDbs },
        { provide: Router, useValue: router },
        { provide: PortalMessageService, useValue: messageService },
        { provide: PortalDialogService, useValue: portalDialogService }
      ]
    }).compileComponents()

    effects = TestBed.inject(AiContextDetailsEffects)
    effects.displayError$.subscribe()

    const userService = TestBed.inject(UserService)
    userService.hasPermission = () => true
    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectAiContextDetailsViewModel, baseAiContextDetailsViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(AiContextDetailsComponent)
    component = fixture.componentInstance
    breadcrumbService = TestBed.inject(BreadcrumbService)
    fixture.detectChanges()
    AiContextDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, AiContextDetailsHarness)
  })

  describe('AiContextDetailsEffects', () => {
    describe('saveButtonClicked$', () => {
      it('should handle saveButtonClicked$ and dispatch saveAiContextSucceeded on success', (done) => {
        const details = { id: '123', name: 'Test DB' }
        const res = new HttpResponse<UpdateAIContextResponse>({
          body: { dataObject: { name: 'updated name' } },
          status: 200
        })

        aiContextService.updateAIContext.mockReturnValue(of(res))

        store.overrideSelector(aiContextDetailsSelectors.selectDetails, {
          id: '123',
          name: 'Original Name'
        })
        store.refreshState()

        actions$.next(AiContextDetailsActions.saveButtonClicked({ details }))

        effects.saveButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.updateAiContextSucceeded())
          done()
        })
      })

      it('should handle saveButtonClicked$ and dispatch saveAiContextFailed on error', (done) => {
        const details = { id: '123', name: 'Test DB' }
        const error = 'Save failed'

        aiContextService.updateAIContext.mockReturnValue(throwError(() => error))
        actions$.next(AiContextDetailsActions.saveButtonClicked({ details }))

        effects.saveButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.updateAiContextFailed({ error }))
          done()
        })
      })

      it('should handle saveButtonClicked$ with undefined itemToEditId and dispatch updateAiContextCancelled', (done) => {
        const details = { name: 'Test DB' } as any
        store.overrideSelector(aiContextDetailsSelectors.selectDetails, details)
        store.refreshState()

        actions$.next(AiContextDetailsActions.saveButtonClicked({ details: { name: 'Updated Name' } } as any))

        effects.saveButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.updateAiContextCancelled())
          done()
        })
      })

      it('should handle saveButtonClicked$ and dispatch updateAiContextCancelled on success if details is undefined', (done) => {
        const details = { id: '123', name: 'Test DB' }
        const error = 'Update failed'

        store.overrideSelector(aiContextDetailsSelectors.selectDetails, undefined)
        store.refreshState()

        aiContextService.deleteAIContext.mockReturnValue(throwError(() => error))

        actions$.next(AiContextDetailsActions.saveButtonClicked({ details }))

        effects.saveButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.updateAiContextCancelled())
          done()
        })
      })
    })

    describe('deleteButtonClicked$', () => {
      it('should handle deleteButtonClicked$ and dispatch deleteAiContextSucceeded on success', (done) => {
        const res = new HttpResponse({ status: 204 })
        const details = { id: '123', name: 'Test Item', description: 'Test Description' }

        store.overrideSelector(aiContextDetailsSelectors.selectDetails, details)
        store.refreshState()

        portalDialogService.openDialog.mockReturnValue(
          of({
            button: 'primary',
            data: details,
            result: []
          })
        )

        aiContextService.deleteAIContext.mockReturnValue(of(res))
        actions$.next(AiContextDetailsActions.deleteButtonClicked())

        effects.deleteButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.deleteAiContextSucceeded())
          done()
        })
      })

      it('should handle deleteButtonClicked$ and dispatch deleteAiContextFailed on error', (done) => {
        const error = 'Delete failed'
        const mockItemToDelete = {
          id: '123',
          name: 'Test Item',
          description: 'Test Description'
        }

        portalDialogService.openDialog.mockReturnValue(
          of({
            button: 'primary',
            data: mockItemToDelete,
            result: []
          })
        )
        aiContextService.deleteAIContext.mockReturnValue(throwError(() => error))

        store.overrideSelector(aiContextDetailsSelectors.selectDetails, mockItemToDelete)
        store.refreshState()

        actions$.next(AiContextDetailsActions.deleteButtonClicked())

        effects.deleteButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.deleteAiContextFailed({ error }))
          done()
        })
      })

      it('should handle deleteButtonClicked$ and dispatch deleteAiContextCancelled on cancel', (done) => {
        const mockItemToDelete = {
          id: '123',
          name: 'Test Item',
          description: 'Test Description'
        }

        portalDialogService.openDialog.mockReturnValue(
          of({
            button: 'secondary',
            data: mockItemToDelete,
            result: []
          })
        )
        store.overrideSelector(aiContextDetailsSelectors.selectDetails, mockItemToDelete)
        store.refreshState()

        actions$.next(AiContextDetailsActions.deleteButtonClicked())

        effects.deleteButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.deleteAiContextCancelled())
          done()
        })
      })

      it('should handle deleteButtonClicked$ and throw an error on item not found', (done) => {
        const mockItemToDelete = undefined

        portalDialogService.openDialog.mockReturnValue(
          of({
            button: 'primary',
            data: mockItemToDelete,
            result: []
          })
        )
        store.overrideSelector(aiContextDetailsSelectors.selectDetails, mockItemToDelete)
        store.refreshState()

        actions$.next(AiContextDetailsActions.deleteButtonClicked())

        effects.deleteButtonClicked$.subscribe({
          next: () => {
            fail('Expected error to be thrown')
          },
          error: (err) => {
            expect(err.message).toBe('Item to delete or its ID not found!')
            done()
          }
        })
      })

      it('should navigate to parent route on delete success', (done) => {
        const mockUrl = '/some/path/to/item'
        const expectedUrl = '/some/path'

        router.navigate = jest.fn()
        store.select = jest.fn().mockReturnValue(of(mockUrl))

        actions$.next(AiContextDetailsActions.deleteAiContextSucceeded())

        effects.deleteAiContextSucceeded$.subscribe(() => {
          expect(router.navigate).toHaveBeenCalledWith([expectedUrl])
          done()
        })
      })
    })

    describe('navigatedToDetailsPage$', () => {
      it('should dispatch navigatedToDetailsPage with id', (done) => {
        const mockId = '123'
        const mockAction = routerNavigatedAction({
          payload: {
            event: {
              urlAfterRedirects: '',
              type: EventType.NavigationEnd,
              id: 0,
              url: ''
            },
            routerState: {
              root: new ActivatedRouteSnapshot(),
              url: ''
            }
          }
        })

        store.overrideSelector(selectRouteParam('id'), mockId)
        store.refreshState()

        actions$.next(mockAction)
        effects.navigatedToDetailsPage$.subscribe((action) => {
          expect(action.type).toEqual(AiContextDetailsActions.navigatedToDetailsPage({ id: mockId }).type)
          done()
        })
      })
    })

    describe('searchAIKnowledgeBases$', () => {
      it('should dispatch aiContextDetailsReceived on successful loadItemById$', (done) => {
        const details = { id: '123' }
        const res = new HttpResponse<GetAIContextByIdResponse>({
          body: { result: details },
          status: 200
        })

        aiContextService.getAIContextById.mockReturnValue(of(res.body as any))
        actions$.next(AiContextDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadAiContextById$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.aiContextDetailsReceived({ details }))
          done()
        })
      })

      it('should dispatch aiContextDetailsLoadingFailed on failed loadItemById$', (done) => {
        aiContextService.getAIContextById.mockReturnValue(throwError(() => 'fail'))
        actions$.next(AiContextDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadAiContextById$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.aiContextDetailsLoadingFailed({ error: 'fail' }))
          done()
        })
      })

      it('should call getAIContextById with empty string when id is undefined', (done) => {
        const details = { id: undefined }
        const res = new HttpResponse<GetAIContextByIdResponse>({
          body: { result: details },
          status: 200
        })

        aiContextService.getAIContextById.mockReturnValue(of(res.body as any))
        actions$.next(AiContextDetailsActions.navigatedToDetailsPage({ id: undefined }))

        effects.loadAiContextById$.subscribe((action) => {
          expect(aiContextService.getAIContextById).toHaveBeenCalledWith('')
          expect(action).toEqual(AiContextDetailsActions.aiContextDetailsReceived({ details }))
          done()
        })
      })

      it('should call getAIContextById with empty string when id is empty string', (done) => {
        const details = { id: '' }
        const res = new HttpResponse<GetAIContextByIdResponse>({
          body: { result: details },
          status: 200
        })

        aiContextService.getAIContextById.mockReturnValue(of(res.body as any))
        actions$.next(AiContextDetailsActions.navigatedToDetailsPage({ id: '' }))

        effects.loadAiContextById$.subscribe((action) => {
          expect(aiContextService.getAIContextById).toHaveBeenCalledWith('')
          expect(action).toEqual(AiContextDetailsActions.aiContextDetailsReceived({ details }))
          done()
        })
      })

      it('should dispatch aiContextAiKnowledgeBasesReceived on successful searchAIKnowledgeBases$', (done) => {
        const knowledgeBases = [{ id: 'kb1', name: 'Knowledge Base 1' }]
        const res = new HttpResponse<SearchAIKnowledgeBaseResponse>({
          body: { stream: knowledgeBases, size: 1, number: 1, totalElements: 1, totalPages: 1 },
          status: 200
        })

        aiKnowledgeBaseService.searchAIKnowledgeBases.mockReturnValue(of(res.body as any))
        actions$.next(AiContextDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadAIKnowledgeBases$.subscribe((action) => {
          expect(action).toEqual(
            AiContextDetailsActions.aiContextAiKnowledgeBasesReceived({
              aiKnowledgeBases: knowledgeBases
            })
          )
          done()
        })
      })

      it('should dispatch aiContextAiKnowledgeBasesLoadingFailed on failed searchAIKnowledgeBases$', (done) => {
        aiKnowledgeBaseService.searchAIKnowledgeBases.mockReturnValue(throwError(() => 'fail'))
        actions$.next(AiContextDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadAIKnowledgeBases$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.aiContextAiKnowledgeBasesLoadingFailed({ error: 'fail' }))
          done()
        })
      })

      it('should load aiContextAiKnowledgeBases and dispatch success action', (done) => {
        const knowledgeBases = [{ id: '1', name: 'Knowledge Base 1' }]
        aiKnowledgeBaseService.searchAIKnowledgeBases.mockReturnValue(of({ stream: knowledgeBases } as any))

        actions$.next(AiContextDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadAIKnowledgeBases$.subscribe((action) => {
          expect(aiKnowledgeBaseService.searchAIKnowledgeBases).toHaveBeenCalled()
          expect(action).toEqual(
            AiContextDetailsActions.aiContextAiKnowledgeBasesReceived({
              aiKnowledgeBases: knowledgeBases
            })
          )
          done()
        })
      })

      it('should handle error when loading aiContextAiKnowledgeBases fails', (done) => {
        const error = 'Failed to load contexts'
        aiKnowledgeBaseService.searchAIKnowledgeBases.mockReturnValue(throwError(() => error))

        actions$.next(AiContextDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadAIKnowledgeBases$.subscribe((action) => {
          expect(aiKnowledgeBaseService.searchAIKnowledgeBases).toHaveBeenCalled()
          expect(action).toEqual(
            AiContextDetailsActions.aiContextAiKnowledgeBasesLoadingFailed({
              error
            })
          )
          done()
        })
      })
    })

    describe('loadProviders$', () => {
      it('should dispatch aiContextProvidersReceived on successful loadProviders$', (done) => {
        const providers = [{ id: 'p1', name: 'Provider 1' }]
        aiProviderService.searchAIProvider.mockReturnValue(of({ results: providers } as any))

        actions$.next(AiContextDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadProviders$.subscribe((action) => {
          expect(action).toEqual(
            AiContextDetailsActions.aiContextProvidersReceived({
              providers: providers
            })
          )
          done()
        })
      })

      it('should dispatch aiContextProvidersLoadingFailed on failed loadProviders$', (done) => {
        const error = 'Failed to load providers'
        aiProviderService.searchAIProvider.mockReturnValue(throwError(() => error))

        actions$.next(AiContextDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadProviders$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.aiContextProvidersLoadingFailed({ error }))
          done()
        })
      })
    })

    describe('loadVectorDbs$', () => {
      it('should dispatch aiContextAiKnowledgeVectorDbsReceived on successful loadVectorDbs$', (done) => {
        const vectorDbs = [{ id: 'vdb1', name: 'Vector DB 1' }]
        aiKnowledgeVectorDbs.searchAIKnowledgeVectorDbs.mockReturnValue(of({ results: vectorDbs } as any))

        actions$.next(AiContextDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadVectorDbs$.subscribe((action) => {
          expect(action).toEqual(
            AiContextDetailsActions.aiContextAiKnowledgeVectorDbsReceived({
              aiKnowledgeVectorDbs: vectorDbs
            })
          )
          done()
        })
      })

      it('should dispatch aiContextAiKnowledgeVectorDbsLoadingFailed on failed loadVectorDbs$', (done) => {
        const error = 'Failed to load vector dbs'
        aiKnowledgeVectorDbs.searchAIKnowledgeVectorDbs.mockReturnValue(throwError(() => error))

        actions$.next(AiContextDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadVectorDbs$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.aiContextAiKnowledgeVectorDbsLoadingFailed({ error }))
          done()
        })
      })
    })

    describe('cancelButtonClick', () => {
      it('should dispatch cancelEditNotDirty if cancelButtonClicked with dirty=false', (done) => {
        actions$.next(AiContextDetailsActions.cancelButtonClicked({ dirty: false }))
        effects.cancelButtonNotDirty$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.cancelEditNotDirty())
          done()
        })
      })

      it('should dispatch cancelEditBackClicked if dialogResult.button is secondary', (done) => {
        portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: [] }))
        actions$.next(AiContextDetailsActions.cancelButtonClicked({ dirty: true }))
        effects.cancelButtonClickedDirty$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.cancelEditBackClicked())
          done()
        })
      })

      it('should dispatch cancelEditConfirmClicked if dialogResult.button is not secondary', (done) => {
        portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: [] }))
        actions$.next(AiContextDetailsActions.cancelButtonClicked({ dirty: true }))
        effects.cancelButtonClickedDirty$.subscribe((action) => {
          expect(action).toEqual(AiContextDetailsActions.cancelEditConfirmClicked())
          done()
        })
      })

      it('should handle secondary button click in dialog - dirty', (done) => {
        portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary' } as any))

        actions$.next(AiContextDetailsActions.cancelButtonClicked({ dirty: true }))

        effects.cancelButtonClickedDirty$.subscribe((action) => {
          expect(portalDialogService.openDialog).toHaveBeenCalled()
          expect(action).toEqual(AiContextDetailsActions.cancelEditBackClicked())
          done()
        })
      })

      it('should handle primary button click in dialog - dirty', (done) => {
        portalDialogService.openDialog.mockReturnValue(of({ button: 'primary' } as any))

        actions$.next(AiContextDetailsActions.cancelButtonClicked({ dirty: true }))

        effects.cancelButtonClickedDirty$.subscribe((action) => {
          expect(portalDialogService.openDialog).toHaveBeenCalled()
          expect(action).toEqual(AiContextDetailsActions.cancelEditConfirmClicked())
          done()
        })
      })
    })

    describe('displayError$', () => {
      const testCases = [
        {
          description: 'should show error message for details loading failure',
          action: AiContextDetailsActions.aiContextDetailsLoadingFailed({
            error: 'Test error'
          }),
          expectedKey: 'AI_CONTEXT_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
        },
        {
          description: 'should show error message for aiKnowledgeBases loading failure',
          action: AiContextDetailsActions.aiContextAiKnowledgeBasesLoadingFailed({
            error: 'Test error'
          }),
          expectedKey: 'AI_KNOWLEDGE_BASE_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
        }
      ]

      testCases.forEach(({ description, action, expectedKey }) => {
        it(description, (done) => {
          const errorSpy = jest.spyOn(messageService, 'error')

          actions$.next(action)

          setTimeout(() => {
            try {
              expect(errorSpy).toHaveBeenCalledWith({
                summaryKey: expectedKey
              })
              done()
            } catch (e) {
              done(e)
            }
          }, 0)
        })
      })

      it('should not show error message for unhandled actions', (done) => {
        const errorSpy = jest.spyOn(messageService, 'error')

        const unhandledAction = { type: '[Test] Unhandled Action' }
        actions$.next(unhandledAction as any)

        setTimeout(() => {
          try {
            expect(errorSpy).not.toHaveBeenCalled()
            done()
          } catch (e) {
            done(e)
          }
        }, 0)
      })
    })

    describe('navigateBack$', () => {
      let backSpy: jest.SpyInstance

      beforeEach(() => {
        backSpy = jest.spyOn(window.history, 'back').mockImplementation(() => {})
      })

      afterEach(() => {
        backSpy.mockRestore()
      })

      it('should navigate back when back navigation is possible', (done) => {
        store.overrideSelector(selectBackNavigationPossible, true)
        const action = AiContextDetailsActions.navigateBackButtonClicked()

        actions$.next(action)

        effects.navigateBack$.subscribe((result) => {
          expect(backSpy).toHaveBeenCalled()
          expect(result).toEqual(AiContextDetailsActions.backNavigationStarted())
          done()
        })
      })

      it('should dispatch backNavigationFailed when back navigation is not possible', (done) => {
        store.overrideSelector(selectBackNavigationPossible, false)
        const action = AiContextDetailsActions.navigateBackButtonClicked()

        actions$.next(action)

        effects.navigateBack$.subscribe((result) => {
          expect(backSpy).not.toHaveBeenCalled()
          expect(result).toEqual(AiContextDetailsActions.backNavigationFailed())
          done()
        })
      })
    })

    it('should create', () => {
      expect(component).toBeTruthy()
    })

    it('should display correct breadcrumbs', async () => {
      jest.spyOn(breadcrumbService, 'setItems')

      component.ngOnInit()
      fixture.detectChanges()

      expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
      const pageHeader = await AiContextDetails.getHeader()
      const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Details')
      expect(await searchBreadcrumbItem!.getText()).toEqual('Details')
    })

    it('should display translated headers', async () => {
      const pageHeader = await AiContextDetails.getHeader()
      expect(await pageHeader.getHeaderText()).toEqual('AiContext Details')
      expect(await pageHeader.getSubheaderText()).toEqual('Display of AiContext Details')
    })

    it('should have 2 inline actions', async () => {
      const pageHeader = await AiContextDetails.getHeader()
      const inlineActions = await pageHeader.getInlineActionButtons()
      expect(inlineActions.length).toBe(2)

      const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
      expect(backAction).toBeTruthy()

      const editAction = await pageHeader.getInlineActionButtonByLabel('Edit')
      expect(editAction).toBeTruthy()
    })

    it('should navigate back on back button click', async () => {
      jest.spyOn(window.history, 'back')
      const doneFn = jest.fn()

      const pageHeader = await AiContextDetails.getHeader()
      const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
      store.scannedActions$.pipe(ofType(AiContextDetailsActions.navigateBackButtonClicked)).subscribe(() => {
        doneFn()
      })
      await backAction?.click()
      expect(doneFn).toHaveBeenCalledTimes(1)
    })

    it('should display item details in form fields', async () => {
      store.overrideSelector(selectAiContextDetailsViewModel, baseAiContextDetailsViewModel)
      store.refreshState()

      fixture.detectChanges()
      await fixture.whenStable()

      if (!component.formGroup) {
        component.ngOnInit()
        fixture.detectChanges()
        await fixture.whenStable()
      }

      const pageDetails = component.formGroup.value
      delete baseAiContextDetailsViewModel.details?.creationUser
      delete baseAiContextDetailsViewModel.details?.modificationCount
      delete baseAiContextDetailsViewModel.details?.modificationUser
      expect(pageDetails).toEqual({
        ...baseAiContextDetailsViewModel.details
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

      const pageHeader = await AiContextDetails.getHeader()
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

    it('should enable or disable the form based on editMode', async () => {
      const viewModelView = {
        ...baseAiContextDetailsViewModel,
        editMode: false
      }
      store.overrideSelector(selectAiContextDetailsViewModel, viewModelView)
      store.refreshState()
      fixture.detectChanges()
      await fixture.whenStable()
      expect(component.formGroup.disabled).toBeTruthy()

      const viewModelEdit = {
        ...baseAiContextDetailsViewModel,
        editMode: true
      }
      store.overrideSelector(selectAiContextDetailsViewModel, viewModelEdit)
      store.refreshState()
      fixture.detectChanges()
      await fixture.whenStable()
      expect(component.formGroup.enabled).toBeTruthy()
    })

    it('should show the correct actions for edit and view modes', async () => {
      const viewModelView = {
        ...baseAiContextDetailsViewModel,
        editMode: false
      }
      store.overrideSelector(selectAiContextDetailsViewModel, viewModelView)
      store.refreshState()
      fixture.detectChanges()
      await fixture.whenStable()
      let actions: any[] = []
      component.headerActions$.subscribe((a) => (actions = a))
      const visibleActionsView = actions.filter((a) => a.showCondition)
      const actionLabelsView = visibleActionsView.map((a) => a.labelKey)
      expect(actionLabelsView).toContain('AI_CONTEXT_DETAILS.GENERAL.BACK')
      expect(actionLabelsView).toContain('AI_CONTEXT_DETAILS.GENERAL.EDIT')
      expect(actionLabelsView).not.toContain('AI_CONTEXT_DETAILS.GENERAL.SAVE')
      expect(actionLabelsView).not.toContain('AI_CONTEXT_DETAILS.GENERAL.CANCEL')

      const viewModelEdit = {
        ...baseAiContextDetailsViewModel,
        editMode: true
      }
      store.overrideSelector(selectAiContextDetailsViewModel, viewModelEdit)
      store.refreshState()
      fixture.detectChanges()
      await fixture.whenStable()
      actions = []
      component.headerActions$.subscribe((a) => (actions = a))
      const visibleActionsEdit = actions.filter((a) => a.showCondition)
      const actionLabelsEdit = visibleActionsEdit.map((a) => a.labelKey)
      expect(actionLabelsEdit).toContain('AI_CONTEXT_DETAILS.GENERAL.SAVE')
      expect(actionLabelsEdit).toContain('AI_CONTEXT_DETAILS.GENERAL.CANCEL')
      expect(actionLabelsEdit).not.toContain('AI_CONTEXT_DETAILS.GENERAL.BACK')
      expect(actionLabelsEdit).not.toContain('AI_CONTEXT_DETAILS.GENERAL.EDIT')
    })

    it('should dispatch edit action when edit() is called', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.edit()
      expect(dispatchSpy).toHaveBeenCalledWith(AiContextDetailsActions.editButtonClicked())
    })

    it('should dispatch navigate back action when goBack() is called', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.goBack()
      expect(dispatchSpy).toHaveBeenCalledWith(AiContextDetailsActions.navigateBackButtonClicked())
    })

    it('should dispatch cancel action with dirty state when cancel() is called', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.formGroup.markAsDirty()
      component.cancel()
      expect(dispatchSpy).toHaveBeenCalledWith(AiContextDetailsActions.cancelButtonClicked({ dirty: true }))
    })

    it('should dispatch save action with form values when save() is called', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.formGroup.setValue({
        id: 'id',
        appId: 'appId',
        name: 'name',
        description: 'desc',
        AIKnowledgeBase: { id: '', name: '' },
        provider: { id: '', name: '' },
        aIKnowledgeVectorDb: { id: '', name: '' },
        aIKnowledgeUrl: [],
        aIKnowledgeDbs: [],
        aIKnowledgeDocuments: []
      })
      component.save()
      expect(dispatchSpy).toHaveBeenCalledWith(
        AiContextDetailsActions.saveButtonClicked({
          details: {
            id: 'id',
            appId: 'appId',
            name: 'name',
            description: 'desc',
            AIKnowledgeBase: { id: '', name: '' },
            provider: { id: '', name: '' },
            aIKnowledgeVectorDb: { id: '', name: '' },
            aIKnowledgeUrl: [],
            aIKnowledgeDbs: [],
            aIKnowledgeDocuments: []
          }
        })
      )
    })

    it('should dispatch delete action when delete() is called', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.delete()
      expect(dispatchSpy).toHaveBeenCalledWith(AiContextDetailsActions.deleteButtonClicked())
    })

    it('should call breadcrumbService.setItems on ngOnInit', () => {
      const breadcrumbSpy = jest.spyOn(breadcrumbService, 'setItems')
      component.ngOnInit()
      expect(breadcrumbSpy).toHaveBeenCalledWith([
        {
          titleKey: 'AI_CONTEXT_DETAILS.BREADCRUMB',
          labelKey: 'AI_CONTEXT_DETAILS.BREADCRUMB',
          routerLink: '/ai-context'
        }
      ])
    })

    it('should execute actionCallback for each header action', () => {
      const editSpy = jest.spyOn(component, 'edit')
      const goBackSpy = jest.spyOn(component, 'goBack')
      const cancelSpy = jest.spyOn(component, 'cancel')
      const saveSpy = jest.spyOn(component, 'save')
      const deleteSpy = jest.spyOn(component, 'delete')

      const viewModelView = {
        ...baseAiContextDetailsViewModel,
        editMode: false
      }
      store.overrideSelector(selectAiContextDetailsViewModel, viewModelView)
      store.refreshState()
      fixture.detectChanges()
      let actions: any[] = []
      component.headerActions$.subscribe((a) => (actions = a))
      actions.forEach((action) => {
        if (typeof action.actionCallback === 'function') {
          action.actionCallback()
        }
      })
      expect(editSpy).toHaveBeenCalled()
      expect(goBackSpy).toHaveBeenCalled()
      expect(cancelSpy).toHaveBeenCalled()
      expect(saveSpy).toHaveBeenCalled()
      expect(deleteSpy).toHaveBeenCalled()

      const viewModelEdit = {
        ...baseAiContextDetailsViewModel,
        editMode: true
      }
      store.overrideSelector(selectAiContextDetailsViewModel, viewModelEdit)
      store.refreshState()
      fixture.detectChanges()
      actions = []
      component.headerActions$.subscribe((a) => (actions = a))
      actions.forEach((action) => {
        if (typeof action.actionCallback === 'function') {
          action.actionCallback()
        }
      })
      expect(cancelSpy).toHaveBeenCalled()
      expect(saveSpy).toHaveBeenCalled()
    })

    it('should dispatch cancel action with pristine state when cancel() is called', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.formGroup.markAsPristine()
      component.cancel()
      expect(dispatchSpy).toHaveBeenCalledWith(AiContextDetailsActions.cancelButtonClicked({ dirty: false }))
    })

    it('should patch the form with details and matched provider', () => {
      const provider = { id: 'ctx1', name: 'Context 1' } as any
      const details = { ...baseAiContextDetailsViewModel.details, provider: provider } as any
      const viewModel = {
        ...baseAiContextDetailsViewModel,
        details,
        editMode: false,
        provider: [provider]
      } as any
      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()
      expect(component.formGroup.value.id).toBe(details.id)
      expect(component.formGroup.value.provider).toEqual(provider)
    })

    it('should patch the form with details and matched knowledge base', () => {
      const knowledgeBase = { id: 'kb1', name: 'Knowledge Base 1' } as any
      const details = { ...baseAiContextDetailsViewModel.details, AIKnowledgeBase: knowledgeBase } as any
      const viewModel = {
        ...baseAiContextDetailsViewModel,
        details,
        editMode: false,
        aiKnowledgeBases: [knowledgeBase]
      } as any
      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()
      expect(component.formGroup.value.id).toBe(details.id)
      expect(component.formGroup.value.AIKnowledgeBase).toEqual(knowledgeBase)
    })

    it('should patch the form with details and matched vector db', () => {
      const vectorDb = { id: 'vdb1', name: 'Vector DB 1' } as any
      const details = { ...baseAiContextDetailsViewModel.details, aIKnowledgeVectorDb: vectorDb } as any
      const viewModel = {
        ...baseAiContextDetailsViewModel,
        details,
        editMode: false,
        aiKnowledgeVectorDbs: [vectorDb]
      } as any
      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()
      expect(component.formGroup.value.id).toBe(details.id)
      expect(component.formGroup.value.aIKnowledgeVectorDb).toEqual(vectorDb)
    })

    it('should emit correct providersSuggestions$ for details with provider', (done) => {
      const selectedProvider = {
        id: 'id-1',
        name: 'Selected Provider',
        description: 'Selected provider description',
        llmUrl: 'selected-url',
        appId: 'selected-app',
        modelName: 'selected-model',
        modelVersion: '1.0',
        apiKey: 'selected-key'
      }

      const otherProvider = {
        id: 'id-2',
        name: 'Other Provider',
        description: 'Other provider description',
        llmUrl: 'other-url',
        appId: 'other-app',
        modelName: 'other-model',
        modelVersion: '2.0',
        apiKey: 'other-key'
      }

      const details = { ...baseAiContextDetailsViewModel.details, provider: selectedProvider }
      const viewModel = {
        ...baseAiContextDetailsViewModel,
        details,
        aiProviders: [selectedProvider, otherProvider]
      }

      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()

      component.providersSuggestions$.subscribe((providers) => {
        expect(providers.length).toBe(1)
        expect(providers[0]).toEqual(otherProvider)
        expect(providers).not.toContain(selectedProvider)
        done()
      })
    })

    it('should emit correct providersSuggestions$ for details without provider', (done) => {
      const provider1 = {
        id: 'id-1',
        name: 'Provider 1',
        description: 'Provider 1 description',
        llmUrl: 'provider1-url',
        appId: 'provider1-app',
        modelName: 'provider1-model',
        modelVersion: '1.0',
        apiKey: 'provider1-key'
      }

      const provider2 = {
        id: 'id-2',
        name: 'Provider 2',
        description: 'Provider 2 description',
        llmUrl: 'provider2-url',
        appId: 'provider2-app',
        modelName: 'provider2-model',
        modelVersion: '2.0',
        apiKey: 'provider2-key'
      }

      const details = { ...baseAiContextDetailsViewModel.details, provider: undefined }
      const viewModel = {
        ...baseAiContextDetailsViewModel,
        details,
        aiProviders: [provider1, provider2]
      }

      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()

      component.providersSuggestions$.subscribe((providers) => {
        expect(providers.length).toBe(2)
        expect(providers).toContain(provider1)
        expect(providers).toContain(provider2)
        done()
      })
    })

    it('should emit empty array for providersSuggestions$ when aiProviders is undefined', (done) => {
      const details = { ...baseAiContextDetailsViewModel.details, provider: undefined }
      const viewModel = {
        ...baseAiContextDetailsViewModel,
        details,
        aiProviders: undefined
      }

      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()

      component.providersSuggestions$.subscribe((providers) => {
        expect(providers).toEqual([])
        done()
      })
    })

    it('should emit correct knowledgeBaseSuggestions$ for details with knowledge base', (done) => {
      const selectedKnowledgeBase = {
        id: 'id-1',
        name: 'Selected Knowledge Base',
        description: 'Selected knowledge base description',
        aiContext: []
      }

      const otherKnowledgeBase = {
        id: 'id-2',
        name: 'Other Knowledge Base',
        description: 'Other knowledge base description',
        aiContext: []
      }

      const details = { ...baseAiContextDetailsViewModel.details, AIKnowledgeBase: selectedKnowledgeBase }
      const viewModel = {
        ...baseAiContextDetailsViewModel,
        details,
        aiKnowledgeBases: [selectedKnowledgeBase, otherKnowledgeBase]
      }

      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()

      component.knowledgeBaseSuggestions$.subscribe((knowledgeBases) => {
        expect(knowledgeBases.length).toBe(1)
        expect(knowledgeBases[0]).toEqual(otherKnowledgeBase)
        expect(knowledgeBases).not.toContain(selectedKnowledgeBase)
        done()
      })
    })

    it('should emit correct knowledgeBaseSuggestions$ for details without knowledge base', (done) => {
      const knowledgeBase1 = {
        id: 'id-1',
        name: 'Knowledge Base 1',
        description: 'Knowledge base 1 description',
        aiContext: []
      }

      const knowledgeBase2 = {
        id: 'id-2',
        name: 'Knowledge Base 2',
        description: 'Knowledge base 2 description',
        aiContext: []
      }

      const details = { ...baseAiContextDetailsViewModel.details, AIKnowledgeBase: undefined }
      const viewModel = {
        ...baseAiContextDetailsViewModel,
        details,
        aiKnowledgeBases: [knowledgeBase1, knowledgeBase2]
      }

      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()

      component.knowledgeBaseSuggestions$.subscribe((knowledgeBases) => {
        expect(knowledgeBases.length).toBe(2)
        expect(knowledgeBases).toContain(knowledgeBase1)
        expect(knowledgeBases).toContain(knowledgeBase2)
        done()
      })
    })

    it('should emit empty array for knowledgeBaseSuggestions$ when aiKnowledgeBases is undefined', (done) => {
      const details = { ...baseAiContextDetailsViewModel.details, AIKnowledgeBase: undefined }
      const viewModel = {
        ...baseAiContextDetailsViewModel,
        details,
        aiKnowledgeBases: undefined
      }

      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()

      component.knowledgeBaseSuggestions$.subscribe((knowledgeBases) => {
        expect(knowledgeBases).toEqual([])
        done()
      })
    })

    it('should emit correct vectorDbSuggestions$ for details with vector db', (done) => {
      const selectedVectorDb = {
        id: 'id-1',
        name: 'Selected Vector DB',
        description: 'Selected vector db description',
        vdb: 'vdb-1',
        vdbCollection: 'collection-1',
        aiContext: {}
      }

      const otherVectorDb = {
        id: 'id-2',
        name: 'Other Vector DB',
        description: 'Other vector db description',
        vdb: 'vdb-2',
        vdbCollection: 'collection-2',
        aiContext: {}
      }

      const details = { ...baseAiContextDetailsViewModel.details, aIKnowledgeVectorDb: selectedVectorDb }
      const viewModel = {
        ...baseAiContextDetailsViewModel,
        details,
        aiKnowledgeVectorDbs: [selectedVectorDb, otherVectorDb]
      }

      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()

      component.vectorDbSuggestions$.subscribe((vectorDbs) => {
        expect(vectorDbs.length).toBe(1)
        expect(vectorDbs[0]).toEqual(otherVectorDb)
        expect(vectorDbs).not.toContain(selectedVectorDb)
        done()
      })
    })

    it('should emit correct vectorDbSuggestions$ for details without vector db', (done) => {
      const vectorDb1 = {
        id: 'id-1',
        name: 'Vector DB 1',
        description: 'Vector db 1 description',
        vdb: 'vdb-1',
        vdbCollection: 'collection-1',
        aiContext: {}
      }

      const vectorDb2 = {
        id: 'id-2',
        name: 'Vector DB 2',
        description: 'Vector db 2 description',
        vdb: 'vdb-2',
        vdbCollection: 'collection-2',
        aiContext: {}
      }

      const details = { ...baseAiContextDetailsViewModel.details, aIKnowledgeVectorDb: undefined }
      const viewModel = {
        ...baseAiContextDetailsViewModel,
        details,
        aiKnowledgeVectorDbs: [vectorDb1, vectorDb2]
      }

      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()

      component.vectorDbSuggestions$.subscribe((vectorDbs) => {
        expect(vectorDbs.length).toBe(2)
        expect(vectorDbs).toContain(vectorDb1)
        expect(vectorDbs).toContain(vectorDb2)
        done()
      })
    })

    it('should emit empty array for vectorDbSuggestions$ when aiKnowledgeVectorDbs is undefined', (done) => {
      const details = { ...baseAiContextDetailsViewModel.details, aIKnowledgeVectorDb: undefined }
      const viewModel = {
        ...baseAiContextDetailsViewModel,
        details,
        aiKnowledgeVectorDbs: undefined
      }

      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()

      component.vectorDbSuggestions$.subscribe((vectorDbs) => {
        expect(vectorDbs).toEqual([])
        done()
      })
    })

    it('should handle missing details gracefully', () => {
      const viewModel = { ...baseAiContextDetailsViewModel, details: undefined } as any
      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()
      expect(component.formGroup.value.id).toBe('')
    })

    it('should handle empty aIKnowledgeDocuments array gracefully', () => {
      const details = {
        ...baseAiContextDetailsViewModel.details,
        aIKnowledgeDocuments: []
      }
      const viewModel = {
        ...baseAiContextDetailsViewModel,
        details
      }
      store.overrideSelector(selectAiContextDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()
      expect(component.formGroup.value.aIKnowledgeDocuments).toEqual([])
    })

    describe('aiContextDetailsReducer (integration)', () => {
      it('should return the initial state for an unknown action', () => {
        const action = { type: 'Unknown' } as any
        const state = aiContextDetailsReducer(undefined, action)
        expect(state).toBe(initialState)
      })

      it('should handle aiContextDetailsReceived', () => {
        const details = {
          id: '1',
          name: 'Test',
          description: '',
          aiContext: { id: 'ctx', name: 'Context' },
          vdb: '',
          vdbCollection: '',
          modificationCount: 0
        }
        const action = AiContextDetailsActions.aiContextDetailsReceived({ details })
        const state = aiContextDetailsReducer(initialState, action)
        expect(state.details).toEqual(details)
        expect(state.detailsLoadingIndicator).toBe(false)
        expect(state.detailsLoaded).toBe(true)
      })

      it('should handle aiContextDetailsLoadingFailed', () => {
        const preState: AiContextDetailsState = {
          ...initialState,
          details: {
            id: '2',
            name: 'Old',
            description: '',
            aIKnowledgeDbs: [
              {
                id: 'ctx',
                name: 'Context',
                db: '',
                user: '',
                pwd: ''
              }
            ]
          },
          detailsLoadingIndicator: true,
          detailsLoaded: true
        }
        const action = AiContextDetailsActions.aiContextDetailsLoadingFailed({ error: null })
        const state = aiContextDetailsReducer(preState, action)
        expect(state.details).toEqual(initialState.details)
        expect(state.detailsLoadingIndicator).toBe(false)
        expect(state.detailsLoaded).toBe(false)
      })

      it('should handle aiContextProvidersReceived', () => {
        const providers = [{ id: 'prv1', name: 'Provider 1' }]
        const action = AiContextDetailsActions.aiContextProvidersReceived({ providers: providers })
        const state = aiContextDetailsReducer(initialState, action)
        expect(state.aiProviders).toEqual(providers)
        expect(state.aiProvidersLoadingIndicator).toBe(false)
        expect(state.aiProvidersLoaded).toBe(true)
      })

      it('should handle aiContextProvidersLoadingFailed', () => {
        const preState: AiContextDetailsState = {
          ...initialState,
          aiProviders: [{ id: 'prv2', name: 'Old Provider' }],
          aiProvidersLoadingIndicator: true,
          aiProvidersLoaded: true
        }
        const action = AiContextDetailsActions.aiContextProvidersLoadingFailed({ error: null })
        const state = aiContextDetailsReducer(preState, action)
        expect(state.aiProviders).toEqual(initialState.aiProviders)
        expect(state.aiProvidersLoadingIndicator).toBe(false)
        expect(state.aiProvidersLoaded).toBe(false)
      })

      it('should handle aiContextAiKnowledgeBasesReceived', () => {
        const aiknowledgeBases = [{ id: 'ctx1', name: 'Context 1' }]
        const action = AiContextDetailsActions.aiContextAiKnowledgeBasesReceived({ aiKnowledgeBases: aiknowledgeBases })
        const state = aiContextDetailsReducer(initialState, action)
        expect(state.aiKnowledgeBases).toEqual(aiknowledgeBases)
        expect(state.aiKnowledgeBasesLoadingIndicator).toBe(false)
        expect(state.aiKnowledgeBasesLoaded).toBe(true)
      })

      it('should handle aiContextAiKnowledgeBasesLoadingFailed', () => {
        const preState: AiContextDetailsState = {
          ...initialState,
          aiKnowledgeBases: [{ id: 'ctx2', name: 'Old Context' }],
          aiKnowledgeBasesLoadingIndicator: true,
          aiKnowledgeBasesLoaded: true
        }
        const action = AiContextDetailsActions.aiContextAiKnowledgeBasesLoadingFailed({ error: null })
        const state = aiContextDetailsReducer(preState, action)
        expect(state.aiKnowledgeBases).toEqual(initialState.aiKnowledgeBases)
        expect(state.aiKnowledgeBasesLoadingIndicator).toBe(false)
        expect(state.aiKnowledgeBasesLoaded).toBe(false)
      })

      it('should handle aiContextAiKnowledgeVectorDbsReceived', () => {
        const aiKnowledgeVectorDbs = [{ id: 'kvdb1', name: 'KnowledgeVectorDB 1' }]
        const action = AiContextDetailsActions.aiContextAiKnowledgeVectorDbsReceived({ aiKnowledgeVectorDbs })
        const state = aiContextDetailsReducer(initialState, action)
        expect(state.aiKnowledgeVectorDbs).toEqual(aiKnowledgeVectorDbs)
        expect(state.aiKnowledgeVectorDbsLoadingIndicator).toBe(false)
        expect(state.aiKnowledgeVectorDbsLoaded).toBe(true)
      })

      it('should handle aiContextAiKnowledgeVectorDbsLoadingFailed', () => {
        const preState: AiContextDetailsState = {
          ...initialState,
          aiKnowledgeVectorDbs: [{ id: 'kvdb2', name: 'Old KnowledgeVectorDB' }],
          aiKnowledgeVectorDbsLoadingIndicator: true,
          aiKnowledgeVectorDbsLoaded: true
        }
        const action = AiContextDetailsActions.aiContextAiKnowledgeVectorDbsLoadingFailed({ error: null })
        const state = aiContextDetailsReducer(preState, action)
        expect(state.aiKnowledgeVectorDbs).toEqual(initialState.aiKnowledgeVectorDbs)
        expect(state.aiKnowledgeVectorDbsLoadingIndicator).toBe(false)
        expect(state.aiKnowledgeVectorDbsLoaded).toBe(false)
      })

      it('should handle navigatedToDetailsPage', () => {
        const preState: AiContextDetailsState = {
          ...initialState,
          details: {
            id: '2',
            name: 'Old',
            description: '',
            aIKnowledgeDbs: [
              {
                id: 'ctx',
                name: 'Context',
                db: '',
                user: '',
                pwd: ''
              }
            ]
          },
          editMode: true
        }
        const action = AiContextDetailsActions.navigatedToDetailsPage({ id: undefined })
        const state = aiContextDetailsReducer(preState, action)
        expect(state).toEqual(initialState)
      })

      it('should handle editButtonClicked', () => {
        const action = AiContextDetailsActions.editButtonClicked()
        const state = aiContextDetailsReducer(initialState, action)
        expect(state.editMode).toBe(true)
      })

      it('should handle saveButtonClicked', () => {
        const details = {
          id: '3',
          name: 'Save',
          description: '',
          provider: { id: 'id-1', name: 'provider' },
          vdb: '',
          vdbCollection: '',
          modificationCount: 0
        }
        const action = AiContextDetailsActions.saveButtonClicked({ details })
        const state = aiContextDetailsReducer(initialState, action)
        expect(state.details).toEqual(details)
        expect(state.editMode).toBe(false)
        expect(state.isSubmitting).toBe(true)
      })

      it('should handle navigateBackButtonClicked', () => {
        const action = AiContextDetailsActions.navigateBackButtonClicked()
        const state = aiContextDetailsReducer(initialState, action)
        expect(state).toEqual(initialState)
      })

      it('should handle cancelEditConfirmClicked and related actions', () => {
        const actions = [
          AiContextDetailsActions.cancelEditConfirmClicked(),
          AiContextDetailsActions.cancelEditNotDirty(),
          AiContextDetailsActions.updateAiContextCancelled(),
          AiContextDetailsActions.updateAiContextSucceeded()
        ]
        actions.forEach((action) => {
          const preState: AiContextDetailsState = { ...initialState, editMode: true, isSubmitting: true }
          const state = aiContextDetailsReducer(preState, action)
          expect(state.editMode).toBe(false)
          expect(state.isSubmitting).toBe(false)
        })
      })

      it('should handle updateAiContextFailed', () => {
        const preState: AiContextDetailsState = { ...initialState, isSubmitting: true }
        const action = AiContextDetailsActions.updateAiContextFailed({ error: null })
        const state = aiContextDetailsReducer(preState, action)
        expect(state.isSubmitting).toBe(false)
      })
    })

    describe('AiContextDetails autocomplete search methods', () => {
      it('should update knowledgeBaseQuery$ when searchKnowledgeBases is called', (done) => {
        const searchQuery = 'test query'
        const searchEvent = { query: searchQuery }

        component.knowledgeBaseQuery$.subscribe((query) => {
          expect(query).toBe(searchQuery)
          done()
        })

        component.searchKnowledgeBases(searchEvent)
      })

      it('should update providerQuery$ when searchProviders is called', (done) => {
        const searchQuery = 'provider search'
        const searchEvent = { query: searchQuery }

        component.providerQuery$.subscribe((query) => {
          expect(query).toBe(searchQuery)
          done()
        })

        component.searchProviders(searchEvent)
      })

      it('should update vectorDbQuery$ when searchVectorDbs is called', (done) => {
        const searchQuery = 'vector db search'
        const searchEvent = { query: searchQuery }

        component.vectorDbQuery$.subscribe((query) => {
          expect(query).toBe(searchQuery)
          done()
        })

        component.searchVectorDbs(searchEvent)
      })
    })

    describe('AiContextDetails Selectors', () => {
      const baseState: any = {
        details: {},
        detailsLoaded: true,
        detailsLoadingIndicator: false,

        aiProviders: [],
        aiProvidersLoaded: true,
        aiProvidersLoadingIndicator: false,

        aiKnowledgeBases: [],
        aiKnowledgeBasesLoaded: true,
        aiKnowledgeBasesLoadingIndicator: false,

        aiKnowledgeVectorDbs: [],
        aiKnowledgeVectorDbsLoaded: true,
        aiKnowledgeVectorDbsLoadingIndicator: false,

        backNavigationPossible: true,
        editMode: false,
        isSubmitting: false
      }

      it('should select the full view model', () => {
        const result = selectAiContextDetailsViewModel.projector(
          baseState.details,
          baseState.detailsLoadingIndicator,
          baseState.detailsLoaded,

          baseState.aiProviders,
          baseState.aiProvidersLoadingIndicator,
          baseState.aiProvidersLoaded,

          baseState.aiKnowledgeBases,
          baseState.aiKnowledgeBasesLoadingIndicator,
          baseState.aiKnowledgeBasesLoaded,

          baseState.aiKnowledgeVectorDbs,
          baseState.aiKnowledgeVectorDbsLoadingIndicator,
          baseState.aiKnowledgeVectorDbsLoaded,

          true,
          baseState.editMode,
          baseState.isSubmitting
        )

        expect(result).toEqual({
          details: baseState.details,
          detailsLoadingIndicator: false,
          detailsLoaded: true,

          aiProviders: baseState.aiProviders,
          aiProvidersLoadingIndicator: false,
          aiProvidersLoaded: true,

          aiKnowledgeBases: baseState.aiKnowledgeBases,
          aiKnowledgeBasesLoadingIndicator: false,
          aiKnowledgeBasesLoaded: true,

          aiKnowledgeVectorDbs: baseState.aiKnowledgeVectorDbs,
          aiKnowledgeVectorDbsLoadingIndicator: false,
          aiKnowledgeVectorDbsLoaded: true,

          backNavigationPossible: true,
          editMode: false,
          isSubmitting: false
        })
      })

      it('should handle undefined details and empty contexts', () => {
        const result = selectAiContextDetailsViewModel.projector(
          undefined,
          true,
          false,

          [],
          false,
          true,

          [],
          false,
          true,

          [],
          false,
          true,

          true,
          false,
          false
        )
        expect(result.details).toBeUndefined()
        expect(result.aiKnowledgeBases).toEqual([])
        expect(result.detailsLoaded).toBe(false)
        expect(result.detailsLoadingIndicator).toBe(true)
      })
    })
  })
})
