import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store, StoreModule } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { BreadcrumbService, ColumnType, PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'
import { AIProviderSearchActions } from './aiprovider-search.actions'
import { AIProviderSearchColumns } from './aiprovider-search.columns'
import { AIProviderSearchComponent } from './aiprovider-search.component'
import { AIProviderSearchHarness } from './aiprovider-search.harness'
import { initialState } from './aiprovider-search.reducers'
import { selectAIProviderSearchViewModel } from './aiprovider-search.selectors'
import { AIProviderSearchViewModel } from './aiprovider-search.viewmodel'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'

describe('AIProviderSearchComponent', () => {
  let component: AIProviderSearchComponent
  let fixture: ComponentFixture<AIProviderSearchComponent>
  let store: MockStore<Store>
  let formBuilder: FormBuilder
  let AIProviderSearch: AIProviderSearchHarness

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseAIProviderSearchViewModel: AIProviderSearchViewModel = {
    columns: AIProviderSearchColumns,
    searchCriteria: { 
      name: undefined,
      description: undefined,
      llmUrl: undefined,
      modelName: undefined,
      modelVersion: undefined,
      appId: undefined,
      id: undefined,
      limit: undefined
     },
    results: [],
    displayedColumns: [],
    viewMode: 'basic',
    chartVisible: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AIProviderSearchComponent],
      imports: [
        PortalCoreModule,
        LetDirective,
        ReactiveFormsModule,
        StoreModule.forRoot({}),
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        TranslateTestingModule.withTranslations('en', require('./../../../../assets/i18n/en.json')).withTranslations(
          'de',
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('./../../../../assets/i18n/de.json')
        ),
        NoopAnimationsModule
      ],
      providers: [
        DialogService,
        provideMockStore({
          initialState: { AIProvider: { search: initialState } }
        }),
        FormBuilder,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ]
    }).compileComponents()
  })

  beforeEach(async () => {
    const userService = TestBed.inject(UserService)
    userService.hasPermission = () => true
    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')
    formBuilder = TestBed.inject(FormBuilder)

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectAIProviderSearchViewModel, baseAIProviderSearchViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(AIProviderSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    AIProviderSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, AIProviderSearchHarness)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should have 2 overFlow header actions when search config is disabled', async () => {
    const searchHeader = await AIProviderSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const overflowMenuItems = await pageHeader.getOverFlowMenuItems()
    expect(overflowMenuItems.length).toBe(2)

    const exportAllActionItem = await pageHeader.getOverFlowMenuItem('Export all')
    expect(await exportAllActionItem!.getText()).toBe('Export all')

    const showHideChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    expect(await showHideChartActionItem!.getText()).toBe('Show chart')
  })

  it('should display hide chart action if chart is visible', async () => {
    store.overrideSelector(selectAIProviderSearchViewModel, {
      ...baseAIProviderSearchViewModel,
      chartVisible: true
    })
    store.refreshState()

    const searchHeader = await AIProviderSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const overflowMenuItems = await pageHeader.getOverFlowMenuItems()
    expect(overflowMenuItems.length).toBe(2)

    const showHideChartActionItem = await pageHeader.getOverFlowMenuItem('Hide chart')
    expect(await showHideChartActionItem!.getText()).toEqual('Hide chart')
  })

  it('should display chosen column in the diagram', async () => {
    component.diagramColumnId = 'column_1'
    store.overrideSelector(selectAIProviderSearchViewModel, {
      ...baseAIProviderSearchViewModel,
      chartVisible: true,
      results: [
        {
          id: '1',
          imagePath: '',
          column_1: 'val_1'
        },
        {
          id: '2',
          imagePath: '',
          column_1: 'val_2'
        },
        {
          id: '3',
          imagePath: '',
          column_1: 'val_2'
        }
      ],
      columns: [
        {
          columnType: ColumnType.STRING,
          nameKey: 'COLUMN_KEY',
          id: 'column_1'
        }
      ]
    })
    store.refreshState()

    const diagram = await (await AIProviderSearch.getDiagram())!.getDiagram()

    expect(await diagram.getTotalNumberOfResults()).toBe(3)
    expect(await diagram.getSumLabel()).toEqual('Total')
  })

  it('should display correct breadcrumbs', async () => {
    const breadcrumbService = TestBed.inject(BreadcrumbService)
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const searchHeader = await AIProviderSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Search')

    expect(await searchBreadcrumbItem!.getText()).toEqual('Search')
  })

  it('should export csv data on export action click', async () => {
    jest.spyOn(store, 'dispatch')

    const results = [
      {
        id: '1',
        imagePath: '',
        column_1: 'val_1'
      }
    ]
    const columns = [
      {
        columnType: ColumnType.STRING,
        nameKey: 'COLUMN_KEY',
        id: 'column_1'
      }
    ]
    store.overrideSelector(selectAIProviderSearchViewModel, {
      ...baseAIProviderSearchViewModel,
      results: results,
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const searchHeader = await AIProviderSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const exportAllActionItem = await pageHeader.getOverFlowMenuItem('Export all')
    await exportAllActionItem!.selectItem()

    expect(store.dispatch).toHaveBeenCalledWith(AIProviderSearchActions.exportButtonClicked())
  })

  it('should display translated headers', async () => {
    const searchHeader = await AIProviderSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    expect(await pageHeader.getHeaderText()).toEqual('AIProvider Search')
    expect(await pageHeader.getSubheaderText()).toEqual('Searching and displaying of AIProvider')
  })

  it('should display translated empty message when no search results', async () => {
    const columns = [
      {
        columnType: ColumnType.STRING,
        nameKey: 'COLUMN_KEY',
        id: 'column_1'
      }
    ]
    store.overrideSelector(selectAIProviderSearchViewModel, {
      ...baseAIProviderSearchViewModel,
      results: [],
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const interactiveDataView = await AIProviderSearch.getSearchResults()
    const dataView = await interactiveDataView.getDataView()
    const dataTable = await dataView.getDataTable()
    const rows = await dataTable?.getRows()
    expect(rows?.length).toBe(1)

    const rowData = await rows?.at(0)?.getData()
    expect(rowData?.length).toBe(1)
    expect(rowData?.at(0)).toEqual('No results.')
  })

  it('should not display chart when no results or toggled to not visible', async () => {
    component.diagramColumnId = 'column_1'

    store.overrideSelector(selectAIProviderSearchViewModel, {
      ...baseAIProviderSearchViewModel,
      results: [],
      chartVisible: true,
      columns: [
        {
          columnType: ColumnType.STRING,
          nameKey: 'COLUMN_KEY',
          id: 'column_1'
        }
      ]
    })
    store.refreshState()

    let diagram = await AIProviderSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectAIProviderSearchViewModel, {
      ...baseAIProviderSearchViewModel,
      results: [
        {
          id: '1',
          imagePath: '',
          column_1: 'val_1'
        }
      ],
      chartVisible: false,
      columns: [
        {
          columnType: ColumnType.STRING,
          nameKey: 'COLUMN_KEY',
          id: 'column_1'
        }
      ]
    })
    store.refreshState()

    diagram = await AIProviderSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectAIProviderSearchViewModel, {
      ...baseAIProviderSearchViewModel,
      results: [
        {
          id: '1',
          imagePath: '',
          column_1: 'val_1'
        }
      ],
      chartVisible: true,
      columns: [
        {
          columnType: ColumnType.STRING,
          nameKey: 'COLUMN_KEY',
          id: 'column_1'
        }
      ]
    })
    store.refreshState()

    diagram = await AIProviderSearch.getDiagram()
    expect(diagram).toBeTruthy()
  })

  describe('date mapping logic', () => {
    beforeEach(() => {
      jest.spyOn(store, 'dispatch')
    })

    it('should map undefined value to undefined in searchCriteria', () => {
      const formValue = formBuilder.group({ modelName: undefined })
      component.search(formValue)
      expect(store.dispatch).toHaveBeenCalledWith(
        AIProviderSearchActions.searchButtonClicked({
          searchCriteria: { modelName: undefined }
        })
      )
    })

    it('should map null value to undefined in searchCriteria', () => {
      const formValue = formBuilder.group({ modelName: null })
      component.search(formValue)
      expect(store.dispatch).toHaveBeenCalledWith(
        AIProviderSearchActions.searchButtonClicked({
          searchCriteria: { modelName: undefined }
        })
      )
    })

    it('should map valid Date value to UTC ISO string in searchCriteria', () => {
      const localDate = new Date(2023, 7, 14, 12, 30, 45)
      const expectedIso = new Date(Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        localDate.getHours(),
        localDate.getMinutes(),
        localDate.getSeconds()
      )).toISOString()

      const formValue = formBuilder.group({ modelName: localDate })
      component.search(formValue)

      expect(store.dispatch).toHaveBeenCalledWith(
        AIProviderSearchActions.searchButtonClicked({
          searchCriteria: {
            modelName: expectedIso
          }
        })
      )
    })
  })
})





