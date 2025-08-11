import { TestBed } from '@angular/core/testing'
import { ActivatedRoute, Router } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { ReplaySubject, of, throwError } from 'rxjs'
import { AIContextBffService } from '../../../shared/generated'
import { ExportDataService, PortalMessageService, PortalDialogService } from '@onecx/portal-integration-angular'
import { AiContextSearchEffects } from './ai-context-search.effects'
import { AiContextSearchActions } from './ai-context-search.actions'
import { aiContextSearchSelectors, selectAiContextSearchViewModel } from './ai-context-search.selectors'
import { AiContextSearchCriteria } from './ai-context-search.parameters'
import { initialState } from './ai-context-search.reducers'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { AiContextSearchViewModel } from './ai-context-search.viewmodel'
import { AiContextCreateUpdateComponent } from './dialogs/ai-context-create-update/ai-context-create-update.component'

describe('AiContextSearchEffects', () => {
  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }

  let actions$: ReplaySubject<unknown>
  let effects: AiContextSearchEffects
  let store: MockStore<Store>
  let router: jest.Mocked<Router>
  let route: ActivatedRoute
  let aiContextService: jest.Mocked<AIContextBffService>
  let portalDialogService: jest.Mocked<PortalDialogService>
  let messageService: jest.Mocked<PortalMessageService>
  let exportDataService: jest.Mocked<ExportDataService>

  const mockCriteria: AiContextSearchCriteria = {
    appId: 'test-app',
    name: 'test-name',
    description: 'test-description'
  }

  beforeEach(async () => {
    actions$ = new ReplaySubject(1)

    aiContextService = {
      searchAIContexts: jest.fn(),
      createAIContext: jest.fn(),
      updateAIContext: jest.fn(),
      deleteAIContext: jest.fn()
    } as unknown as jest.Mocked<AIContextBffService>

    router = {
      navigate: jest.fn().mockReturnValue(Promise.resolve(true)),
      parseUrl: jest.fn().mockImplementation((url: string) => {
        const urlParts = url.split('?')[0]
        return {
          queryParams: {},
          fragment: null,
          toString: () => urlParts
        }
      }),
      events: of()
    } as unknown as jest.Mocked<Router>

    portalDialogService = {
      openDialog: jest.fn()
    } as unknown as jest.Mocked<PortalDialogService>

    messageService = {
      success: jest.fn(),
      error: jest.fn()
    } as unknown as jest.Mocked<PortalMessageService>

    exportDataService = {
      exportCsv: jest.fn()
    } as unknown as jest.Mocked<ExportDataService>

    route = {
      queryParams: of({
        appId: 'test-app',
        name: 'test-name',
        description: 'test-description'
      }),
      snapshot: {
        queryParams: {}
      }
    } as unknown as ActivatedRoute

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AiContextSearchEffects,
        provideMockStore({
          initialState: { aiContextSearch: initialState }
        }),
        provideMockActions(() => actions$),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: route },
        { provide: AIContextBffService, useValue: aiContextService },
        { provide: PortalDialogService, useValue: portalDialogService },
        { provide: PortalMessageService, useValue: messageService },
        { provide: ExportDataService, useValue: exportDataService }
      ]
    }).compileComponents()

    effects = TestBed.inject(AiContextSearchEffects)
    store = TestBed.inject(MockStore)
  })

  describe('syncParamsToUrl$', () => {
    beforeEach(() => {
      store.overrideSelector(aiContextSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()
    })

    it('should navigate to update URL when criteria differs from query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')

      route.queryParams = of({
        appId: 'different-app',
        name: 'different-name',
        description: 'different-description'
      })

      actions$.next(AiContextSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))

      effects.syncParamsToUrl$.subscribe(() => {
        expect(navigateSpy).toHaveBeenCalledWith([], {
          relativeTo: route,
          queryParams: mockCriteria,
          replaceUrl: true,
          onSameUrlNavigation: 'ignore'
        })
        done()
      })
    })

    it('should not navigate when criteria matches query params', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')

      route.queryParams = of(mockCriteria)

      actions$.next(AiContextSearchActions.searchButtonClicked({ searchCriteria: mockCriteria }))

      effects.syncParamsToUrl$.subscribe(() => {
        expect(navigateSpy).not.toHaveBeenCalled()
        done()
      })
    })

    it('should navigate when resetButtonClicked action is triggered', (done) => {
      const navigateSpy = jest.spyOn(router, 'navigate')

      route.queryParams = of({
        appId: 'different-app'
      })

      actions$.next(AiContextSearchActions.resetButtonClicked())

      effects.syncParamsToUrl$.subscribe(() => {
        expect(navigateSpy).toHaveBeenCalledWith([], {
          relativeTo: route,
          queryParams: mockCriteria,
          replaceUrl: true,
          onSameUrlNavigation: 'ignore'
        })
        done()
      })
    })
  })

  describe('detailsButtonClicked$', () => {
    beforeEach(() => {
      store.overrideSelector(selectUrl, '/search?param=value#fragment')
      store.refreshState()
    })

    it('should navigate to details page with correct URL structure', (done) => {
      const testId = 'test-123'
      const navigateSpy = jest.spyOn(router, 'navigate')

      actions$.next(AiContextSearchActions.detailsButtonClicked({ id: testId }))

      effects.detailsButtonClicked$.subscribe(() => {
        expect(navigateSpy).toHaveBeenCalledWith(['/search', 'details', testId])
        done()
      })
    })

    it('should clear query params and fragment from URL', (done) => {
      const testId = 'test-456'
      const parseUrlSpy = jest.spyOn(router, 'parseUrl')

      const mockUrlTree = {
        toString: jest.fn(() => '/search'),
        queryParams: { param: 'value' },
        fragment: 'fragment'
      }

      parseUrlSpy.mockReturnValue(mockUrlTree as never)

      actions$.next(AiContextSearchActions.detailsButtonClicked({ id: testId }))

      effects.detailsButtonClicked$.subscribe(() => {
        expect(mockUrlTree.queryParams).toEqual({})
        expect(mockUrlTree.fragment).toBeNull()
        done()
      })
    })
  })

  describe('searchByUrl$', () => {
    beforeEach(() => {
      store.overrideSelector(aiContextSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      aiContextService.searchAIContexts.mockReturnValue(
        of({
          stream: [{ id: '1', name: 'Test Context' }],
          size: 10,
          number: 0,
          totalElements: 1,
          totalPages: 1
        }) as never
      )
    })

    it('should call performSearch and dispatch aiContextSearchResultsReceived on successful search', (done) => {
      effects.performSearch(mockCriteria).subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.aiContextSearchResultsReceived.type)
        expect(action).toEqual(
          AiContextSearchActions.aiContextSearchResultsReceived({
            stream: [{ id: '1', name: 'Test Context' }],
            size: 10,
            number: 0,
            totalElements: 1,
            totalPages: 1
          })
        )
        done()
      })
    })

    it('should dispatch aiContextSearchResultsLoadingFailed on search error', (done) => {
      const mockError = 'Search failed'

      aiContextService.searchAIContexts.mockReturnValue(throwError(() => mockError))

      effects.performSearch(mockCriteria).subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.aiContextSearchResultsLoadingFailed.type)
        expect(action).toEqual(
          AiContextSearchActions.aiContextSearchResultsLoadingFailed({
            error: mockError
          })
        )
        done()
      })
    })

    it('should handle Date objects in search criteria', (done) => {
      const criteriaWithDate = {
        ...mockCriteria,
        startDate: new Date('2023-01-01'),
        endDate: new Date('2023-12-31')
      }

      const searchSpy = jest.spyOn(aiContextService, 'searchAIContexts')

      effects.performSearch(criteriaWithDate).subscribe(() => {
        expect(searchSpy).toHaveBeenCalledWith({
          ...mockCriteria,
          startDate: '2023-01-01T00:00:00.000Z',
          endDate: '2023-12-31T00:00:00.000Z'
        })
        done()
      })
    })
  })

  describe('refreshSearchAfterCreateUpdate$', () => {
    beforeEach(() => {
      store.overrideSelector(aiContextSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      aiContextService.searchAIContexts.mockReturnValue(
        of({
          stream: [{ id: '2', name: 'Updated Context' }],
          size: 10,
          number: 0,
          totalElements: 1,
          totalPages: 1
        }) as never
      )
    })

    it('should trigger search when createAiContextSucceeded action is dispatched', (done) => {
      actions$.next(AiContextSearchActions.createAiContextSucceeded())

      effects.refreshSearchAfterCreateUpdate$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.aiContextSearchResultsReceived.type)
        expect(action).toEqual(
          AiContextSearchActions.aiContextSearchResultsReceived({
            stream: [{ id: '2', name: 'Updated Context' }],
            size: 10,
            number: 0,
            totalElements: 1,
            totalPages: 1
          })
        )
        done()
      })
    })

    it('should trigger search when updateAiContextSucceeded action is dispatched', (done) => {
      actions$.next(AiContextSearchActions.updateAiContextSucceeded())

      effects.refreshSearchAfterCreateUpdate$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.aiContextSearchResultsReceived.type)
        expect(action).toEqual(
          AiContextSearchActions.aiContextSearchResultsReceived({
            stream: [{ id: '2', name: 'Updated Context' }],
            size: 10,
            number: 0,
            totalElements: 1,
            totalPages: 1
          })
        )
        done()
      })
    })

    it('should handle search errors properly', (done) => {
      const mockError = 'Refresh search failed'

      aiContextService.searchAIContexts.mockReturnValue(throwError(() => mockError))

      actions$.next(AiContextSearchActions.createAiContextSucceeded())

      effects.refreshSearchAfterCreateUpdate$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.aiContextSearchResultsLoadingFailed.type)
        expect(action).toEqual(
          AiContextSearchActions.aiContextSearchResultsLoadingFailed({
            error: mockError
          })
        )
        done()
      })
    })
  })

  describe('editButtonClicked$', () => {
    const mockAiContext = {
      id: 'test-123',
      name: 'Test Context',
      description: 'Test Description'
    }

    const mockResults = [mockAiContext, { id: 'other-id', name: 'Other Context' }]

    beforeEach(() => {
      store.overrideSelector(aiContextSearchSelectors.selectResults, mockResults)
      store.refreshState()
    })

    it('should open dialog and dispatch updateAiContextSucceeded on successful update', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: { ...mockAiContext, name: 'Updated Context' }
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      aiContextService.updateAIContext.mockReturnValue(of({}) as never)

      const messageSuccessSpy = jest.spyOn(messageService, 'success')

      actions$.next(AiContextSearchActions.editAiContextButtonClicked({ id: 'test-123' }))

      effects.editButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.updateAiContextSucceeded.type)
        expect(aiContextService.updateAIContext).toHaveBeenCalledWith('test-123', {
          aiContextData: mockDialogResult.result
        })
        expect(messageSuccessSpy).toHaveBeenCalledWith({
          summaryKey: 'AI_CONTEXT_CREATE_UPDATE.UPDATE.SUCCESS'
        })
        done()
      })
    })

    it('should dispatch updateAiContextCancelled when dialog is cancelled', (done) => {
      const mockDialogResult = {
        button: 'secondary',
        result: null
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      actions$.next(AiContextSearchActions.editAiContextButtonClicked({ id: 'test-123' }))

      effects.editButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.updateAiContextCancelled.type)
        expect(aiContextService.updateAIContext).not.toHaveBeenCalled()
        done()
      })
    })

    it('should dispatch updateAiContextCancelled when dialog result is null', (done) => {
      const mockDialogResult = null

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      actions$.next(AiContextSearchActions.editAiContextButtonClicked({ id: 'test-123' }))

      effects.editButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.updateAiContextCancelled.type)
        expect(aiContextService.updateAIContext).not.toHaveBeenCalled()
        done()
      })
    })

    it('should dispatch updateAiContextFailed when API call fails', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: { ...mockAiContext, name: 'Updated Context' }
      }
      const mockError = 'Update failed'

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)
      aiContextService.updateAIContext.mockReturnValue(throwError(() => mockError))

      const messageErrorSpy = jest.spyOn(messageService, 'error')

      actions$.next(AiContextSearchActions.editAiContextButtonClicked({ id: 'test-123' }))

      effects.editButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.updateAiContextFailed.type)
        expect(action).toEqual(AiContextSearchActions.updateAiContextFailed({ error: mockError }))
        expect(messageErrorSpy).toHaveBeenCalledWith({
          summaryKey: 'AI_CONTEXT_CREATE_UPDATE.UPDATE.ERROR'
        })
        done()
      })
    })

    it('should throw error when dialog result is missing', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: null
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      const messageErrorSpy = jest.spyOn(messageService, 'error')

      actions$.next(AiContextSearchActions.editAiContextButtonClicked({ id: 'test-123' }))

      effects.editButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.updateAiContextFailed.type)
        expect(messageErrorSpy).toHaveBeenCalledWith({
          summaryKey: 'AI_CONTEXT_CREATE_UPDATE.UPDATE.ERROR'
        })
        done()
      })
    })

    it('should throw error when item ID is missing from dialog result', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: { name: 'Updated Context' }
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      const messageErrorSpy = jest.spyOn(messageService, 'error')

      actions$.next(AiContextSearchActions.editAiContextButtonClicked({ id: 'test-123' }))

      effects.editButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.updateAiContextFailed.type)
        expect(messageErrorSpy).toHaveBeenCalledWith({
          summaryKey: 'AI_CONTEXT_CREATE_UPDATE.UPDATE.ERROR'
        })
        done()
      })
    })

    it('should pass correct item to dialog based on action id', (done) => {
      const mockDialogResult = {
        button: 'secondary',
        result: null
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)
      actions$.next(AiContextSearchActions.editAiContextButtonClicked({ id: 'test-123' }))

      effects.editButtonClicked$.subscribe(() => {
        expect(portalDialogService.openDialog).toHaveBeenCalledWith(
          'AI_CONTEXT_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: expect.anything(),
            inputs: {
              vm: {
                itemToEdit: mockAiContext
              }
            }
          },
          'AI_CONTEXT_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'AI_CONTEXT_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
        done()
      })
    })
  })

  describe('refreshSearchAfterDelete$', () => {
    beforeEach(() => {
      store.overrideSelector(aiContextSearchSelectors.selectCriteria, mockCriteria)
      store.refreshState()

      aiContextService.searchAIContexts.mockReturnValue(
        of({
          stream: [{ id: '3', name: 'Remaining Context' }],
          size: 10,
          number: 0,
          totalElements: 1,
          totalPages: 1
        }) as never
      )
    })

    it('should trigger search when deleteAiContextSucceeded action is dispatched', (done) => {
      actions$.next(AiContextSearchActions.deleteAiContextSucceeded())

      effects.refreshSearchAfterDelete$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.aiContextSearchResultsReceived.type)
        expect(action).toEqual(
          AiContextSearchActions.aiContextSearchResultsReceived({
            stream: [{ id: '3', name: 'Remaining Context' }],
            size: 10,
            number: 0,
            totalElements: 1,
            totalPages: 1
          })
        )
        done()
      })
    })

    it('should handle search errors properly after delete', (done) => {
      const mockError = 'Refresh search after delete failed'

      aiContextService.searchAIContexts.mockReturnValue(throwError(() => mockError))

      actions$.next(AiContextSearchActions.deleteAiContextSucceeded())

      effects.refreshSearchAfterDelete$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.aiContextSearchResultsLoadingFailed.type)
        expect(action).toEqual(
          AiContextSearchActions.aiContextSearchResultsLoadingFailed({
            error: mockError
          })
        )
        done()
      })
    })

    it('should use current search criteria from store', (done) => {
      const customCriteria = {
        appId: 'custom-app',
        name: 'custom-name',
        description: 'custom-desc'
      }

      store.overrideSelector(aiContextSearchSelectors.selectCriteria, customCriteria)
      store.refreshState()

      const searchSpy = jest.spyOn(aiContextService, 'searchAIContexts')

      actions$.next(AiContextSearchActions.deleteAiContextSucceeded())

      effects.refreshSearchAfterDelete$.subscribe(() => {
        expect(searchSpy).toHaveBeenCalledWith(customCriteria)
        done()
      })
    })
  })

  describe('deleteButtonClicked$', () => {
    const mockAiContext = {
      id: 'test-123',
      name: 'Test Context',
      description: 'Test Description'
    }

    const mockResults = [mockAiContext, { id: 'other-id', name: 'Other Context' }]

    beforeEach(() => {
      store.overrideSelector(aiContextSearchSelectors.selectResults, mockResults)
      store.refreshState()
    })

    it('should open confirmation dialog and dispatch deleteAiContextSucceeded on successful delete', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: null
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      aiContextService.deleteAIContext.mockReturnValue(of({}) as never)

      const messageSuccessSpy = jest.spyOn(messageService, 'success')

      actions$.next(AiContextSearchActions.deleteAiContextButtonClicked({ id: 'test-123' }))

      effects.deleteButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.deleteAiContextSucceeded.type)
        expect(aiContextService.deleteAIContext).toHaveBeenCalledWith('test-123')
        expect(messageSuccessSpy).toHaveBeenCalledWith({
          summaryKey: 'AI_CONTEXT_DELETE.SUCCESS'
        })
        done()
      })
    })

    it('should dispatch deleteAiContextCancelled when dialog is cancelled', (done) => {
      const mockDialogResult = {
        button: 'secondary',
        result: null
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      actions$.next(AiContextSearchActions.deleteAiContextButtonClicked({ id: 'test-123' }))

      effects.deleteButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.deleteAiContextCancelled.type)
        expect(aiContextService.deleteAIContext).not.toHaveBeenCalled()
        done()
      })
    })

    it('should dispatch deleteAiContextCancelled when dialog result is null', (done) => {
      const mockDialogResult = null

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      actions$.next(AiContextSearchActions.deleteAiContextButtonClicked({ id: 'test-123' }))

      effects.deleteButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.deleteAiContextCancelled.type)
        expect(aiContextService.deleteAIContext).not.toHaveBeenCalled()
        done()
      })
    })

    it('should dispatch deleteAiContextFailed when API call fails', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: null
      }
      const mockError = 'Delete failed'

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      aiContextService.deleteAIContext.mockReturnValue(throwError(() => mockError))

      const messageErrorSpy = jest.spyOn(messageService, 'error')

      actions$.next(AiContextSearchActions.deleteAiContextButtonClicked({ id: 'test-123' }))

      effects.deleteButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.deleteAiContextFailed.type)
        expect(action).toEqual(AiContextSearchActions.deleteAiContextFailed({ error: mockError }))
        expect(messageErrorSpy).toHaveBeenCalledWith({
          summaryKey: 'AI_CONTEXT_DELETE.ERROR'
        })
        done()
      })
    })

    it('should pass correct item to dialog and use correct dialog parameters', (done) => {
      const mockDialogResult = {
        button: 'secondary',
        result: null
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      actions$.next(AiContextSearchActions.deleteAiContextButtonClicked({ id: 'test-123' }))

      effects.deleteButtonClicked$.subscribe(() => {
        expect(portalDialogService.openDialog).toHaveBeenCalledWith(
          'AI_CONTEXT_DELETE.HEADER',
          'AI_CONTEXT_DELETE.MESSAGE',
          {
            key: 'AI_CONTEXT_DELETE.CONFIRM',
            icon: expect.anything()
          },
          {
            key: 'AI_CONTEXT_DELETE.CANCEL',
            icon: expect.anything()
          }
        )
        done()
      })
    })

    it('should handle case when item to delete is not found', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: null
      }

      const emptyResults = [{ id: 'other-id', name: 'Other Context' }]
      store.overrideSelector(aiContextSearchSelectors.selectResults, emptyResults)
      store.refreshState()

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      const messageErrorSpy = jest.spyOn(messageService, 'error')

      effects.deleteButtonClicked$.subscribe((action) => {
        expect(action.type).toEqual(AiContextSearchActions.deleteAiContextFailed.type)
        expect(messageErrorSpy).toHaveBeenCalledWith({
          summaryKey: 'AI_CONTEXT_DELETE.ERROR'
        })
        done()
      })

      actions$.next(AiContextSearchActions.deleteAiContextButtonClicked({ id: 'non-existent-id' }))
    })

    it('should find correct item to delete based on action id', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: null
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)
      aiContextService.deleteAIContext.mockReturnValue(of({}) as never)

      actions$.next(AiContextSearchActions.deleteAiContextButtonClicked({ id: 'test-123' }))

      effects.deleteButtonClicked$.subscribe(() => {
        expect(aiContextService.deleteAIContext).toHaveBeenCalledWith('test-123')
        done()
      })
    })
  })

  describe('createButtonClicked$', () => {
    it('should open create dialog with correct parameters', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: { name: 'New AI Context', description: 'Test description' }
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)
      aiContextService.createAIContext.mockReturnValue(of({}) as never)

      effects.createButtonClicked$.subscribe(() => {
        expect(portalDialogService.openDialog).toHaveBeenCalledWith(
          'AI_CONTEXT_CREATE_UPDATE.CREATE.HEADER',
          {
            type: AiContextCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: {}
              }
            }
          },
          'AI_CONTEXT_CREATE_UPDATE.CREATE.FORM.SAVE',
          'AI_CONTEXT_CREATE_UPDATE.CREATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
        done()
      })

      actions$.next(AiContextSearchActions.createAiContextButtonClicked())
    })

    it('should create AI context and dispatch success action when dialog returns primary button with result', (done) => {
      const mockAiContextData = { name: 'New AI Context', description: 'Test description' }
      const mockDialogResult = {
        button: 'primary',
        result: mockAiContextData
      }
      const expectedCreateRequest = {
        aiContextData: mockAiContextData
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)
      aiContextService.createAIContext.mockReturnValue(of({}) as never)

      effects.createButtonClicked$.subscribe((action) => {
        expect(aiContextService.createAIContext).toHaveBeenCalledWith(expectedCreateRequest)
        expect(messageService.success).toHaveBeenCalledWith({
          summaryKey: 'AI_CONTEXT_CREATE_UPDATE.CREATE.SUCCESS'
        })
        expect(action).toEqual(AiContextSearchActions.createAiContextSucceeded())
        done()
      })

      actions$.next(AiContextSearchActions.createAiContextButtonClicked())
    })

    it('should dispatch cancelled action when dialog is closed without result', (done) => {
      const mockDialogResult = null

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      effects.createButtonClicked$.subscribe((action) => {
        expect(aiContextService.createAIContext).not.toHaveBeenCalled()
        expect(action).toEqual(AiContextSearchActions.createAiContextCancelled())
        done()
      })

      actions$.next(AiContextSearchActions.createAiContextButtonClicked())
    })

    it('should dispatch cancelled action when dialog secondary button is clicked', (done) => {
      const mockDialogResult = {
        button: 'secondary',
        result: { name: 'Test', description: 'Test' }
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      effects.createButtonClicked$.subscribe((action) => {
        expect(aiContextService.createAIContext).not.toHaveBeenCalled()
        expect(action).toEqual(AiContextSearchActions.createAiContextCancelled())
        done()
      })

      actions$.next(AiContextSearchActions.createAiContextButtonClicked())
    })

    it('should handle error when dialog result is missing despite primary button', (done) => {
      const mockDialogResult = {
        button: 'primary',
        result: undefined
      }

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)

      effects.createButtonClicked$.subscribe((action) => {
        expect(messageService.error).toHaveBeenCalledWith({
          summaryKey: 'AI_CONTEXT_CREATE_UPDATE.CREATE.ERROR'
        })
        expect(action).toEqual(
          AiContextSearchActions.createAiContextFailed({
            error: expect.any(Error)
          })
        )
        done()
      })

      actions$.next(AiContextSearchActions.createAiContextButtonClicked())
    })

    it('should handle API error during creation', (done) => {
      const mockAiContextData = { name: 'New AI Context', description: 'Test description' }
      const mockDialogResult = {
        button: 'primary',
        result: mockAiContextData
      }
      const apiError = 'API Error'

      portalDialogService.openDialog.mockReturnValue(of(mockDialogResult) as never)
      aiContextService.createAIContext.mockReturnValue(throwError(() => apiError) as never)

      effects.createButtonClicked$.subscribe((action) => {
        expect(messageService.error).toHaveBeenCalledWith({
          summaryKey: 'AI_CONTEXT_CREATE_UPDATE.CREATE.ERROR'
        })
        expect(action).toEqual(
          AiContextSearchActions.createAiContextFailed({
            error: apiError
          })
        )
        done()
      })

      actions$.next(AiContextSearchActions.createAiContextButtonClicked())
    })
  })

  describe('exportData$', () => {
    it('should export CSV with correct parameters when export button is clicked', (done) => {
      const mockColumns = [
        { field: 'name', header: 'Name' },
        { field: 'description', header: 'Description' }
      ]
      const mockResults = [
        { id: '1', name: 'Context 1', description: 'Description 1' },
        { id: '2', name: 'Context 2', description: 'Description 2' }
      ]
      const mockViewModel = {
        resultComponentState: {
          displayedColumns: mockColumns
        },
        results: mockResults
      } as unknown as AiContextSearchViewModel

      store.overrideSelector(selectAiContextSearchViewModel, mockViewModel)

      effects.exportData$.subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(
          mockColumns,
          mockResults,
          'AIContext.csv'
        )
        done()
      })

      actions$.next(AiContextSearchActions.exportButtonClicked())
    })

    it('should handle export with empty displayed columns', (done) => {
      const mockResults = [
        { id: '1', name: 'Context 1', description: 'Description 1' }
      ]
      const mockViewModel = {
        resultComponentState: {
          displayedColumns: undefined
        },
        results: mockResults
      } as unknown as AiContextSearchViewModel

      store.overrideSelector(selectAiContextSearchViewModel, mockViewModel)

      effects.exportData$.subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(
          [],
          mockResults,
          'AIContext.csv'
        )
        done()
      })

      actions$.next(AiContextSearchActions.exportButtonClicked())
    })

    it('should handle export with null resultComponentState', (done) => {
      const mockResults = [
        { id: '1', name: 'Context 1', description: 'Description 1' }
      ]
      const mockViewModel = {
        resultComponentState: null,
        results: mockResults
      } as unknown as AiContextSearchViewModel

      store.overrideSelector(selectAiContextSearchViewModel, mockViewModel)

      effects.exportData$.subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(
          [],
          mockResults,
          'AIContext.csv'
        )
        done()
      })

      actions$.next(AiContextSearchActions.exportButtonClicked())
    })

    it('should handle export with empty results', (done) => {
      const mockColumns = [
        { field: 'name', header: 'Name' },
        { field: 'description', header: 'Description' }
      ]
      const mockViewModel = {
        resultComponentState: {
          displayedColumns: mockColumns
        },
        results: []
      } as unknown as AiContextSearchViewModel

      store.overrideSelector(selectAiContextSearchViewModel, mockViewModel)

      effects.exportData$.subscribe(() => {
        expect(exportDataService.exportCsv).toHaveBeenCalledWith(
          mockColumns,
          [],
          'AIContext.csv'
        )
        done()
      })

      actions$.next(AiContextSearchActions.exportButtonClicked())
    })
  })

  describe('displayError$', () => {
    it('should display error message when aiContextSearchResultsLoadingFailed action is dispatched', (done) => {
      effects.displayError$.subscribe(() => {
        expect(messageService.error).toHaveBeenCalledWith({
          summaryKey: 'AI_CONTEXT_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
        })
        done()
      })

      actions$.next(AiContextSearchActions.aiContextSearchResultsLoadingFailed({ error: 'Test error' }))
    })

    it('should not display error message for actions not in errorMessages array', (done) => {
      setTimeout(() => {
        expect(messageService.error).not.toHaveBeenCalled()
        done()
      }, 0)

      actions$.next(AiContextSearchActions.resetButtonClicked())
    })
  })
})
