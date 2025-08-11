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
import { AIKnowledgeVectorDbDetailsComponent } from './ai-knowledge-vector-db-details.component'
import { AIKnowledgeVectorDbDetailsHarness } from './ai-knowledge-vector-db-details.harness'
import { AIKnowledgeVectorDbDetailsReducer, initialState } from './ai-knowledge-vector-db-details.reducers'
import {
  AIKnowledgeVectorDbDetailsSelectors,
  selectAIKnowledgeVectorDbDetailsViewModel
} from './ai-knowledge-vector-db-details.selectors'
import { AIKnowledgeVectorDbDetailsViewModel } from './ai-knowledge-vector-db-details.viewmodel'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import {
  AIContextBffService,
  AIKnowledgeDocumentStatusEnum,
  AIKnowledgeVectorDbBffService,
  GetAIKnowledgeVectorDbByIdResponse,
  SearchAIContextResponse,
  UpdateAIKnowledgeVectorDbResponse
} from 'src/app/shared/generated'
import { PrimeIcons } from 'primeng/api'
import { ofType } from '@ngrx/effects'
import { AIKnowledgeVectorDbDetailsActions } from './ai-knowledge-vector-db-details.actions'
import { AIKnowledgeVectorDbDetailsState } from './ai-knowledge-vector-db-details.state'
import { ReplaySubject, of, throwError } from 'rxjs'
import { AIKnowledgeVectorDbDetailsEffects } from './ai-knowledge-vector-db-details.effects'
import { provideMockActions } from '@ngrx/effects/testing'
import { HttpResponse } from '@angular/common/http'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'
import { selectRouteParam } from 'src/app/shared/selectors/router.selectors'
import { routerNavigatedAction } from '@ngrx/router-store'
describe('AIKnowledgeVectorDbDetailsComponent', () => {
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

  let component: AIKnowledgeVectorDbDetailsComponent
  let fixture: ComponentFixture<AIKnowledgeVectorDbDetailsComponent>
  let store: MockStore<Store>
  let breadcrumbService: BreadcrumbService
  let AIKnowledgeVectorDbDetails: AIKnowledgeVectorDbDetailsHarness
  let effects: AIKnowledgeVectorDbDetailsEffects
  let actions$: ReplaySubject<any>
  let aiKnowledgeVectorDbService: jest.Mocked<AIKnowledgeVectorDbBffService>
  let aiContextService: jest.Mocked<AIContextBffService>
  let portalDialogService: jest.Mocked<PortalDialogService>
  let messageService: jest.Mocked<PortalMessageService>
  let router: jest.Mocked<Router>

  const baseAIKnowledgeVectorDbDetailsViewModel: AIKnowledgeVectorDbDetailsViewModel = {
    details: {
      id: '1',
      name: 'Test name',
      description: 'Test description',
      vdb: 'Test vdb',
      vdbCollection: 'Test vdb collection',
      aiContext: {
        id: 'string',
        appId: 'string',
        name: 'string',
        description: 'string',
        modificationCount: -2147483648,
        modificationUser: 'string',
        creationUser: 'string',
        AIKnowledgeBase: {
          modificationCount: -2147483648,
          id: 'string',
          name: 'string',
          description: 'string',
          aiContext: []
        },
        provider: {
          modificationCount: -2147483648,
          id: 'string',
          name: 'string',
          description: 'string',
          llmUrl: 'string',
          appId: 'string',
          modelName: 'string',
          modelVersion: 'string',
          apiKey: 'string'
        },
        aIKnowledgeVectorDb: {
          modificationCount: -2147483648,
          id: 'string',
          name: 'string',
          description: 'string',
          vdb: 'string',
          vdbCollection: 'string',
          aiContext: {}
        },
        aIKnowledgeUrl: [
          {
            modificationCount: -2147483648,
            modificationUser: 'string',
            creationUser: 'string',
            id: 'string',
            url: 'string',
            name: 'string',
            description: 'string'
          }
        ],
        aIKnowledgeDbs: [
          {
            modificationCount: -2147483648,
            modificationUser: 'string',
            id: 'string',
            name: 'string',
            description: 'string',
            db: 'string',
            user: 'string',
            pwd: 'string',
            tables: ['string']
          }
        ],
        aIKnowledgeDocuments: [
          {
            modificationCount: -2147483648,
            id: 'string',
            name: 'string',
            documentRefId: 'string',
            status: AIKnowledgeDocumentStatusEnum.New
          }
        ]
      }
    },
    contexts: [],
    detailsLoaded: true,
    detailsLoadingIndicator: false,
    contextsLoaded: true,
    contextsLoadingIndicator: false,
    backNavigationPossible: true,
    editMode: false,
    isSubmitting: false
  }

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)
    aiKnowledgeVectorDbService = {
      getAIKnowledgeVectorDbById: jest.fn(),
      updateAIKnowledgeVectorDb: jest.fn(),
      deleteAIKnowledgeVectorDb: jest.fn()
    } as unknown as jest.Mocked<AIKnowledgeVectorDbBffService>

    aiContextService = {
      searchAIContexts: jest.fn()
    } as unknown as jest.Mocked<AIContextBffService>

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
          component: AIKnowledgeVectorDbDetailsComponent,
          firstChild: {
            component: AIKnowledgeVectorDbDetailsComponent,
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
            component: AIKnowledgeVectorDbDetailsComponent,
            firstChild: {
              component: AIKnowledgeVectorDbDetailsComponent,
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
      declarations: [AIKnowledgeVectorDbDetailsComponent],
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
        AIKnowledgeVectorDbDetailsEffects,

        provideMockStore({
          initialState: { AIKnowledgeVectorDb: { details: initialState, backNavigationPossible: true } }
        }),
        provideMockActions(() => actions$),

        BreadcrumbService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: AIKnowledgeVectorDbBffService, useValue: aiKnowledgeVectorDbService },
        { provide: AIContextBffService, useValue: aiContextService },
        { provide: Router, useValue: router },
        { provide: PortalMessageService, useValue: messageService },
        { provide: PortalDialogService, useValue: portalDialogService }
      ]
    }).compileComponents()

    effects = TestBed.inject(AIKnowledgeVectorDbDetailsEffects)
    effects.displayError$.subscribe()

    const userService = TestBed.inject(UserService)
    userService.hasPermission = () => true
    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectAIKnowledgeVectorDbDetailsViewModel, baseAIKnowledgeVectorDbDetailsViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(AIKnowledgeVectorDbDetailsComponent)
    component = fixture.componentInstance
    breadcrumbService = TestBed.inject(BreadcrumbService)
    fixture.detectChanges()
    AIKnowledgeVectorDbDetails = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      AIKnowledgeVectorDbDetailsHarness
    )
  })

  describe('AIKnowledgeVectorDbDetailsEffects', () => {
    describe('saveButtonClicked$', () => {
      it('should handle saveButtonClicked$ and dispatch saveAIKnowledgeVectorDbSucceeded on success', (done) => {
        const details = { id: '123', name: 'Test DB' }
        const res = new HttpResponse<UpdateAIKnowledgeVectorDbResponse>({ body: { name: 'Test DB' }, status: 200 })

        aiKnowledgeVectorDbService.updateAIKnowledgeVectorDb.mockReturnValue(of(res))

        store.overrideSelector(AIKnowledgeVectorDbDetailsSelectors.selectDetails, {
          id: '123',
          name: 'Original Name'
        })
        store.refreshState()

        actions$.next(AIKnowledgeVectorDbDetailsActions.saveButtonClicked({ details }))

        effects.saveButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AIKnowledgeVectorDbDetailsActions.updateAIKnowledgeVectorDbSucceeded())
          done()
        })
      })

      it('should handle saveButtonClicked$ and dispatch saveAIKnowledgeVectorDbFailed on error', (done) => {
        const details = { id: '123', name: 'Test DB' }
        const error = 'Save failed'

        aiKnowledgeVectorDbService.updateAIKnowledgeVectorDb.mockReturnValue(throwError(() => error))
        actions$.next(AIKnowledgeVectorDbDetailsActions.saveButtonClicked({ details }))

        effects.saveButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AIKnowledgeVectorDbDetailsActions.updateAIKnowledgeVectorDbFailed({ error }))
          done()
        })
      })

      it('should handle saveButtonClicked$ with undefined itemToEditId and dispatch updateAIKnowledgeVectorDbCancelled', (done) => {
        const details = { name: 'Test DB' } as any
        store.overrideSelector(AIKnowledgeVectorDbDetailsSelectors.selectDetails, details)
        store.refreshState()

        actions$.next(AIKnowledgeVectorDbDetailsActions.saveButtonClicked({ details: { name: 'Updated Name' } } as any))

        effects.saveButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AIKnowledgeVectorDbDetailsActions.updateAIKnowledgeVectorDbCancelled())
          done()
        })
      })

      it('should handle saveButtonClicked$ and dispatch updateAIKnowledgeVectorDbCancelled on success if details is undefined', (done) => {
        const details = { id: '123', name: 'Test DB' }
        const error = 'Update failed'

        store.overrideSelector(AIKnowledgeVectorDbDetailsSelectors.selectDetails, undefined)
        store.refreshState()

        aiKnowledgeVectorDbService.deleteAIKnowledgeVectorDb.mockReturnValue(throwError(() => error))

        actions$.next(AIKnowledgeVectorDbDetailsActions.saveButtonClicked({ details }))

        effects.saveButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AIKnowledgeVectorDbDetailsActions.updateAIKnowledgeVectorDbCancelled())
          done()
        })
      })
    })

    describe('deleteButtonClicked$', () => {
      it('should handle deleteButtonClicked$ and dispatch deleteAIKnowledgeVectorDbSucceeded on success', (done) => {
        const res = new HttpResponse({ status: 204 })
        const details = { id: '123', name: 'Test Item', description: 'Test Description' }

        store.overrideSelector(AIKnowledgeVectorDbDetailsSelectors.selectDetails, details)
        store.refreshState()

        portalDialogService.openDialog.mockReturnValue(
          of({
            button: 'primary',
            data: details,
            result: []
          })
        )

        aiKnowledgeVectorDbService.deleteAIKnowledgeVectorDb.mockReturnValue(of(res))
        actions$.next(AIKnowledgeVectorDbDetailsActions.deleteButtonClicked())

        effects.deleteButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AIKnowledgeVectorDbDetailsActions.deleteAIKnowledgeVectorDbSucceeded())
          done()
        })
      })

      it('should handle deleteButtonClicked$ and dispatch deleteAIKnowledgeVectorDbFailed on error', (done) => {
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
        aiKnowledgeVectorDbService.deleteAIKnowledgeVectorDb.mockReturnValue(throwError(() => error))

        store.overrideSelector(AIKnowledgeVectorDbDetailsSelectors.selectDetails, mockItemToDelete)
        store.refreshState()

        actions$.next(AIKnowledgeVectorDbDetailsActions.deleteButtonClicked())

        effects.deleteButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AIKnowledgeVectorDbDetailsActions.deleteAIKnowledgeVectorDbFailed({ error }))
          done()
        })
      })

      it('should handle deleteButtonClicked$ and dispatch deleteAIKnowledgeVectorDbCancelled on cancel', (done) => {
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
        store.overrideSelector(AIKnowledgeVectorDbDetailsSelectors.selectDetails, mockItemToDelete)
        store.refreshState()

        actions$.next(AIKnowledgeVectorDbDetailsActions.deleteButtonClicked())

        effects.deleteButtonClicked$.subscribe((action) => {
          expect(action).toEqual(AIKnowledgeVectorDbDetailsActions.deleteAIKnowledgeVectorDbCancelled())
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
        store.overrideSelector(AIKnowledgeVectorDbDetailsSelectors.selectDetails, mockItemToDelete)
        store.refreshState()

        actions$.next(AIKnowledgeVectorDbDetailsActions.deleteButtonClicked())

        effects.deleteButtonClicked$.subscribe({
          next: () => {
            fail('Expected error to be thrown')
          },
          error: (err) => {
            expect(err.message).toBe('Item to delete not found!')
            done()
          }
        })
      })

      it('should navigate to parent route on delete success', (done) => {
        const mockUrl = '/some/path/to/item'
        const expectedUrl = '/some/path'

        router.navigate = jest.fn()
        store.select = jest.fn().mockReturnValue(of(mockUrl))

        actions$.next(AIKnowledgeVectorDbDetailsActions.deleteAIKnowledgeVectorDbSucceeded())

        effects.deleteAIKnowledgeVectorDbSucceeded$.subscribe(() => {
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
          expect(action.type).toEqual(AIKnowledgeVectorDbDetailsActions.navigatedToDetailsPage({ id: mockId }).type)
          done()
        })
      })
    })

    describe('loadContextsById$', () => {
      it('should dispatch aiKnowledgeVectorDbDetailsReceived on successful loadItemById$', (done) => {
        const details = { id: '123' }
        const res = new HttpResponse<GetAIKnowledgeVectorDbByIdResponse>({
          body: { result: details },
          status: 200
        })

        aiKnowledgeVectorDbService.getAIKnowledgeVectorDbById.mockReturnValue(of(res.body as any))
        actions$.next(AIKnowledgeVectorDbDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadItemById$.subscribe((action) => {
          expect(action).toEqual(AIKnowledgeVectorDbDetailsActions.aiKnowledgeVectorDbDetailsReceived({ details }))
          done()
        })
      })

      it('should dispatch aiKnowledgeVectorDbDetailsLoadingFailed on failed loadItemById$', (done) => {
        aiKnowledgeVectorDbService.getAIKnowledgeVectorDbById.mockReturnValue(throwError(() => 'fail'))
        actions$.next(AIKnowledgeVectorDbDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadItemById$.subscribe((action) => {
          expect(action).toEqual(
            AIKnowledgeVectorDbDetailsActions.aiKnowledgeVectorDbDetailsLoadingFailed({ error: 'fail' })
          )
          done()
        })
      })

      it('should dispatch aiKnowledgeVectorDbContextsReceived on successful loadContextsById$', (done) => {
        const stream = [{ id: 'ctx1' }]
        const res: SearchAIContextResponse = {
          number: 1,
          size: 2,
          stream: stream,
          totalElements: 3,
          totalPages: 4
        }

        aiContextService.searchAIContexts.mockReturnValue(of(res as any))
        actions$.next(AIKnowledgeVectorDbDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadContextsById$.subscribe((action) => {
          expect(action).toEqual(
            AIKnowledgeVectorDbDetailsActions.aiKnowledgeVectorDbContextsReceived({ contexts: stream })
          )
          done()
        })
      })

      it('should dispatch aiKnowledgeVectorDbContextsLoadingFailed on failed loadContextsById$', (done) => {
        aiContextService.searchAIContexts.mockReturnValue(throwError(() => 'fail'))
        actions$.next(AIKnowledgeVectorDbDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadContextsById$.subscribe((action) => {
          expect(action).toEqual(
            AIKnowledgeVectorDbDetailsActions.aiKnowledgeVectorDbContextsLoadingFailed({ error: 'fail' })
          )
          done()
        })
      })

      it('should load contexts and dispatch success action', (done) => {
        const mockContexts = [{ id: '1', name: 'Context 1' }]
        aiContextService.searchAIContexts.mockReturnValue(of({ stream: mockContexts } as any))

        actions$.next(AIKnowledgeVectorDbDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadContextsById$.subscribe((action) => {
          expect(aiContextService.searchAIContexts).toHaveBeenCalled()
          expect(action).toEqual(
            AIKnowledgeVectorDbDetailsActions.aiKnowledgeVectorDbContextsReceived({
              contexts: mockContexts
            })
          )
          done()
        })
      })

      it('should handle error when loading contexts fails', (done) => {
        const error = 'Failed to load contexts'
        aiContextService.searchAIContexts.mockReturnValue(throwError(() => error))

        actions$.next(AIKnowledgeVectorDbDetailsActions.navigatedToDetailsPage({ id: '123' }))

        effects.loadContextsById$.subscribe((action) => {
          expect(aiContextService.searchAIContexts).toHaveBeenCalled()
          expect(action).toEqual(
            AIKnowledgeVectorDbDetailsActions.aiKnowledgeVectorDbContextsLoadingFailed({
              error
            })
          )
          done()
        })
      })
    })

    describe('cancelButtonClick', () => {
      it('should dispatch cancelEditNotDirty if cancelButtonClicked with dirty=false', (done) => {
        actions$.next(AIKnowledgeVectorDbDetailsActions.cancelButtonClicked({ dirty: false }))
        effects.cancelButtonNotDirty$.subscribe((action) => {
          expect(action).toEqual(AIKnowledgeVectorDbDetailsActions.cancelEditNotDirty())
          done()
        })
      })

      it('should dispatch cancelEditBackClicked if dialogResult.button is secondary', (done) => {
        portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary', result: [] }))
        actions$.next(AIKnowledgeVectorDbDetailsActions.cancelButtonClicked({ dirty: true }))
        effects.cancelButtonClickedDirty$.subscribe((action) => {
          expect(action).toEqual(AIKnowledgeVectorDbDetailsActions.cancelEditBackClicked())
          done()
        })
      })

      it('should dispatch cancelEditConfirmClicked if dialogResult.button is not secondary', (done) => {
        portalDialogService.openDialog.mockReturnValue(of({ button: 'primary', result: [] }))
        actions$.next(AIKnowledgeVectorDbDetailsActions.cancelButtonClicked({ dirty: true }))
        effects.cancelButtonClickedDirty$.subscribe((action) => {
          expect(action).toEqual(AIKnowledgeVectorDbDetailsActions.cancelEditConfirmClicked())
          done()
        })
      })

      it('should handle secondary button click in dialog - dirty', (done) => {
        portalDialogService.openDialog.mockReturnValue(of({ button: 'secondary' } as any))

        actions$.next(AIKnowledgeVectorDbDetailsActions.cancelButtonClicked({ dirty: true }))

        effects.cancelButtonClickedDirty$.subscribe((action) => {
          expect(portalDialogService.openDialog).toHaveBeenCalled()
          expect(action).toEqual(AIKnowledgeVectorDbDetailsActions.cancelEditBackClicked())
          done()
        })
      })

      it('should handle primary button click in dialog - dirty', (done) => {
        portalDialogService.openDialog.mockReturnValue(of({ button: 'primary' } as any))

        actions$.next(AIKnowledgeVectorDbDetailsActions.cancelButtonClicked({ dirty: true }))

        effects.cancelButtonClickedDirty$.subscribe((action) => {
          expect(portalDialogService.openDialog).toHaveBeenCalled()
          expect(action).toEqual(AIKnowledgeVectorDbDetailsActions.cancelEditConfirmClicked())
          done()
        })
      })
    })

    describe('displayError$', () => {
      const testCases = [
        {
          description: 'should show error message for details loading failure',
          action: AIKnowledgeVectorDbDetailsActions.aiKnowledgeVectorDbDetailsLoadingFailed({
            error: 'Test error'
          }),
          expectedKey: 'AI_KNOWLEDGE_VECTOR_DB_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
        },
        {
          description: 'should show error message for contexts loading failure',
          action: AIKnowledgeVectorDbDetailsActions.aiKnowledgeVectorDbContextsLoadingFailed({
            error: 'Test error'
          }),
          expectedKey: 'AI_KNOWLEDGE_VECTOR_DB_DETAILS.ERROR_MESSAGES.CONTEXTS_LOADING_FAILED'
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
        const action = AIKnowledgeVectorDbDetailsActions.navigateBackButtonClicked()

        actions$.next(action)

        effects.navigateBack$.subscribe((result) => {
          expect(backSpy).toHaveBeenCalled()
          expect(result).toEqual(AIKnowledgeVectorDbDetailsActions.backNavigationStarted())
          done()
        })
      })

      it('should dispatch backNavigationFailed when back navigation is not possible', (done) => {
        store.overrideSelector(selectBackNavigationPossible, false)
        const action = AIKnowledgeVectorDbDetailsActions.navigateBackButtonClicked()

        actions$.next(action)

        effects.navigateBack$.subscribe((result) => {
          expect(backSpy).not.toHaveBeenCalled()
          expect(result).toEqual(AIKnowledgeVectorDbDetailsActions.backNavigationFailed())
          done()
        })
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
    const pageHeader = await AIKnowledgeVectorDbDetails.getHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Details')
    expect(await searchBreadcrumbItem!.getText()).toEqual('Details')
  })

  it('should display translated headers', async () => {
    const pageHeader = await AIKnowledgeVectorDbDetails.getHeader()
    expect(await pageHeader.getHeaderText()).toEqual('AIKnowledgeVectorDb Details')
    expect(await pageHeader.getSubheaderText()).toEqual('Display of AIKnowledgeVectorDb Details')
  })

  it('should have 2 inline actions', async () => {
    const pageHeader = await AIKnowledgeVectorDbDetails.getHeader()
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

    const pageHeader = await AIKnowledgeVectorDbDetails.getHeader()
    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    store.scannedActions$.pipe(ofType(AIKnowledgeVectorDbDetailsActions.navigateBackButtonClicked)).subscribe(() => {
      doneFn()
    })
    await backAction?.click()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should display item details in form fields', async () => {
    store.overrideSelector(selectAIKnowledgeVectorDbDetailsViewModel, baseAIKnowledgeVectorDbDetailsViewModel)
    store.refreshState()

    fixture.detectChanges()
    await fixture.whenStable()

    if (!component.formGroup) {
      component.ngOnInit()
      fixture.detectChanges()
      await fixture.whenStable()
    }

    const pageDetails = component.formGroup.value
    expect(pageDetails).toEqual({
      ...baseAIKnowledgeVectorDbDetailsViewModel.details,
      aiContext: component.getContextFormValue(
        baseAIKnowledgeVectorDbDetailsViewModel.details?.aiContext
          ? [baseAIKnowledgeVectorDbDetailsViewModel.details?.aiContext]
          : []
      )[0]
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

    const pageHeader = await AIKnowledgeVectorDbDetails.getHeader()
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
      ...baseAIKnowledgeVectorDbDetailsViewModel,
      editMode: false
    }
    store.overrideSelector(selectAIKnowledgeVectorDbDetailsViewModel, viewModelView)
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    expect(component.formGroup.disabled).toBeTruthy()

    const viewModelEdit = {
      ...baseAIKnowledgeVectorDbDetailsViewModel,
      editMode: true
    }
    store.overrideSelector(selectAIKnowledgeVectorDbDetailsViewModel, viewModelEdit)
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    expect(component.formGroup.enabled).toBeTruthy()
  })

  it('should show the correct actions for edit and view modes', async () => {
    const viewModelView = {
      ...baseAIKnowledgeVectorDbDetailsViewModel,
      editMode: false
    }
    store.overrideSelector(selectAIKnowledgeVectorDbDetailsViewModel, viewModelView)
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    let actions: any[] = []
    component.headerActions$.subscribe((a) => (actions = a))
    const visibleActionsView = actions.filter((a) => a.showCondition)
    const actionLabelsView = visibleActionsView.map((a) => a.labelKey)
    expect(actionLabelsView).toContain('AI_KNOWLEDGE_BASE_DETAILS.GENERAL.BACK')
    expect(actionLabelsView).toContain('AI_KNOWLEDGE_VECTOR_DB_DETAILS.GENERAL.EDIT')
    expect(actionLabelsView).not.toContain('AI_KNOWLEDGE_BASE_DETAILS.GENERAL.SAVE')
    expect(actionLabelsView).not.toContain('AI_KNOWLEDGE_BASE_DETAILS.GENERAL.CANCEL')

    const viewModelEdit = {
      ...baseAIKnowledgeVectorDbDetailsViewModel,
      editMode: true
    }
    store.overrideSelector(selectAIKnowledgeVectorDbDetailsViewModel, viewModelEdit)
    store.refreshState()
    fixture.detectChanges()
    await fixture.whenStable()
    actions = []
    component.headerActions$.subscribe((a) => (actions = a))
    const visibleActionsEdit = actions.filter((a) => a.showCondition)
    const actionLabelsEdit = visibleActionsEdit.map((a) => a.labelKey)
    expect(actionLabelsEdit).toContain('AI_KNOWLEDGE_BASE_DETAILS.GENERAL.SAVE')
    expect(actionLabelsEdit).toContain('AI_KNOWLEDGE_BASE_DETAILS.GENERAL.CANCEL')
    expect(actionLabelsEdit).not.toContain('AI_KNOWLEDGE_BASE_DETAILS.GENERAL.BACK')
    expect(actionLabelsEdit).not.toContain('AI_KNOWLEDGE_VECTOR_DB_DETAILS.GENERAL.EDIT')
  })

  it('should dispatch edit action when edit() is called', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    component.edit()
    expect(dispatchSpy).toHaveBeenCalledWith(AIKnowledgeVectorDbDetailsActions.editButtonClicked())
  })

  it('should dispatch navigate back action when goBack() is called', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    component.goBack()
    expect(dispatchSpy).toHaveBeenCalledWith(AIKnowledgeVectorDbDetailsActions.navigateBackButtonClicked())
  })

  it('should dispatch cancel action with dirty state when cancel() is called', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    component.formGroup.markAsDirty()
    component.cancel()
    expect(dispatchSpy).toHaveBeenCalledWith(AIKnowledgeVectorDbDetailsActions.cancelButtonClicked({ dirty: true }))
  })

  it('should dispatch save action with form values when save() is called', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    component.formGroup.setValue({
      id: 'id',
      name: 'name',
      description: 'desc',
      vdb: 'vdb',
      vdbCollection: 'coll',
      aiContext: { label: 'context', value: { id: 'test' } }
    })
    component.save()
    expect(dispatchSpy).toHaveBeenCalledWith(
      AIKnowledgeVectorDbDetailsActions.saveButtonClicked({
        details: {
          id: 'id',
          name: 'name',
          description: 'desc',
          vdb: 'vdb',
          vdbCollection: 'coll',
          aiContext: { id: 'test' }
        }
      })
    )
  })

  it('should dispatch delete action when delete() is called', () => {
    const dispatchSpy = jest.spyOn(store, 'dispatch')
    component.delete()
    expect(dispatchSpy).toHaveBeenCalledWith(AIKnowledgeVectorDbDetailsActions.deleteButtonClicked())
  })

  it('should call breadcrumbService.setItems on ngOnInit', () => {
    const breadcrumbSpy = jest.spyOn(breadcrumbService, 'setItems')
    component.ngOnInit()
    expect(breadcrumbSpy).toHaveBeenCalledWith([
      {
        titleKey: 'AI_KNOWLEDGE_VECTOR_DB_DETAILS.BREADCRUMB',
        labelKey: 'AI_KNOWLEDGE_VECTOR_DB_DETAILS.BREADCRUMB',
        routerLink: '/ai-knowledge-vector-db'
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
      ...baseAIKnowledgeVectorDbDetailsViewModel,
      editMode: false
    }
    store.overrideSelector(selectAIKnowledgeVectorDbDetailsViewModel, viewModelView)
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
      ...baseAIKnowledgeVectorDbDetailsViewModel,
      editMode: true
    }
    store.overrideSelector(selectAIKnowledgeVectorDbDetailsViewModel, viewModelEdit)
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
    expect(dispatchSpy).toHaveBeenCalledWith(AIKnowledgeVectorDbDetailsActions.cancelButtonClicked({ dirty: false }))
  })

  it('should patch the form with details and matched context', () => {
    const context = { id: 'ctx1', name: 'Context 1' } as any
    const details = { ...baseAIKnowledgeVectorDbDetailsViewModel.details, aiContext: context } as any
    const viewModel = {
      ...baseAIKnowledgeVectorDbDetailsViewModel,
      details,
      editMode: false,
      contexts: [context]
    } as any
    store.overrideSelector(selectAIKnowledgeVectorDbDetailsViewModel, viewModel)
    store.refreshState()
    fixture.detectChanges()
    expect(component.formGroup.value.id).toBe(details.id)
    expect(component.formGroup.value.aiContext.value).toEqual(context)
  })

  it('should emit correct displayContexts$ for details with aiContext', (done) => {
    const context = { value: [{ id: 'ctx1' }], name: 'Context 1' } as any
    const details = { ...baseAIKnowledgeVectorDbDetailsViewModel.details, aiContext: context } as any
    const viewModel = { ...baseAIKnowledgeVectorDbDetailsViewModel, details, contexts: [context] } as any
    store.overrideSelector(selectAIKnowledgeVectorDbDetailsViewModel, viewModel)
    store.refreshState()
    fixture.detectChanges()
    component.displayContexts$.subscribe((contexts) => {
      expect(contexts.length).toBeGreaterThan(0)
      expect(contexts[0].value).toEqual(context)
      done()
    })
  })

  it('should handle missing details gracefully', () => {
    const viewModel = { ...baseAIKnowledgeVectorDbDetailsViewModel, details: undefined } as any
    store.overrideSelector(selectAIKnowledgeVectorDbDetailsViewModel, viewModel)
    store.refreshState()
    fixture.detectChanges()
    expect(component.formGroup.value.id).toBe('')
  })

  it('should handle empty contexts array gracefully', () => {
    const details = { ...baseAIKnowledgeVectorDbDetailsViewModel.details, aiContext: { name: '', value: {} } } as any
    const viewModel = { ...baseAIKnowledgeVectorDbDetailsViewModel, details, contexts: [] } as any
    store.overrideSelector(selectAIKnowledgeVectorDbDetailsViewModel, viewModel)
    store.refreshState()
    fixture.detectChanges()
    expect(component.formGroup.value.aiContext).toStrictEqual({ label: 'undefined:', value: { name: '', value: {} } })
  })

  describe('AIKnowledgeVectorDbDetailsReducer (integration)', () => {
    it('should return the initial state for an unknown action', () => {
      const action = { type: 'Unknown' } as any
      const state = AIKnowledgeVectorDbDetailsReducer(undefined, action)
      expect(state).toBe(initialState)
    })

    it('should handle aiKnowledgeVectorDbDetailsReceived', () => {
      const details = {
        id: '1',
        name: 'Test',
        description: '',
        aiContext: { id: 'ctx', name: 'Context' },
        vdb: '',
        vdbCollection: '',
        modificationCount: 0
      }
      const action = AIKnowledgeVectorDbDetailsActions.aiKnowledgeVectorDbDetailsReceived({ details })
      const state = AIKnowledgeVectorDbDetailsReducer(initialState, action)
      expect(state.details).toEqual(details)
      expect(state.detailsLoadingIndicator).toBe(false)
      expect(state.detailsLoaded).toBe(true)
    })

    it('should handle aiKnowledgeVectorDbDetailsLoadingFailed', () => {
      const preState: AIKnowledgeVectorDbDetailsState = {
        ...initialState,
        details: {
          id: '2',
          name: 'Old',
          description: '',
          aiContext: { id: 'ctx', name: 'Context' },
          vdb: '',
          vdbCollection: '',
          modificationCount: 0
        },
        detailsLoadingIndicator: true,
        detailsLoaded: true
      }
      const action = AIKnowledgeVectorDbDetailsActions.aiKnowledgeVectorDbDetailsLoadingFailed({ error: null })
      const state = AIKnowledgeVectorDbDetailsReducer(preState, action)
      expect(state.details).toEqual(initialState.details)
      expect(state.detailsLoadingIndicator).toBe(false)
      expect(state.detailsLoaded).toBe(false)
    })

    it('should handle aiKnowledgeVectorDbContextsReceived', () => {
      const contexts = [{ id: 'ctx1', name: 'Context 1' }]
      const action = AIKnowledgeVectorDbDetailsActions.aiKnowledgeVectorDbContextsReceived({ contexts })
      const state = AIKnowledgeVectorDbDetailsReducer(initialState, action)
      expect(state.contexts).toEqual(contexts)
      expect(state.contextsLoadingIndicator).toBe(false)
      expect(state.contextsLoaded).toBe(true)
    })

    it('should handle aiKnowledgeVectorDbContextsLoadingFailed', () => {
      const preState: AIKnowledgeVectorDbDetailsState = {
        ...initialState,
        contexts: [{ id: 'ctx2', name: 'Old Context' }],
        contextsLoadingIndicator: true,
        contextsLoaded: true
      }
      const action = AIKnowledgeVectorDbDetailsActions.aiKnowledgeVectorDbContextsLoadingFailed({ error: null })
      const state = AIKnowledgeVectorDbDetailsReducer(preState, action)
      expect(state.contexts).toEqual(initialState.contexts)
      expect(state.contextsLoadingIndicator).toBe(false)
      expect(state.contextsLoaded).toBe(false)
    })

    it('should handle navigatedToDetailsPage', () => {
      const preState: AIKnowledgeVectorDbDetailsState = {
        ...initialState,
        details: {
          id: '2',
          name: 'Old',
          description: '',
          aiContext: { id: 'ctx', name: 'Context' },
          vdb: '',
          vdbCollection: '',
          modificationCount: 0
        },
        editMode: true
      }
      const action = AIKnowledgeVectorDbDetailsActions.navigatedToDetailsPage({ id: undefined })
      const state = AIKnowledgeVectorDbDetailsReducer(preState, action)
      expect(state).toEqual(initialState)
    })

    it('should handle editButtonClicked', () => {
      const action = AIKnowledgeVectorDbDetailsActions.editButtonClicked()
      const state = AIKnowledgeVectorDbDetailsReducer(initialState, action)
      expect(state.editMode).toBe(true)
    })

    it('should handle saveButtonClicked', () => {
      const details = {
        id: '3',
        name: 'Save',
        description: '',
        aiContext: { id: 'ctx', name: 'Context' },
        vdb: '',
        vdbCollection: '',
        modificationCount: 0
      }
      const action = AIKnowledgeVectorDbDetailsActions.saveButtonClicked({ details })
      const state = AIKnowledgeVectorDbDetailsReducer(initialState, action)
      expect(state.details).toEqual(details)
      expect(state.editMode).toBe(false)
      expect(state.isSubmitting).toBe(true)
    })

    it('should handle navigateBackButtonClicked', () => {
      const action = AIKnowledgeVectorDbDetailsActions.navigateBackButtonClicked()
      const state = AIKnowledgeVectorDbDetailsReducer(initialState, action)
      expect(state).toEqual(initialState)
    })

    it('should handle cancelEditConfirmClicked and related actions', () => {
      const actions = [
        AIKnowledgeVectorDbDetailsActions.cancelEditConfirmClicked(),
        AIKnowledgeVectorDbDetailsActions.cancelEditNotDirty(),
        AIKnowledgeVectorDbDetailsActions.updateAIKnowledgeVectorDbCancelled(),
        AIKnowledgeVectorDbDetailsActions.updateAIKnowledgeVectorDbSucceeded()
      ]
      actions.forEach((action) => {
        const preState: AIKnowledgeVectorDbDetailsState = { ...initialState, editMode: true, isSubmitting: true }
        const state = AIKnowledgeVectorDbDetailsReducer(preState, action)
        expect(state.editMode).toBe(false)
        expect(state.isSubmitting).toBe(false)
      })
    })

    it('should handle updateAIKnowledgeVectorDbFailed', () => {
      const preState: AIKnowledgeVectorDbDetailsState = { ...initialState, isSubmitting: true }
      const action = AIKnowledgeVectorDbDetailsActions.updateAIKnowledgeVectorDbFailed({ error: null })
      const state = AIKnowledgeVectorDbDetailsReducer(preState, action)
      expect(state.isSubmitting).toBe(false)
    })
  })

  describe('AIKnowledgeVectorDbDetails Selectors', () => {
    const baseState: any = {
      details: {
        id: '1',
        name: 'Test',
        aiContext: { id: 'ctx', name: 'Context' },
        vdb: '',
        vdbCollection: '',
        modificationCount: 0
      },
      contexts: [{ id: 'ctx', name: 'Context' }],
      detailsLoaded: true,
      detailsLoadingIndicator: false,
      contextsLoaded: true,
      contextsLoadingIndicator: false,
      backNavigationPossible: true,
      editMode: false,
      isSubmitting: false
    }

    it('should select the full view model', () => {
      const result = selectAIKnowledgeVectorDbDetailsViewModel.projector(
        baseState.details,
        baseState.contexts,
        baseState.detailsLoaded,
        baseState.detailsLoadingIndicator,
        baseState.contextsLoaded,
        baseState.contextsLoadingIndicator,
        true,
        baseState.editMode,
        baseState.isSubmitting
      )

      expect(result).toEqual({
        details: baseState.details,
        contexts: baseState.contexts,
        detailsLoaded: true,
        detailsLoadingIndicator: false,
        contextsLoaded: true,
        contextsLoadingIndicator: false,
        backNavigationPossible: true,
        editMode: false,
        isSubmitting: false
      })
    })

    it('should handle undefined details and empty contexts', () => {
      const result = selectAIKnowledgeVectorDbDetailsViewModel.projector(
        undefined,
        [],
        false,
        true,
        false,
        true,
        false,
        true,
        false
      )
      expect(result.details).toBeUndefined()
      expect(result.contexts).toEqual([])
      expect(result.detailsLoaded).toBe(false)
      expect(result.detailsLoadingIndicator).toBe(true)
    })
  })
})
