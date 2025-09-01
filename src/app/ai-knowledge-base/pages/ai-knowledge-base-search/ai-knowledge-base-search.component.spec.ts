import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'
import { Store, StoreModule } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { 
  BreadcrumbService,
  ColumnType,
  PortalCoreModule,
  UserService
} from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'
import { AiKnowledgeBaseSearchActions } from './ai-knowledge-base-search.actions'
import { aiKnowledgeBaseSearchColumns } from './ai-knowledge-base-search.columns'
import { AiKnowledgeBaseSearchComponent } from './ai-knowledge-base-search.component'
import { AiKnowledgeBaseSearchHarness } from './ai-knowledge-base-search.harness'
import { initialState } from './ai-knowledge-base-search.reducers'
import { selectAiKnowledgeBaseSearchViewModel } from './ai-knowledge-base-search.selectors'
import { AiKnowledgeBaseSearchViewModel } from './ai-knowledge-base-search.viewmodel'

describe('AiKnowledgeBaseSearchComponent', () => {
  let component: AiKnowledgeBaseSearchComponent
  let fixture: ComponentFixture<AiKnowledgeBaseSearchComponent>
  let store: MockStore<Store>
  let aiKnowledgeBaseSearch: AiKnowledgeBaseSearchHarness

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseAiKnowledgeBaseSearchViewModel: AiKnowledgeBaseSearchViewModel = {
    columns: aiKnowledgeBaseSearchColumns,
    searchCriteria: { id: '1', name: 'Name', description: 'lorem ipsum' },
    searchExecuted: true,
    results: [],
    searchLoadingIndicator: false,
    diagramComponentState: null,
    resultComponentState: null,
    searchHeaderComponentState: null,
    chartVisible: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AiKnowledgeBaseSearchComponent],
      imports: [
        PortalCoreModule,
        LetDirective,
        ReactiveFormsModule,
        StoreModule.forRoot({}),
        TranslateTestingModule.withTranslations('en', require('./../../../../assets/i18n/en.json')).withTranslations(
          'de',
          require('./../../../../assets/i18n/de.json')
        ),
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        DialogService,
        provideMockStore({
          initialState: { aiKnowledgeBase: { search: initialState } }
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
    store.overrideSelector(selectAiKnowledgeBaseSearchViewModel, baseAiKnowledgeBaseSearchViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(AiKnowledgeBaseSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    aiKnowledgeBaseSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, AiKnowledgeBaseSearchHarness)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should dispatch resetButtonClicked action on resetSearch', async () => {
    const doneFn = jest.fn()
    store.overrideSelector(selectAiKnowledgeBaseSearchViewModel, {
      ...baseAiKnowledgeBaseSearchViewModel,
      results: [
        {
          id: '1',
          imagePath: '',
          column_1: 'val_1'
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

    store.scannedActions$.pipe(ofType(AiKnowledgeBaseSearchActions.resetButtonClicked)).subscribe(() => {
      doneFn()
    })

    const searchHeader = await aiKnowledgeBaseSearch.getHeader()
    await searchHeader.clickResetButton()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should have 2 overFlow header actions when search config is disabled', async () => {
    const searchHeader = await aiKnowledgeBaseSearch.getHeader()
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
    store.overrideSelector(selectAiKnowledgeBaseSearchViewModel, {
      ...baseAiKnowledgeBaseSearchViewModel,
      chartVisible: true
    })
    store.refreshState()

    const searchHeader = await aiKnowledgeBaseSearch.getHeader()
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
    store.overrideSelector(selectAiKnowledgeBaseSearchViewModel, {
      ...baseAiKnowledgeBaseSearchViewModel,
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

    const diagram = await (await aiKnowledgeBaseSearch.getDiagram())!.getDiagram()

    expect(await diagram.getTotalNumberOfResults()).toBe(3)
    expect(await diagram.getSumLabel()).toEqual('Total')
  })

  it('should display correct breadcrumbs', async () => {
    const breadcrumbService = TestBed.inject(BreadcrumbService)
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const searchHeader = await aiKnowledgeBaseSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Search')

    expect(await searchBreadcrumbItem!.getText()).toEqual('Search')
  })

  it('should display translated headers', async () => {
    const searchHeader = await aiKnowledgeBaseSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    expect(await pageHeader.getHeaderText()).toEqual('AiKnowledgeBase Search')
    expect(await pageHeader.getSubheaderText()).toEqual('Searching and displaying of AiKnowledgeBase')
  })

  it('should display translated empty message when no search results', async () => {
    const columns = [
      {
        columnType: ColumnType.STRING,
        nameKey: 'COLUMN_KEY',
        id: 'column_1'
      }
    ]
    store.overrideSelector(selectAiKnowledgeBaseSearchViewModel, {
      ...baseAiKnowledgeBaseSearchViewModel,
      results: [],
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const interactiveDataView = await aiKnowledgeBaseSearch.getSearchResults()
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

    store.overrideSelector(selectAiKnowledgeBaseSearchViewModel, {
      ...baseAiKnowledgeBaseSearchViewModel,
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

    let diagram = await aiKnowledgeBaseSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectAiKnowledgeBaseSearchViewModel, {
      ...baseAiKnowledgeBaseSearchViewModel,
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

    diagram = await aiKnowledgeBaseSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectAiKnowledgeBaseSearchViewModel, {
      ...baseAiKnowledgeBaseSearchViewModel,
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

    diagram = await aiKnowledgeBaseSearch.getDiagram()
    expect(diagram).toBeTruthy()
  })

  it('should dispatch export csv data on export action click', async () => {
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
    store.overrideSelector(selectAiKnowledgeBaseSearchViewModel, {
      ...baseAiKnowledgeBaseSearchViewModel,
      results: results,
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const searchHeader = await aiKnowledgeBaseSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const exportAllActionItem = await pageHeader.getOverFlowMenuItem('Export all')
    await exportAllActionItem!.selectItem()

    expect(store.dispatch).toHaveBeenCalledWith(AiKnowledgeBaseSearchActions.exportButtonClicked())
  })
  it('should call createAiKnowledgeBase from actionCallback', () => {
    const spy = jest.spyOn(component, 'createAiKnowledgeBase')
    component.headerActions$.subscribe(actions => {
      actions[0].actionCallback()
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('date mapping logic', () => {
    let component: AiKnowledgeBaseSearchComponent
    let store: MockStore
    let formBuilder: FormBuilder

    beforeEach(() => {
      store = TestBed.inject(MockStore)
      formBuilder = TestBed.inject(FormBuilder)
      const fixture = TestBed.createComponent(AiKnowledgeBaseSearchComponent)
      component = fixture.componentInstance
      jest.spyOn(store, 'dispatch')
    })

    const cases = [
      { value: undefined, expected: undefined, desc: 'undefined value to undefined' },
      { value: null, expected: undefined, desc: 'null value to undefined' },
      {
        value: new Date(2023, 7, 14, 12, 30, 45),
        expected: new Date(Date.UTC(2023, 7, 14, 12, 30, 45)).toISOString(),
        desc: 'valid Date value to UTC ISO string'
      }
    ]

    cases.forEach(({ value, expected, desc }) => {
      it(`should map ${desc} in searchCriteria`, () => {
        const formValue = formBuilder.group({ name: value })
        component.search(formValue)
        expect(store.dispatch).toHaveBeenCalledWith(
          AiKnowledgeBaseSearchActions.searchButtonClicked({
            searchCriteria: { name: expected }
          })
        )
      })
    })
  })
})
