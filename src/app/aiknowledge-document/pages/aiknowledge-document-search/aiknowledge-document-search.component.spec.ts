 
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store, StoreModule } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { BreadcrumbService, ColumnType, PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'
import { AIKnowledgeDocumentSearchColumns } from './aiknowledge-document-search.columns'
import { AIKnowledgeDocumentSearchComponent } from './aiknowledge-document-search.component'
import { AIKnowledgeDocumentSearchHarness } from './aiknowledge-document-search.harness'
import { selectAIKnowledgeDocumentSearchViewModel } from './aiknowledge-document-search.selectors'
import { AIKnowledgeDocumentSearchViewModel } from './aiknowledge-document-search.viewmodel'
import { initialState } from './aiknowledge-document-search.reducers'

describe('AIKnowledgeDocumentSearchComponent', () => {
  let component: AIKnowledgeDocumentSearchComponent
  let fixture: ComponentFixture<AIKnowledgeDocumentSearchComponent>
  let store: MockStore<Store>
  let aIKnowledgeDocumentSearch: AIKnowledgeDocumentSearchHarness

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseAIKnowledgeDocumentSearchViewModel: AIKnowledgeDocumentSearchViewModel = {
    columns: AIKnowledgeDocumentSearchColumns,
    searchCriteria: {
      id: undefined,
      name: undefined
    },
    results: [],
    displayedColumns: [],
    viewMode: 'basic',
    chartVisible: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AIKnowledgeDocumentSearchComponent],
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
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        DialogService,
        provideMockStore({
          initialState: { aIKnowledgeDocument: { search: initialState } }
        }),
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents()
    const userService = TestBed.inject(UserService)
    userService.hasPermission = () => true
    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')
  
    store = TestBed.inject(MockStore)
    jest.spyOn(store, 'dispatch')
    store.overrideSelector(selectAIKnowledgeDocumentSearchViewModel, baseAIKnowledgeDocumentSearchViewModel)
    store.refreshState()
  
    fixture = TestBed.createComponent(AIKnowledgeDocumentSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    aIKnowledgeDocumentSearch = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      AIKnowledgeDocumentSearchHarness
    )
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should have 2 overFlow header actions when search config is disabled', async () => {
    const searchHeader = await aIKnowledgeDocumentSearch.getHeader()
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
    store.overrideSelector(selectAIKnowledgeDocumentSearchViewModel, {
      ...baseAIKnowledgeDocumentSearchViewModel,
      chartVisible: true
    })
    store.refreshState()

    const searchHeader = await aIKnowledgeDocumentSearch.getHeader()
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
    store.overrideSelector(selectAIKnowledgeDocumentSearchViewModel, {
      ...baseAIKnowledgeDocumentSearchViewModel,
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

    const diagram = await (await aIKnowledgeDocumentSearch.getDiagram())!.getDiagram()

    expect(await diagram.getTotalNumberOfResults()).toBe(3)
    expect(await diagram.getSumLabel()).toEqual('Total')
  })

  it('should display correct breadcrumbs', async () => {
    const breadcrumbService = TestBed.inject(BreadcrumbService)
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const searchHeader = await aIKnowledgeDocumentSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Search')

    expect(await searchBreadcrumbItem!.getText()).toEqual('Search')
  })

  it('should display translated headers', async () => {
    const searchHeader = await aIKnowledgeDocumentSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    expect(await pageHeader.getHeaderText()).toEqual('AIKnowledgeDocument Search')
    expect(await pageHeader.getSubheaderText()).toEqual('Searching and displaying of AIKnowledgeDocument')
  })

  it('should display translated empty message when no search results', async () => {
    const columns = [
      {
        columnType: ColumnType.STRING,
        nameKey: 'COLUMN_KEY',
        id: 'column_1'
      }
    ]
    store.overrideSelector(selectAIKnowledgeDocumentSearchViewModel, {
      ...baseAIKnowledgeDocumentSearchViewModel,
      results: [],
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const interactiveDataView = await aIKnowledgeDocumentSearch.getSearchResults()
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

    store.overrideSelector(selectAIKnowledgeDocumentSearchViewModel, {
      ...baseAIKnowledgeDocumentSearchViewModel,
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

    let diagram = await aIKnowledgeDocumentSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectAIKnowledgeDocumentSearchViewModel, {
      ...baseAIKnowledgeDocumentSearchViewModel,
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

    diagram = await aIKnowledgeDocumentSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectAIKnowledgeDocumentSearchViewModel, {
      ...baseAIKnowledgeDocumentSearchViewModel,
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

    diagram = await aIKnowledgeDocumentSearch.getDiagram()
    expect(diagram).toBeTruthy()
  })
})
