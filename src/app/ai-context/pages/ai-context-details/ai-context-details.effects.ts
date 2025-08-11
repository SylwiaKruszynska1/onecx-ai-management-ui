import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { filterForNavigatedTo } from '@onecx/ngrx-accelerator'
import { DialogState, PortalDialogService, PortalMessageService } from '@onecx/portal-integration-angular'
import { PrimeIcons } from 'primeng/api'
import { catchError, filter, map, mergeMap, of, switchMap, tap } from 'rxjs'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'
import { selectRouteParam, selectUrl } from 'src/app/shared/selectors/router.selectors'
import {
  AIContext,
  AIContextBffService,
  AIProviderBffService,
  AiKnowledgeBaseBffService,
  AIProviderSearchRequest,
  UpdateAIContextRequest,
  AIKnowledgeVectorDbBffService,
  SearchAIKnowledgeBaseRequest,
  SearchAIKnowledgeVectorDbRequest
} from '../../../shared/generated'
import { AiContextDetailsActions } from './ai-context-details.actions'
import { AiContextDetailsComponent } from './ai-context-details.component'
import { aiContextDetailsSelectors } from './ai-context-details.selectors'
@Injectable()
export class AiContextDetailsEffects {
  constructor(
    private readonly actions$: Actions,
    private readonly aiContextService: AIContextBffService,
    private readonly aiProviderService: AIProviderBffService,
    private readonly aiKnowledgeBaseService: AiKnowledgeBaseBffService,
    private readonly aiKnowledgeVectorDB: AIKnowledgeVectorDbBffService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly messageService: PortalMessageService,
    private readonly portalDialogService: PortalDialogService
  ) {}

  navigatedToDetailsPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, AiContextDetailsComponent),
      concatLatestFrom(() => this.store.select(selectRouteParam('id'))),
      map(([, id]) => {
        return AiContextDetailsActions.navigatedToDetailsPage({
          id
        })
      })
    )
  })

  loadAiContextById$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiContextDetailsActions.navigatedToDetailsPage),
      switchMap(({ id }) =>
        this.aiContextService.getAIContextById(id ?? '').pipe(
          map(({ result }) =>
            AiContextDetailsActions.aiContextDetailsReceived({
              details: result
            })
          ),
          catchError((error) =>
            of(
              AiContextDetailsActions.aiContextDetailsLoadingFailed({
                error
              })
            )
          )
        )
      )
    )
  })

  loadAIKnowledgeBases$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiContextDetailsActions.navigatedToDetailsPage),
      switchMap(() => {
        const fetchAllReq: SearchAIKnowledgeBaseRequest = { name: '', description: '' }
        return this.aiKnowledgeBaseService.searchAIKnowledgeBases(fetchAllReq).pipe(
          map(({ stream }) =>
            AiContextDetailsActions.aiContextAiKnowledgeBasesReceived({
              aiKnowledgeBases: stream
            })
          ),
          catchError((error) =>
            of(
              AiContextDetailsActions.aiContextAiKnowledgeBasesLoadingFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  loadProviders$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiContextDetailsActions.navigatedToDetailsPage),
      switchMap(() => {
        const fetchAllReq: AIProviderSearchRequest = { id: undefined, appId: '', name: '', description: '' }
        return this.aiProviderService.searchAIProvider(fetchAllReq).pipe(
          map(({ results }) =>
            AiContextDetailsActions.aiContextProvidersReceived({
              providers: results
            })
          ),
          catchError((error) =>
            of(
              AiContextDetailsActions.aiContextProvidersLoadingFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  loadVectorDbs$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiContextDetailsActions.navigatedToDetailsPage),
      switchMap(() => {
        const fetchAllReq: SearchAIKnowledgeVectorDbRequest = { id: undefined, name: '', description: '' }
        return this.aiKnowledgeVectorDB.searchAIKnowledgeVectorDbs(fetchAllReq).pipe(
          map(({ results }) =>
            AiContextDetailsActions.aiContextAiKnowledgeVectorDbsReceived({
              aiKnowledgeVectorDbs: results
            })
          ),
          catchError((error) =>
            of(
              AiContextDetailsActions.aiContextAiKnowledgeVectorDbsLoadingFailed({
                error
              })
            )
          )
        )
      })
    )
  })

  cancelButtonNotDirty$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiContextDetailsActions.cancelButtonClicked),
      filter((action) => !action.dirty),
      map(() => {
        return AiContextDetailsActions.cancelEditNotDirty()
      })
    )
  })

  cancelButtonClickedDirty$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiContextDetailsActions.cancelButtonClicked),
      filter((action) => action.dirty),
      switchMap(() => {
        return this.portalDialogService.openDialog<AIContext | undefined>(
          'AI_CONTEXT_DETAILS.CANCEL.HEADER',
          'AI_CONTEXT_DETAILS.CANCEL.MESSAGE',
          'AI_CONTEXT_DETAILS.CANCEL.CONFIRM'
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(AiContextDetailsActions.cancelEditBackClicked())
        }
        return of(AiContextDetailsActions.cancelEditConfirmClicked())
      })
    )
  })

  saveButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiContextDetailsActions.saveButtonClicked),
      concatLatestFrom(() => this.store.select(aiContextDetailsSelectors.selectDetails)),
      switchMap(([action, details]) => {
        const itemToEditId = details?.id
        const updatedItem = {
          ...details,
          ...action.details
        }

        if (!itemToEditId) {
          return of(AiContextDetailsActions.updateAiContextCancelled())
        }
        const itemToEdit = {
          dataObject: updatedItem
        } as UpdateAIContextRequest
        return this.aiContextService.updateAIContext(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'AI_CONTEXT_DETAILS.UPDATE.SUCCESS'
            })
            return AiContextDetailsActions.updateAiContextSucceeded()
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'AI_CONTEXT_DETAILS.UPDATE.ERROR'
            })
            return of(
              AiContextDetailsActions.updateAiContextFailed({
                error
              })
            )
          })
        )
      })
    )
  })
  deleteButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiContextDetailsActions.deleteButtonClicked),
      concatLatestFrom(() => this.store.select(aiContextDetailsSelectors.selectDetails)),
      mergeMap(([, itemToDelete]) => {
        return this.portalDialogService
          .openDialog<unknown>(
            'AI_CONTEXT_DETAILS.DELETE.HEADER',
            'AI_CONTEXT_DETAILS.DELETE.MESSAGE',
            {
              key: 'AI_CONTEXT_DETAILS.DELETE.CONFIRM',
              icon: PrimeIcons.CHECK
            },
            {
              key: 'AI_CONTEXT_DETAILS.DELETE.CANCEL',
              icon: PrimeIcons.TIMES
            }
          )
          .pipe(
            map((state): [DialogState<unknown>, AIContext | undefined] => {
              return [state, itemToDelete]
            })
          )
      }),
      switchMap(([dialogResult, itemToDelete]) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(AiContextDetailsActions.deleteAiContextCancelled())
        }

        if (!itemToDelete?.id) {
          throw new Error('Item to delete or its ID not found!')
        }

        return this.aiContextService.deleteAIContext(itemToDelete.id).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'AI_CONTEXT_DETAILS.DELETE.SUCCESS'
            })
            return AiContextDetailsActions.deleteAiContextSucceeded()
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'AI_CONTEXT_DETAILS.DELETE.ERROR'
            })
            return of(
              AiContextDetailsActions.deleteAiContextFailed({
                error
              })
            )
          })
        )
      })
    )
  })

  deleteAiContextSucceeded$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AiContextDetailsActions.deleteAiContextSucceeded),
        concatLatestFrom(() => this.store.select(selectUrl)),
        tap(([, currentUrl]) => {
          const urlTree = this.router.parseUrl(currentUrl)
          urlTree.queryParams = {}
          urlTree.fragment = null

          const targetUrl = urlTree.toString().split('/').slice(0, -2).join('/')
          this.router.navigate([targetUrl])
        })
      )
    },
    { dispatch: false }
  )

  errorMessages: { action: Action; key: string }[] = [
    {
      action: AiContextDetailsActions.aiContextDetailsLoadingFailed,
      key: 'AI_CONTEXT_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
    },
    {
      action: AiContextDetailsActions.aiContextAiKnowledgeBasesLoadingFailed,
      key: 'AI_KNOWLEDGE_BASE_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
    },
    {
      action: AiContextDetailsActions.aiContextAiKnowledgeVectorDbsLoadingFailed,
      key: 'AI_KNOWLEDGE_VECTOR_DB_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
    },
    {
      action: AiContextDetailsActions.aiContextProvidersLoadingFailed,
      key: 'AI_PROVIDER_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
    }
  ]

  displayError$ = createEffect(
    () => {
      return this.actions$.pipe(
        tap((action) => {
          const e = this.errorMessages.find((e) => e.action.type === action.type)
          if (e) {
            this.messageService.error({ summaryKey: e.key })
          }
        })
      )
    },
    { dispatch: false }
  )

  navigateBack$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiContextDetailsActions.navigateBackButtonClicked),
      concatLatestFrom(() => [this.store.select(selectBackNavigationPossible)]),
      switchMap(([, backNavigationPossible]) => {
        if (!backNavigationPossible) {
          return of(AiContextDetailsActions.backNavigationFailed())
        }
        window.history.back()
        return of(AiContextDetailsActions.backNavigationStarted())
      })
    )
  })
}
