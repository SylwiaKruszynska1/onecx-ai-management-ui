import { Injectable } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Actions, createEffect, ofType } from '@ngrx/effects'
import { concatLatestFrom } from '@ngrx/operators'
import { routerNavigatedAction } from '@ngrx/router-store'
import { Action, Store } from '@ngrx/store'
import { filterForNavigatedTo, filterOutQueryParamsHaveNotChanged } from '@onecx/ngrx-accelerator'
import { ExportDataService, PortalMessageService, PortalDialogService, DialogState } from '@onecx/portal-integration-angular'
import equal from 'fast-deep-equal'
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs'
import { selectUrl } from 'src/app/shared/selectors/router.selectors'
import { AIContext, AIContextBffService, CreateAIContextRequest, UpdateAIContextRequest } from '../../../shared/generated'
import { AiContextSearchActions } from './ai-context-search.actions'
import { AiContextSearchComponent } from './ai-context-search.component'
import { aiContextSearchCriteriasSchema } from './ai-context-search.parameters'
import { aiContextSearchSelectors, selectAiContextSearchViewModel } from './ai-context-search.selectors'
import { AiContextCreateUpdateComponent } from './dialogs/ai-context-create-update/ai-context-create-update.component'
import { PrimeIcons } from 'primeng/api'

@Injectable()
export class AiContextSearchEffects {
  constructor(
    private readonly portalDialogService: PortalDialogService,
    private readonly actions$: Actions,
    private readonly route: ActivatedRoute,
    private readonly aiContextService: AIContextBffService,
    private readonly router: Router,
    private readonly store: Store,
    private readonly messageService: PortalMessageService,
    private readonly exportDataService: ExportDataService
  ) {}

