import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { Store } from '@ngrx/store'
import { isValidDate } from '@onecx/accelerator'
import {
  Action,
  BreadcrumbService,
  DataSortDirection,
  DataTableColumn,
  DiagramComponentState,
  DiagramType,
  ExportDataService,
  InteractiveDataViewComponentState,
  RowListGridData,
  SearchHeaderComponentState
} from '@onecx/portal-integration-angular'
import { PrimeIcons } from 'primeng/api'
import { map, Observable } from 'rxjs'
import { AiContextSearchActions } from './ai-context-search.actions'
import { AiContextSearchCriteria, aiContextSearchCriteriasSchema } from './ai-context-search.parameters'
import { selectAiContextSearchViewModel } from './ai-context-search.selectors'
import { AiContextSearchViewModel } from './ai-context-search.viewmodel'

@Component({
  selector: 'app-ai-context-search',
  templateUrl: './ai-context-search.component.html',
  styleUrls: ['./ai-context-search.component.scss']
})
export class AiContextSearchComponent implements OnInit {
  viewModel$: Observable<AiContextSearchViewModel> = this.store.select(selectAiContextSearchViewModel)

  defaultDataSortDirection = DataSortDirection.NONE
  defaultDiagramType = DiagramType.PIE

  headerActions$: Observable<Action[]> = this.viewModel$.pipe(
    map((vm) => {
      const actions: Action[] = [
        {
          labelKey: 'AI_CONTEXT_CREATE_UPDATE.ACTION.CREATE',
          icon: PrimeIcons.PLUS,
          show: 'always',
          actionCallback: () => this.create()
        },
        {
          labelKey: 'AI_CONTEXT_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          icon: PrimeIcons.DOWNLOAD,
          titleKey: 'AI_CONTEXT_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          show: 'asOverflow',
          actionCallback: () => this.exportItems()
        },
        {
          labelKey: vm.chartVisible
            ? 'AI_CONTEXT_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'AI_CONTEXT_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          icon: PrimeIcons.EYE,
          titleKey: vm.chartVisible
            ? 'AI_CONTEXT_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'AI_CONTEXT_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          show: 'asOverflow',
          actionCallback: () => this.toggleChartVisibility()
        }
      ]
      return actions
    })
  )

  diagramColumnId = 'id'
  diagramColumn$ = this.viewModel$.pipe(
    map((vm) => vm.columns.find((e) => e.id === this.diagramColumnId) as DataTableColumn)
  )

  public aiContextSearchFormGroup: FormGroup = this.formBuilder.group({
    ...(Object.fromEntries(aiContextSearchCriteriasSchema.keyof().options.map((k) => [k, null])) as Record<
      keyof AiContextSearchCriteria,
      unknown
    >)
  } satisfies Record<keyof AiContextSearchCriteria, unknown>)

  constructor(
    private readonly breadcrumbService: BreadcrumbService,
    private readonly store: Store,
    private readonly formBuilder: FormBuilder,
    @Inject(LOCALE_ID) public readonly locale: string,
    private readonly exportDataService: ExportDataService
  ) {}

  ngOnInit() {
    this.breadcrumbService.setItems([
      {
        titleKey: 'AI_CONTEXT_SEARCH.BREADCRUMB',
        labelKey: 'AI_CONTEXT_SEARCH.BREADCRUMB',
        routerLink: '/ai-context'
      }
    ])
    this.viewModel$.subscribe((vm) => this.aiContextSearchFormGroup.patchValue(vm.searchCriteria))
  }

  resultComponentStateChanged(state: InteractiveDataViewComponentState) {
    this.store.dispatch(AiContextSearchActions.resultComponentStateChanged(state))
  }

  searchHeaderComponentStateChanged(state: SearchHeaderComponentState) {
    this.store.dispatch(AiContextSearchActions.searchHeaderComponentStateChanged(state))
  }

  diagramComponentStateChanged(state: DiagramComponentState) {
    this.store.dispatch(AiContextSearchActions.diagramComponentStateChanged(state))
  }

  search(formValue: FormGroup) {
    const searchCriteria = Object.entries(formValue.getRawValue()).reduce(
      (acc: Partial<AiContextSearchCriteria>, [key, value]) => ({
        ...acc,
        [key]: isValidDate(value)
          ? new Date(
              Date.UTC(
                value.getFullYear(),
                value.getMonth(),
                value.getDate(),
                value.getHours(),
                value.getMinutes(),
                value.getSeconds()
              )
            )
          : value || undefined
      }),
      {}
    )
    this.store.dispatch(AiContextSearchActions.searchButtonClicked({ searchCriteria }))
  }

  create() {
    this.store.dispatch(AiContextSearchActions.createAiContextButtonClicked())
  }

  edit({ id }: RowListGridData) {
    this.store.dispatch(AiContextSearchActions.editAiContextButtonClicked({ id }))
  }

  delete({ id }: RowListGridData) {
    this.store.dispatch(AiContextSearchActions.deleteAiContextButtonClicked({ id }))
  }

  details({ id }: RowListGridData) {
    this.store.dispatch(AiContextSearchActions.detailsButtonClicked({ id }))
  }

  resetSearch() {
    this.store.dispatch(AiContextSearchActions.resetButtonClicked())
  }

  exportItems() {
    this.store.dispatch(AiContextSearchActions.exportButtonClicked())
  }

  viewModeChanged(viewMode: 'basic' | 'advanced') {
    this.store.dispatch(
      AiContextSearchActions.viewModeChanged({
        viewMode: viewMode
      })
    )
  }

  onDisplayedColumnsChange(displayedColumns: DataTableColumn[]) {
    this.store.dispatch(AiContextSearchActions.displayedColumnsChanged({ displayedColumns }))
  }

  toggleChartVisibility() {
    this.store.dispatch(AiContextSearchActions.chartVisibilityToggled())
  }
}
