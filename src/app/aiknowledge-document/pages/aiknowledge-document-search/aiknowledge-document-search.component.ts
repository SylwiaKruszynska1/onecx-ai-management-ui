import { Component, Inject, LOCALE_ID, OnInit } from '@angular/core'
import { FormBuilder, FormGroup } from '@angular/forms'
import { Store } from '@ngrx/store'
import { isValidDate } from '@onecx/accelerator'
import {
  Action,
  BreadcrumbService,
  DataTableColumn,
  ExportDataService,
  RowListGridData
} from '@onecx/portal-integration-angular'
import { PrimeIcons } from 'primeng/api'
import { map, Observable } from 'rxjs'
import { AIKnowledgeDocumentSearchActions } from './aiknowledge-document-search.actions'
import {
  AIKnowledgeDocumentSearchCriteria,
  AIKnowledgeDocumentSearchCriteriasSchema
} from './aiknowledge-document-search.parameters'
import { selectAIKnowledgeDocumentSearchViewModel } from './aiknowledge-document-search.selectors'
import { AIKnowledgeDocumentSearchViewModel } from './aiknowledge-document-search.viewmodel'
import { AIKnowledgeDocumentStatusEnum } from 'src/app/shared/generated'

@Component({
  selector: 'app-aiknowledge-document-search',
  templateUrl: './aiknowledge-document-search.component.html',
  styleUrls: ['./aiknowledge-document-search.component.scss']
})
export class AIKnowledgeDocumentSearchComponent implements OnInit {
  viewModel$: Observable<AIKnowledgeDocumentSearchViewModel> = this.store.select(
    selectAIKnowledgeDocumentSearchViewModel
  )

  headerActions$: Observable<Action[]> = this.viewModel$.pipe(
    map((vm) => {
      const actions: Action[] = [
        {
          labelKey: 'AI_KNOWLEDGE_DOCUMENT_CREATE_UPDATE.ACTION.CREATE',
          icon: PrimeIcons.PLUS,
          show: 'always',
          actionCallback: () => this.create()
        },
        {
          labelKey: 'AI_KNOWLEDGE_DOCUMENT_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          icon: PrimeIcons.DOWNLOAD,
          titleKey: 'AI_KNOWLEDGE_DOCUMENT_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
          show: 'asOverflow',
          actionCallback: () => this.exportItems()
        },
        {
          labelKey: vm.chartVisible
            ? 'AI_KNOWLEDGE_DOCUMENT_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'AI_KNOWLEDGE_DOCUMENT_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          icon: PrimeIcons.EYE,
          titleKey: vm.chartVisible
            ? 'AI_KNOWLEDGE_DOCUMENT_SEARCH.HEADER_ACTIONS.HIDE_CHART'
            : 'AI_KNOWLEDGE_DOCUMENT_SEARCH.HEADER_ACTIONS.SHOW_CHART',
          show: 'asOverflow',
          actionCallback: () => this.toggleChartVisibility()
        }
      ]
      return actions
    })
  )
  statusValues = Object.values(AIKnowledgeDocumentStatusEnum)
  diagramColumnId = 'status'
  diagramColumn$ = this.viewModel$.pipe(
    map((vm) => vm.columns.find((e) => e.id === this.diagramColumnId) as DataTableColumn)
  )

  public aIKnowledgeDocumentSearchFormGroup: FormGroup = this.formBuilder.group({
    ...(Object.fromEntries(AIKnowledgeDocumentSearchCriteriasSchema.keyof().options.map((k) => [k, null])) as Record<
      keyof AIKnowledgeDocumentSearchCriteria,
      unknown
    >)
  } satisfies Record<keyof AIKnowledgeDocumentSearchCriteria, unknown>)

  constructor(
    private readonly breadcrumbService: BreadcrumbService,
    private readonly store: Store,
    private readonly formBuilder: FormBuilder,
    @Inject(LOCALE_ID) public readonly locale: string,
    private readonly exportDataService: ExportDataService
  ) { }

  ngOnInit() {
    this.breadcrumbService.setItems([
      {
        titleKey: 'AI_KNOWLEDGE_DOCUMENT_SEARCH.BREADCRUMB',
        labelKey: 'AI_KNOWLEDGE_DOCUMENT_SEARCH.BREADCRUMB',
        routerLink: '/aiknowledge-document'
      }
    ])
    this.viewModel$.subscribe((vm) => this.aIKnowledgeDocumentSearchFormGroup.patchValue(vm.searchCriteria))
  }

  search(formValue: FormGroup) {
    const searchCriteria = Object.entries(formValue.getRawValue()).reduce(
      (acc: Partial<AIKnowledgeDocumentSearchCriteria>, [key, value]) => ({
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
    this.store.dispatch(AIKnowledgeDocumentSearchActions.searchButtonClicked({ searchCriteria }))
  }

  details({ id }: RowListGridData) {
    this.store.dispatch(AIKnowledgeDocumentSearchActions.detailsButtonClicked({ id }))
  }

  create() {
    this.store.dispatch(AIKnowledgeDocumentSearchActions.createAIKnowledgeDocumentButtonClicked())
  }

  edit({ id }: RowListGridData) {
    this.store.dispatch(AIKnowledgeDocumentSearchActions.editAIKnowledgeDocumentButtonClicked({ id }))
  }

  delete({ id }: RowListGridData) {
    this.store.dispatch(AIKnowledgeDocumentSearchActions.deleteAIKnowledgeDocumentButtonClicked({ id }))
  }

  resetSearch() {
    this.store.dispatch(AIKnowledgeDocumentSearchActions.resetButtonClicked())
  }

  exportItems() {
    this.store.dispatch(AIKnowledgeDocumentSearchActions.exportButtonClicked())
  }

  viewModeChanged(viewMode: 'basic' | 'advanced') {
    this.store.dispatch(
      AIKnowledgeDocumentSearchActions.viewModeChanged({
        viewMode: viewMode
      })
    )
  }

  onDisplayedColumnsChange(displayedColumns: DataTableColumn[]) {
    this.store.dispatch(AIKnowledgeDocumentSearchActions.displayedColumnsChanged({ displayedColumns }))
  }

  toggleChartVisibility() {
    this.store.dispatch(AIKnowledgeDocumentSearchActions.chartVisibilityToggled())
  }
}