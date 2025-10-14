import { Injectable } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { filterForNavigatedTo, filterOutQueryParamsHaveNotChanged } from '@onecx/ngrx-accelerator'
import {
  DialogState,
  ExportDataService,
  PortalDialogService,
  PortalMessageService
} from '@onecx/portal-integration-angular'
import equal from 'fast-deep-equal'
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs'
import { PrimeIcons } from 'primeng/api'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import {
  AIKnowledgeBase,
  AiKnowledgeBaseBffService,
  CreateAIKnowledgeBaseRequest,
  UpdateAIKnowledgeBaseRequest
} from '../../../shared/generated'
import { AiKnowledgeBaseSearchActions } from './ai-knowledge-base-search.actions'
import { AiKnowledgeBaseSearchComponent } from './ai-knowledge-base-search.component'
import { aiKnowledgeBaseSearchCriteriasSchema } from './ai-knowledge-base-search.parameters'
import {
  aiKnowledgeBaseSearchSelectors,
  selectAiKnowledgeBaseSearchViewModel
} from './ai-knowledge-base-search.selectors'
import { AIKnowledgeBaseCreateUpdateComponent } from './dialogs/aiknowledge-base-create-update/aiknowledge-base-create-update.component'

@Injectable()
export class AiKnowledgeBaseSearchEffects {
  constructor(
    private actions$: Actions,
    private route: ActivatedRoute,
    private aiKnowledgeBaseService: AiKnowledgeBaseBffService,
    private router: Router,
    private store: Store,
    private messageService: PortalMessageService,
    private portalDialogService: PortalDialogService,

    private readonly exportDataService: ExportDataService
  ) {}

