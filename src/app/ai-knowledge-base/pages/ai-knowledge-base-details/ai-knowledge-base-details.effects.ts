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
import { selectRouteParam, selectUrl } from 'src/app/shared/selectors/router.selectors'
import { AIKnowledgeBase, AiKnowledgeBaseBffService, UpdateAIKnowledgeBaseRequest } from '../../../shared/generated'
import { AiKnowledgeBaseDetailsActions } from './ai-knowledge-base-details.actions'
import { AiKnowledgeBaseDetailsComponent } from './ai-knowledge-base-details.component'
import { aiKnowledgeBaseDetailsSelectors } from './ai-knowledge-base-details.selectors'
import { SearchAIContextRequest } from 'src/app/shared/generated/model/searchAIContextRequest'
import { AIContextBffService } from 'src/app/shared/generated/api/aIContextBffService.service'
import { selectBackNavigationPossible } from 'src/app/shared/selectors/onecx.selectors'

@Injectable()
export class AiKnowledgeBaseDetailsEffects {
  constructor(
    private actions$: Actions,
    private aiKnowledgeBaseService: AiKnowledgeBaseBffService,
    private aiContextService: AIContextBffService,
    private router: Router,
    private store: Store,
    private messageService: PortalMessageService,
    private portalDialogService: PortalDialogService
  ) {}

  navigatedToDetailsPage$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, AiKnowledgeBaseDetailsComponent),
      concatLatestFrom(() => this.store.select(selectRouteParam('id'))),
      map(([, id]) => {
        return AiKnowledgeBaseDetailsActions.navigatedToDetailsPage({
          id
        })
      })
    )
  })

  loadAiKnowledgeBaseById$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiKnowledgeBaseDetailsActions.navigatedToDetailsPage),
      switchMap(({ id }) =>
        this.aiKnowledgeBaseService.getAIKnowledgeBaseById(id ?? '').pipe(
          map(({ result }) =>
            AiKnowledgeBaseDetailsActions.aiKnowledgeBaseDetailsReceived({
              details: result
            })
          ),
          catchError((error) =>
            of(
              AiKnowledgeBaseDetailsActions.aiKnowledgeBaseDetailsLoadingFailed({
                error
              })
            )
          )
        )
      )
    )
  })

  loadContextsById$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiKnowledgeBaseDetailsActions.navigatedToDetailsPage),
      switchMap(() => {
        const fetchAllReq: SearchAIContextRequest = { id: undefined, appId: '', name: '', description: '' }
        return this.aiContextService.searchAIContexts(fetchAllReq).pipe(
          map(({ stream }) =>
            AiKnowledgeBaseDetailsActions.aiKnowledgeBaseContextsReceived({
              contexts: stream
            })
          ),
          catchError((error) =>
            of(
              AiKnowledgeBaseDetailsActions.aiKnowledgeBaseContextsLoadingFailed({
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
      ofType(AiKnowledgeBaseDetailsActions.cancelButtonClicked),
      filter((action) => !action.dirty),
      map(() => {
        return AiKnowledgeBaseDetailsActions.cancelEditNotDirty()
      })
    )
  })

  cancelButtonClickedDirty$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiKnowledgeBaseDetailsActions.cancelButtonClicked),
      filter((action) => action.dirty),
      switchMap(() => {
        return this.portalDialogService.openDialog<AIKnowledgeBase | undefined>(
          'AI_KNOWLEDGE_BASE_DETAILS.CANCEL.HEADER',
          'AI_KNOWLEDGE_BASE_DETAILS.CANCEL.MESSAGE',
          'AI_KNOWLEDGE_BASE_DETAILS.CANCEL.CONFIRM'
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(AiKnowledgeBaseDetailsActions.cancelEditBackClicked())
        }
        return of(AiKnowledgeBaseDetailsActions.cancelEditConfirmClicked())
      })
    )
  })

  saveButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiKnowledgeBaseDetailsActions.saveButtonClicked),
      concatLatestFrom(() => this.store.select(aiKnowledgeBaseDetailsSelectors.selectDetails)),
      switchMap(([action, details]) => {
        const itemToEditId = details?.id
        const updatedItem = {
          ...details,
          ...action.details
        }

        if (!itemToEditId) {
          return of(AiKnowledgeBaseDetailsActions.updateAiKnowledgeBaseCancelled())
        }
        const itemToEdit = {
          dataObject: updatedItem
        } as UpdateAIKnowledgeBaseRequest
        return this.aiKnowledgeBaseService.updateAiKnowledgeBase(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'AI_KNOWLEDGE_BASE_DETAILS.UPDATE.SUCCESS'
            })
            return AiKnowledgeBaseDetailsActions.updateAiKnowledgeBaseSucceeded()
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'AI_KNOWLEDGE_BASE_DETAILS.UPDATE.ERROR'
            })
            return of(
              AiKnowledgeBaseDetailsActions.updateAiKnowledgeBaseFailed({
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
      ofType(AiKnowledgeBaseDetailsActions.deleteButtonClicked),
      concatLatestFrom(() => this.store.select(aiKnowledgeBaseDetailsSelectors.selectDetails)),
      mergeMap(([, itemToDelete]) => {
        return this.portalDialogService
          .openDialog<unknown>(
            'AI_KNOWLEDGE_BASE_DETAILS.DELETE.HEADER',
            'AI_KNOWLEDGE_BASE_DETAILS.DELETE.MESSAGE',
            {
              key: 'AI_KNOWLEDGE_BASE_DETAILS.DELETE.CONFIRM',
              icon: PrimeIcons.CHECK
            },
            {
              key: 'AI_KNOWLEDGE_BASE_DETAILS.DELETE.CANCEL',
              icon: PrimeIcons.TIMES
            }
          )
          .pipe(
            map((state): [DialogState<unknown>, AIKnowledgeBase | undefined] => {
              return [state, itemToDelete]
            })
          )
      }),
      switchMap(([dialogResult, itemToDelete]) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(AiKnowledgeBaseDetailsActions.deleteAiKnowledgeBaseCancelled())
        }
        if (!itemToDelete?.id) {
          throw new Error('Item to delete not found!')
        }

        return this.aiKnowledgeBaseService.deleteAiKnowledgeBase(itemToDelete.id).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'AI_KNOWLEDGE_BASE_DETAILS.DELETE.SUCCESS'
            })
            return AiKnowledgeBaseDetailsActions.deleteAiKnowledgeBaseSucceeded()
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'AI_KNOWLEDGE_BASE_DETAILS.DELETE.ERROR'
            })
            return of(
              AiKnowledgeBaseDetailsActions.deleteAiKnowledgeBaseFailed({
                error
              })
            )
          })
        )
      })
    )
  })

  deleteAiKnowledgeBaseSucceeded$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AiKnowledgeBaseDetailsActions.deleteAiKnowledgeBaseSucceeded),
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
      action: AiKnowledgeBaseDetailsActions.aiKnowledgeBaseDetailsLoadingFailed,
      key: 'AI_KNOWLEDGE_BASE_DETAILS.ERROR_MESSAGES.DETAILS_LOADING_FAILED'
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
      ofType(AiKnowledgeBaseDetailsActions.navigateBackButtonClicked),
      concatLatestFrom(() => [this.store.select(selectBackNavigationPossible)]),
      switchMap(([, backNavigationPossible]) => {
        if (!backNavigationPossible) {
          return of(AiKnowledgeBaseDetailsActions.backNavigationFailed())
        }
        globalThis.history.back()
        return of(AiKnowledgeBaseDetailsActions.backNavigationStarted())
      })
    )
  })
}
