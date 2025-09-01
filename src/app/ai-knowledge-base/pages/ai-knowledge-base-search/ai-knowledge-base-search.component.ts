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
import { AiKnowledgeBaseSearchActions } from './ai-knowledge-base-search.actions'
import {
  AiKnowledgeBaseSearchCriteria,
  aiKnowledgeBaseSearchCriteriasSchema
} from './ai-knowledge-base-search.parameters'
import { selectAiKnowledgeBaseSearchViewModel } from './ai-knowledge-base-search.selectors'
import { AiKnowledgeBaseSearchViewModel } from './ai-knowledge-base-search.viewmodel'

@Component({
  selector: 'app-ai-knowledge-base-search',
  templateUrl: './ai-knowledge-base-search.component.html',
  styleUrls: ['./ai-knowledge-base-search.component.scss']
})
export class AiKnowledgeBaseSearchComponent implements OnInit {
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
        titleKey: 'AI_KNOWLEDGE_BASE_SEARCH.BREADCRUMB',
        labelKey: 'AI_KNOWLEDGE_BASE_SEARCH.BREADCRUMB',
        routerLink: '/ai-knowledge-base'
      }
    ])
    this.viewModel$.subscribe((vm) => this.aiKnowledgeBaseSearchFormGroup.patchValue(vm.searchCriteria))
  }
  viewModel$: Observable<AiKnowledgeBaseSearchViewModel> = this.store.select(selectAiKnowledgeBaseSearchViewModel)
  defaultDataSortDirection = DataSortDirection.NONE
  defaultDiagramType = DiagramType.PIE
  headerActions$: Observable<Action[]> = this.viewModel$.pipe(
    map((vm) => {
      const actions: Action[] = [
        {
          labelKey: 'AI_KNOWLEDGE_BASE_SEARCH.HEADER_ACTIONS.CREATE_BASE',
          icon: PrimeIcons.PLUS,
          titleKey: 'AI_KNOWLEDGE_BASE_SEARCH.HEADER_ACTIONS.CREATE_BASE',
          show: 'always',
          actionCallback: () => this.createAiKnowledgeBase()
        },
        {
          labelKey: 'AI_KNOWLEDGE_BASE_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          icon: PrimeIcons.DOWNLOAD,
          titleKey: 'AI_KNOWLEDGE_BASE_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          show: 'asOverflow',
          actionCallback: () => this.exportItems()
        },
        {
          labelKey: vm.chartVisible
            ? 'AI_KNOWLEDGE_BASE_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'AI_KNOWLEDGE_BASE_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          icon: PrimeIcons.EYE,
          titleKey: vm.chartVisible
            ? 'AI_KNOWLEDGE_BASE_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'AI_KNOWLEDGE_BASE_SEARCH.HEADER_ACTIONS.SHOW_CHART',
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

  public aiKnowledgeBaseSearchFormGroup: FormGroup = this.formBuilder.group({
    ...(Object.fromEntries(aiKnowledgeBaseSearchCriteriasSchema.keyof().options.map((k) => [k, null])) as Record<
      keyof AiKnowledgeBaseSearchCriteria,
      unknown
    >)
  } satisfies Record<keyof AiKnowledgeBaseSearchCriteria, unknown>)

  resultComponentStateChanged(state: InteractiveDataViewComponentState) {
    this.store.dispatch(AiKnowledgeBaseSearchActions.resultComponentStateChanged(state))
  }

  searchHeaderComponentStateChanged(state: SearchHeaderComponentState) {
    this.store.dispatch(AiKnowledgeBaseSearchActions.searchHeaderComponentStateChanged(state))
  }

  diagramComponentStateChanged(state: DiagramComponentState) {
    this.store.dispatch(AiKnowledgeBaseSearchActions.diagramComponentStateChanged(state))
  }

  search(formValue: FormGroup) {
    const searchCriteria = Object.entries(formValue.getRawValue()).reduce(
      (acc: Partial<AiKnowledgeBaseSearchCriteria>, [key, value]) => ({
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
            ).toISOString()
          : value || undefined
      }),
      {}
    )

    this.store.dispatch(AiKnowledgeBaseSearchActions.searchButtonClicked({ searchCriteria }))
  }

  details({ id }: RowListGridData) {
    this.store.dispatch(AiKnowledgeBaseSearchActions.detailsButtonClicked({ id }))
  }

  createAiKnowledgeBase() {
    this.store.dispatch(AiKnowledgeBaseSearchActions.createButtonClicked())
  }

  edit({ id }: RowListGridData) {
    this.store.dispatch(AiKnowledgeBaseSearchActions.editButtonClicked({ id }))
  }

  delete({ id }: RowListGridData) {
    this.store.dispatch(AiKnowledgeBaseSearchActions.deleteButtonClicked({ id }))
  }

  resetSearch() {
    this.store.dispatch(AiKnowledgeBaseSearchActions.resetButtonClicked())
  }

  exportItems() {
    this.store.dispatch(AiKnowledgeBaseSearchActions.exportButtonClicked())
  }

  toggleChartVisibility() {
    this.store.dispatch(AiKnowledgeBaseSearchActions.chartVisibilityToggled())
  }

  onDisplayedColumnsChange(displayedColumns: DataTableColumn[]) {
    this.store.dispatch(AiKnowledgeBaseSearchActions.displayedColumnsChanged({ displayedColumns }))
  }
}