  syncParamsToUrl$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AiContextSearchActions.searchButtonClicked, AiContextSearchActions.resetButtonClicked),
        concatLatestFrom(() => [this.store.select(aiContextSearchSelectors.selectCriteria), this.route.queryParams]),
        tap(([, criteria, queryParams]) => {
          const results = aiContextSearchCriteriasSchema.safeParse(queryParams)
          if (!results.success || !equal(criteria, results.data)) {
            const params = {
              ...criteria
              //TODO: Move to docs to explain how to only put the date part in the URL in case you have date and not datetime
              //exampleDate: criteria.exampleDate?.toISOString()?.slice(0, 10)
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
        ofType(AiContextSearchActions.detailsButtonClicked),
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

  searchByUrl$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(routerNavigatedAction),
      filterForNavigatedTo(this.router, AiContextSearchComponent),
      filterOutQueryParamsHaveNotChanged(this.router, aiContextSearchCriteriasSchema, false),
      concatLatestFrom(() => this.store.select(aiContextSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  refreshSearchAfterCreateUpdate$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiContextSearchActions.createAiContextSucceeded, AiContextSearchActions.updateAiContextSucceeded),
      concatLatestFrom(() => this.store.select(aiContextSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  editButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiContextSearchActions.editAiContextButtonClicked),
      concatLatestFrom(() => this.store.select(aiContextSearchSelectors.selectResults)),
      map(([action, results]) => {
        return results.find((item) => item.id == action.id)
      }),
      mergeMap((itemToEdit) => {
        return this.portalDialogService.openDialog<AIContext | undefined>(
          'AI_CONTEXT_CREATE_UPDATE.UPDATE.HEADER',
          {
            type: AiContextCreateUpdateComponent,
            inputs: {
              vm: {
                itemToEdit
              }
            }
          },
          'AI_CONTEXT_CREATE_UPDATE.UPDATE.FORM.SAVE',
          'AI_CONTEXT_CREATE_UPDATE.UPDATE.FORM.CANCEL',
          {
            baseZIndex: 100
          }
        )
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(AiContextSearchActions.updateAiContextCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        const itemToEditId = dialogResult.result.id
        if (!itemToEditId) {
          throw new Error('Item ID is required for update!')
        }
        const itemToEdit = {
          aiContextData: dialogResult.result
        } as UpdateAIContextRequest
        return this.aiContextService.updateAIContext(itemToEditId, itemToEdit).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'AI_CONTEXT_CREATE_UPDATE.UPDATE.SUCCESS'
            })
            return AiContextSearchActions.updateAiContextSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'AI_CONTEXT_CREATE_UPDATE.UPDATE.ERROR'
        })
        return of(
          AiContextSearchActions.updateAiContextFailed({
            error
          })
        )
      })
    )
  })

  createButtonClicked$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiContextSearchActions.createAiContextButtonClicked),
      switchMap(() => {
        return this.portalDialogService.openDialog<AIContext | undefined>(
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
      }),
      switchMap((dialogResult) => {
        if (!dialogResult || dialogResult.button == 'secondary') {
          return of(AiContextSearchActions.createAiContextCancelled())
        }
        if (!dialogResult?.result) {
          throw new Error('DialogResult was not set as expected!')
        }
        const toCreateItem = {
          aiContextData: dialogResult.result
        } as CreateAIContextRequest
        return this.aiContextService.createAIContext(toCreateItem).pipe(
          map(() => {
            this.messageService.success({
              summaryKey: 'AI_CONTEXT_CREATE_UPDATE.CREATE.SUCCESS'
            })
            return AiContextSearchActions.createAiContextSucceeded()
          })
        )
      }),
      catchError((error) => {
        this.messageService.error({
          summaryKey: 'AI_CONTEXT_CREATE_UPDATE.CREATE.ERROR'
        })
        return of(
          AiContextSearchActions.createAiContextFailed({
            error
          })
        )
      })
    )
  })

  refreshSearchAfterDelete$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(AiContextSearchActions.deleteAiContextSucceeded),
      concatLatestFrom(() => this.store.select(aiContextSearchSelectors.selectCriteria)),
      switchMap(([, searchCriteria]) => this.performSearch(searchCriteria))
    )
  })

  deleteButtonClicked$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(AiContextSearchActions.deleteAiContextButtonClicked),
        concatLatestFrom(() => this.store.select(aiContextSearchSelectors.selectResults)),
        map(([action, results]) => {
          console.log('Action:', action)
          console.log('Results:', results)
          return results.find((item) => item.id == action.id)
        }),
        mergeMap((itemToDelete) => {
          console.log('Item to delete:', itemToDelete)
          return this.portalDialogService
            .openDialog<unknown>(
              'AI_CONTEXT_DELETE.HEADER',
              'AI_CONTEXT_DELETE.MESSAGE',
              {
                key: 'AI_CONTEXT_DELETE.CONFIRM',
                icon: PrimeIcons.CHECK
              },
              {
                key: 'AI_CONTEXT_DELETE.CANCEL',
                icon: PrimeIcons.TIMES
              }
            )
            .pipe(
              map((state): [DialogState<unknown>, AIContext | undefined] => {
                console.log('Dialog STATE:', state)
                console.log('Item to delete after dialog:', itemToDelete)
                return [state, itemToDelete]
              })
            )
        }),
        switchMap(([dialogResult, itemToDelete]) => {
          console.log('Dialog result:', dialogResult)
          console.log('Item to delete after dialog:', itemToDelete)
          if (!dialogResult || dialogResult.button == 'secondary') {
            console.log('Dialog result:', dialogResult)
            console.log('Item to delete after dialog:', itemToDelete)
            return of(AiContextSearchActions.deleteAiContextCancelled())
          }
          if (!itemToDelete?.id) {
            this.messageService.error({
              summaryKey: 'AI_CONTEXT_DELETE.ERROR'
            })
            return of(AiContextSearchActions.deleteAiContextFailed({
              error: 'Item to delete or its ID not found!'
            }))
          }

          return this.aiContextService.deleteAIContext(itemToDelete.id).pipe(
            map(() => {
              console.log('Dialog result SUCCESS:', dialogResult)
              console.log('Item to delete after dialog:', itemToDelete)
              this.messageService.success({
                summaryKey: 'AI_CONTEXT_DELETE.SUCCESS'
              })
              return AiContextSearchActions.deleteAiContextSucceeded()
            }),
            catchError((error) => {
              console.log('Error:', error)
              this.messageService.error({
                summaryKey: 'AI_CONTEXT_DELETE.ERROR'
              })
              return of(
                AiContextSearchActions.deleteAiContextFailed({
                  error
                })
              )
            })
          )
        })
      )
    })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  performSearch(searchCriteria: Record<string, any>) {
    return this.aiContextService
      .searchAIContexts({
        ...Object.entries(searchCriteria).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: value instanceof Date ? value.toISOString() : value
          }),
          {}
        )
      })
      .pipe(
        map(({ stream, size, number, totalElements, totalPages }) =>
          AiContextSearchActions.aiContextSearchResultsReceived({
            stream,
            size,
            number,
            totalElements,
            totalPages
          })
        ),
        catchError((error) =>
          of(
            AiContextSearchActions.aiContextSearchResultsLoadingFailed({
              error
            })
          )
        )
      )
  }

  exportData$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(AiContextSearchActions.exportButtonClicked),
        concatLatestFrom(() => this.store.select(selectAiContextSearchViewModel)),
        map(([, viewModel]) => {
          this.exportDataService.exportCsv(
            viewModel.resultComponentState?.displayedColumns ?? [],
            viewModel.results,
            'AIContext.csv'
          )
        })
      )
    },
    { dispatch: false }
  )

  errorMessages: { action: Action; key: string }[] = [
    {
      action: AiContextSearchActions.aiContextSearchResultsLoadingFailed,
      key: 'AI_CONTEXT_SEARCH.ERROR_MESSAGES.SEARCH_RESULTS_LOADING_FAILED'
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