  syncParamsToUrl$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AiKnowledgeBaseSearchActions.searchButtonClicked, AiKnowledgeBaseSearchActions.resetButtonClicked),
        concatLatestFrom(() => [
          this.store.select(aiKnowledgeBaseSearchSelectors.selectCriteria),
          this.route.queryParams
        ]),
        tap(([, criteria, queryParams]) => {
          const results = aiKnowledgeBaseSearchCriteriasSchema.safeParse(queryParams)
          if (!results.success || !equal(criteria, results.data)) {
            const params = {
              ...criteria
            }
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: params,
              replaceUrl: true,
              onSameUrlNavigation: 'ignore'
            })
          }
        })
      )
    },
    { dispatch: false }
  )

  detailsButtonClicked$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AiKnowledgeBaseSearchActions.detailsButtonClicked),
        concatLatestFrom(() => this.store.select(selectUrl)),
        tap(([action, currentUrl]) => {
          const urlTree = this.router.parseUrl(currentUrl)
          urlTree.queryParams = {}
          urlTree.fragment = null
          this.router.navigate([urlTree.toString(), 'details', action.id])
        })
      )
    },
    { dispatch: false }
  )

  deleteButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiKnowledgeBaseSearchActions.deleteButtonClicked),
      concatLatestFrom(() => this.store.select(aiKnowledgeBaseSearchSelectors.selectResults)),
      mergeMap(([action, results]) => {
        const itemToDelete = results.find((item) => item.id === action.id)
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
          return of(AiKnowledgeBaseSearchActions.deleteAiKnowledgeBaseCancelled())
        }
        if (!itemToDelete?.id) {
          throw new Error('Item to delete not found!')
        }

        return this.aiKnowledgeBaseService.deleteAiKnowledgeBase(itemToDelete.id).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'AI_KNOWLEDGE_BASE_DETAILS.DELETE.SUCCESS'
            })
            return AiKnowledgeBaseSearchActions.deleteAiKnowledgeBaseSucceeded()
          }),
          catchError((error) => {
            this.messageService.error({
              summaryKey: 'AI_KNOWLEDGE_BASE_DETAILS.DELETE.ERROR'
            })
            return of(
              AiKnowledgeBaseSearchActions.deleteAiKnowledgeBaseFailed({
                error
              })
            )
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'AI_KNOWLEDGE_BASE_DETAILS.DELETE.ERROR'
        })
        return of(
          AiKnowledgeBaseSearchActions.deleteAiKnowledgeBaseFailed({
            error
          })
        )
      })
    )
  })

  createButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiKnowledgeBaseSearchActions.createButtonClicked),
      switchMap(() => {
        return this.portalDialogService.openDialog<AIKnowledgeBase | undefined>(
          'AI_KNOWLEDGE_BASE_CREATE_UPDATE.CREATE.HEADER',
          {
            type: AIKnowledgeBaseCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit: {}
              }
            }
          },
          'AI_KNOWLEDGE_BASE_CREATE_UPDATE.CREATE.FORM.SAVE',
          'AI_KNOWLEDGE_BASE_CREATE_UPDATE.CREATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(AiKnowledgeBaseSearchActions.createAIKnowledgeBaseCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        const toCreateItem = {
          aIKnowledgeDocumentData: dialogResult.result
        } as CreateAIKnowledgeBaseRequest
        return this.aiKnowledgeBaseService.createAIKnowledgeBase(toCreateItem).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'AI_KNOWLEDGE_BASE_CREATE_UPDATE.CREATE.SUCCESS'
            })
            return AiKnowledgeBaseSearchActions.createAIKnowledgeBaseSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'AI_KNOWLEDGE_BASE_CREATE_UPDATE.CREATE.ERROR'
        })
        return of(
          AiKnowledgeBaseSearchActions.createAIKnowledgeBaseFailed({
            error
          })
        )
      })
    )
  })

  editButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiKnowledgeBaseSearchActions.editButtonClicked),
      concatLatestFrom(() => this.store.select(aiKnowledgeBaseSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id)
      }),
      mergeMap((itemToEdit) => {
        return this.portalDialogService.openDialog<AIKnowledgeBase | undefined>(
          'AI_KNOWLEDGE_BASE_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: AIKnowledgeBaseCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit
              }
            }
          },
          'AI_KNOWLEDGE_BASE_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'AI_KNOWLEDGE_BASE_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(AiKnowledgeBaseSearchActions.editAIKnowledgeBaseCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        const itemToEditId = dialogResult.result.id
        if (!itemToEditId) {
          throw new Error('Item ID is required for update!')
        }
        const itemToEdit = {
          aIKnowledgeDocumentData: dialogResult.result
        } as UpdateAIKnowledgeBaseRequest
        return this.aiKnowledgeBaseService.updateAiKnowledgeBase(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'AI_KNOWLEDGE_BASE_CREATE_UPDATE.UPDATE.SUCCESS'
            })
            return AiKnowledgeBaseSearchActions.editAIKnowledgeBaseSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'AI_KNOWLEDGE_BASE_CREATE_UPDATE.UPDATE.ERROR'
        })
        return of(
          AiKnowledgeBaseSearchActions.editAIKnowledgeBaseFailed({
            error
          })
        )
      })
    )
  })

  searchByUrl$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, AiKnowledgeBaseSearchComponent),
      filterOutQueryParamsHaveNotChanged(this.router, aiKnowledgeBaseSearchCriteriasSchema, false),
      concatLatestFrom(() => this.store.select(aiKnowledgeBaseSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  performSearch(searchCriteria: Record<string, any>) {
    return this.aiKnowledgeBaseService
      .searchAIKnowledgeBases({
        ...Object.entries(searchCriteria).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: value instanceof Date ? value.toISOString() : value
          }),
          {}
        ),
        id: +searchCriteria['id']
      })
      .pipe(
        map(({ stream, size, number, totalElements, totalPages }) =>
          AiKnowledgeBaseSearchActions.aiKnowledgeBaseSearchResultsReceived({
            stream,
            size,
            number,
            totalElements,
            totalPages
          })
        ),
        catchError((error) =>
          of(
            AiKnowledgeBaseSearchActions.aiKnowledgeBaseSearchResultsLoadingFailed({
              error
            })
          )
        )
      )
  }

  exportData$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AiKnowledgeBaseSearchActions.exportButtonClicked),
        concatLatestFrom(() => this.store.select(selectAiKnowledgeBaseSearchViewModel)),
        map(([, viewModel]) => {
          this.exportDataService.exportCsv(
            viewModel.resultComponentState?.displayedColumns ?? [],
            viewModel.results,
            'AiKnowledgeBase.csv'
          )
        })
      )
    },
    { dispatch: false }
  )

  errorMessages: { action: Action; key: string }[] = [
    {
      action: AiKnowledgeBaseSearchActions.aiKnowledgeBaseSearchResultsLoadingFailed,
      key: 'AI_KNOWLEDGE_BASE_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
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
}
