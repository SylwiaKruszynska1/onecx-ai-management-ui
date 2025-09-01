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
import { AIProviderSearchActions } from './aiprovider-search.actions'
import { AIProviderSearchCriteria, AIProviderSearchCriteriasSchema } from './aiprovider-search.parameters'
import { selectAIProviderSearchViewModel } from './aiprovider-search.selectors'
import { AIProviderSearchViewModel } from './aiprovider-search.viewmodel'

@Component({
  selector: 'app-aiprovider-search',
  templateUrl: './aiprovider-search.component.html',
  styleUrls: ['./aiprovider-search.component.scss']
})
export class AIProviderSearchComponent implements OnInit {
  viewModel$!: Observable<AIProviderSearchViewModel>
  headerActions$!: Observable<Action[]>
  public AIProviderSearchFormGroup!: FormGroup
  diagramColumnId = 'modelName'
  diagramColumn$!: Observable<DataTableColumn>

  constructor(
    private readonly breadcrumbService: BreadcrumbService,
    private readonly store: Store,
    private readonly formBuilder: FormBuilder,
    @Inject(LOCALE_ID) public readonly locale: string,
    private readonly exportDataService: ExportDataService
  ) {}

  ngOnInit() {
    this.viewModel$ = this.store.select(selectAIProviderSearchViewModel)
    this.headerActions$ = this.viewModel$.pipe(
      map((vm) => {
        const actions: Action[] = [
          {
            labelKey: 'AI_PROVIDER_CREATE_UPDATE.ACTION.CREATE',
            icon: PrimeIcons.PLUS,
            show: 'always',
            actionCallback: () => this.create()
          },
          {
            labelKey: 'AI_PROVIDER_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
            icon: PrimeIcons.DOWNLOAD,
            titleKey: 'AI_PROVIDER_SEARCH.HEADER_ACTIONS.EXPORT_ALL',
            show: 'asOverflow',
            actionCallback: () => this.exportItems()
          },
          {
            labelKey: vm.chartVisible
              ? 'AI_PROVIDER_SEARCH.HEADER_ACTIONS.HIDE_CHART'
              : 'AI_PROVIDER_SEARCH.HEADER_ACTIONS.SHOW_CHART',
            icon: PrimeIcons.EYE,
            titleKey: vm.chartVisible
              ? 'AI_PROVIDER_SEARCH.HEADER_ACTIONS.HIDE_CHART'
              : 'AI_PROVIDER_SEARCH.HEADER_ACTIONS.SHOW_CHART',
            show: 'asOverflow',
            actionCallback: () => this.toggleChartVisibility()
          }
        ]
        return actions
      })
    )

    this.diagramColumn$ = this.viewModel$.pipe(
      map((vm) => vm.columns.find((e) => e.id === this.diagramColumnId) as DataTableColumn)
    )

    this.AIProviderSearchFormGroup = this.formBuilder.group({
      ...(Object.fromEntries(AIProviderSearchCriteriasSchema.keyof().options.map((k) => [k, null])) as Record<
        keyof AIProviderSearchCriteria,
        unknown
      >)
    } satisfies Record<keyof AIProviderSearchCriteria, unknown>)

    this.breadcrumbService.setItems([
      {
        titleKey: 'AI_PROVIDER_SEARCH.BREADCRUMB',
        labelKey: 'AI_PROVIDER_SEARCH.BREADCRUMB',
        routerLink: '/aiprovider'
      }
    ])
    this.viewModel$.subscribe((vm) => this.AIProviderSearchFormGroup.patchValue(vm.searchCriteria))
  }

  search(formValue: FormGroup) {
    const searchCriteria = Object.entries(formValue.getRawValue()).reduce(
      (acc: Partial<AIProviderSearchCriteria>, [key, value]) => ({
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
    this.store.dispatch(AIProviderSearchActions.searchButtonClicked({ searchCriteria }))
  }

  details({ id }: RowListGridData) {
    this.store.dispatch(AIProviderSearchActions.detailsButtonClicked({ id }))
  }

  create() {
    this.store.dispatch(AIProviderSearchActions.createAiproviderButtonClicked())
  }

  edit({ id }: RowListGridData) {
    this.store.dispatch(AIProviderSearchActions.editAiproviderButtonClicked({ id }))
  }

  delete({ id }: RowListGridData) {
    this.store.dispatch(AIProviderSearchActions.deleteAiproviderButtonClicked({ id }))
  }

  resetSearch() {
    this.store.dispatch(AIProviderSearchActions.resetButtonClicked())
  }

  exportItems() {
    this.store.dispatch(AIProviderSearchActions.exportButtonClicked())
  }

  viewModeChanged(viewMode: 'basic' | 'advanced') {
    this.store.dispatch(
      AIProviderSearchActions.viewModeChanged({
        viewMode: viewMode
      })
    )
  }

  onDisplayedColumnsChange(displayedColumns: DataTableColumn[]) {
    this.store.dispatch(AIProviderSearchActions.displayedColumnsChanged({ displayedColumns }))
  }

  toggleChartVisibility() {
    this.store.dispatch(AIProviderSearchActions.chartVisibilityToggled())
  }
}
