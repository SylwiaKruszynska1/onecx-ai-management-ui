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
  DiagramComponentState, 
  GroupByCountDiagramComponentState, 
  InteractiveDataViewComponentState, 
  PortalCoreModule, 
  SearchHeaderComponentState, 
  UserService 
} from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'
import { AiKnowledgeBaseSearchActions } from './ai-knowledge-base-search.actions'
import { aiKnowledgeBaseSearchColumns } from './ai-knowledge-base-search.columns'
import { AiKnowledgeBaseSearchComponent } from './ai-knowledge-base-search.component'
import { AiKnowledgeBaseSearchHarness } from './ai-knowledge-base-search.harness'
import { aiKnowledgeBaseSearchReducer, initialState } from './ai-knowledge-base-search.reducers'
import { selectAiKnowledgeBaseSearchViewModel, selectResults } from './ai-knowledge-base-search.selectors'
import { AiKnowledgeBaseSearchViewModel } from './ai-knowledge-base-search.viewmodel'
import { aiKnowledgeBaseSearchCriteriasSchema } from './ai-knowledge-base-search.parameters'
import { routerNavigatedAction } from '@ngrx/router-store'
import { ZodError } from 'zod'

describe('AiKnowledgeBaseSearchComponent', () => {
  const origAddEventListener = window.addEventListener
  const origPostMessage = window.postMessage

  let listeners: any[] = []
  window.addEventListener = (_type: any, listener: any) => {
    listeners.push(listener)
  }

  window.removeEventListener = (_type: any, listener: any) => {
    listeners = listeners.filter((l) => l !== listener)
  }

  window.postMessage = (m: any) => {
    listeners.forEach((l) =>
      l({
        data: m,
        stopImmediatePropagation: () => {},
        stopPropagation: () => {}
      })
    )
  }

  afterAll(() => {
    window.addEventListener = origAddEventListener
    window.postMessage = origPostMessage
  })

  HTMLCanvasElement.prototype.getContext = jest.fn()
  let component: AiKnowledgeBaseSearchComponent
  let fixture: ComponentFixture<AiKnowledgeBaseSearchComponent>
  let store: MockStore<Store>
  let formBuilder: FormBuilder
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

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }))
    })
  })

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
        FormBuilder,
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
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

  it('should dispatch searchButtonClicked action on search', (done) => {
    const formValue = formBuilder.group({
      changeMe: '123'
    })
    component.aiKnowledgeBaseSearchFormGroup = formValue

    store.scannedActions$.pipe(ofType(AiKnowledgeBaseSearchActions.searchButtonClicked)).subscribe((a) => {
      expect(a.searchCriteria).toEqual({ changeMe: '123' })
      done()
    })

    component.search(formValue)
  })

  it('should dispatch viewModeChanged action on view mode changes', async () => {
    jest.spyOn(store, 'dispatch')

    component.searchHeaderComponentStateChanged({
      activeViewMode: 'advanced'
    })

    expect(store.dispatch).toHaveBeenCalledWith(
      AiKnowledgeBaseSearchActions.searchHeaderComponentStateChanged({
        activeViewMode: 'advanced'
      })
    )
  })

  it('should dispatch displayedColumnsChanged on data view column change', async () => {
    jest.spyOn(store, 'dispatch')

    fixture = TestBed.createComponent(AiKnowledgeBaseSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    aiKnowledgeBaseSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, AiKnowledgeBaseSearchHarness)

    jest.clearAllMocks()

    store.overrideSelector(selectAiKnowledgeBaseSearchViewModel, {
      ...baseAiKnowledgeBaseSearchViewModel,
      columns: [
        {
          columnType: ColumnType.STRING,
          nameKey: 'COLUMN_KEY',
          id: 'column_1'
        },
        {
          columnType: ColumnType.STRING,
          nameKey: 'SECOND_COLUMN_KEY',
          id: 'column_2'
        }
      ]
    })
    store.refreshState()

    const interactiveDataView = await aiKnowledgeBaseSearch.getSearchResults()
    const columnGroupSelector = await interactiveDataView?.getCustomGroupColumnSelector()
    expect(columnGroupSelector).toBeTruthy()
    await columnGroupSelector!.openCustomGroupColumnSelectorDialog()
    const pickList = await columnGroupSelector!.getPicklist()
    const transferControlButtons = await pickList.getTransferControlsButtons()
    expect(transferControlButtons.length).toBe(4)
    const activateAllColumnsButton = transferControlButtons[3]
    await activateAllColumnsButton.click()
    const saveButton = await columnGroupSelector!.getSaveButton()
    await saveButton.click()

    expect(store.dispatch).toHaveBeenCalledWith(
      AiKnowledgeBaseSearchActions.displayedColumnsChanged({
        displayedColumns: [
          {
            columnType: ColumnType.STRING,
            nameKey: 'COLUMN_KEY',
            id: 'column_1'
          },
          {
            columnType: ColumnType.STRING,
            nameKey: 'SECOND_COLUMN_KEY',
            id: 'column_2'
          }
        ]
      })
    )
  })

  it('should dispatch chartVisibilityToggled on show/hide chart header', async () => {
    jest.spyOn(store, 'dispatch')

    store.overrideSelector(selectAiKnowledgeBaseSearchViewModel, {
      ...baseAiKnowledgeBaseSearchViewModel,
      chartVisible: false
    })
    store.refreshState()

    const searchHeader = await aiKnowledgeBaseSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const showChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    await showChartActionItem!.selectItem()
    expect(store.dispatch).toHaveBeenCalledWith(AiKnowledgeBaseSearchActions.chartVisibilityToggled())
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
  describe('aiKnowledgeBaseSearchReducer', () => {
    it('should return state for unknown action', () => {
      const state = aiKnowledgeBaseSearchReducer(initialState, { type: 'UNKNOWN' } as any)
      expect(state).toBe(initialState)
    })

    it('should reset results and criteria on resetButtonClicked', () => {
      const state = aiKnowledgeBaseSearchReducer(
        { ...initialState, results: [{ id: '1' }], criteria: { name: 'test' }, searchExecuted: true },
        AiKnowledgeBaseSearchActions.resetButtonClicked()
      )
      expect(state.results).toEqual(initialState.results)
      expect(state.criteria).toEqual({})
      expect(state.searchExecuted).toBe(false)
    })

    it('should set criteria on searchButtonClicked', () => {
      const criteria = { name: 'test' }
      const state = aiKnowledgeBaseSearchReducer(
        initialState,
        AiKnowledgeBaseSearchActions.searchButtonClicked({ searchCriteria: criteria })
      )
      expect(state.criteria).toEqual(criteria)
    })

    it('should set results on aiKnowledgeBaseSearchResultsReceived', () => {
      const stream = [{ id: '1' }, { id: '2' }]
      const state = aiKnowledgeBaseSearchReducer(
        initialState,
        AiKnowledgeBaseSearchActions.aiKnowledgeBaseSearchResultsReceived({
          stream,
          size: 2,
          number: 0,
          totalElements: 2,
          totalPages: 1
        })
      )
      expect(state.results).toEqual(stream)
      expect(state.searchLoadingIndicator).toBe(false)
      expect(state.searchExecuted).toBe(true)
    })

    it('should clear results on aiKnowledgeBaseSearchResultsLoadingFailed', () => {
      const state = aiKnowledgeBaseSearchReducer(
        { ...initialState, results: [{ id: '1' }] },
        AiKnowledgeBaseSearchActions.aiKnowledgeBaseSearchResultsLoadingFailed({ error: null })
      )
      expect(state.results).toEqual([])
      expect(state.searchLoadingIndicator).toBe(false)
    })

    it('should toggle chartVisible on chartVisibilityToggled', () => {
      const state = aiKnowledgeBaseSearchReducer(
        { ...initialState, chartVisible: false },
        AiKnowledgeBaseSearchActions.chartVisibilityToggled()
      )
      expect(state.chartVisible).toBe(true)
    })

    it('should set displayedColumns on displayedColumnsChanged', () => {
      const displayedColumns = [
        { id: 'col1', nameKey: 'Col1', columnType: ColumnType.STRING },
        { id: 'col2', nameKey: 'Col2', columnType: ColumnType.STRING }
      ]
      const state = aiKnowledgeBaseSearchReducer(
        initialState,
        AiKnowledgeBaseSearchActions.displayedColumnsChanged({ displayedColumns })
      )
      expect(state.displayedColumns).toEqual(['col1', 'col2'])
    })

    it('should update criteria and searchLoadingIndicator on routerNavigatedAction with valid queryParams', () => {
      jest.spyOn(aiKnowledgeBaseSearchCriteriasSchema, 'safeParse').mockReturnValue({
        success: true,
        data: { name: 'test' }
      })
      const queryParams = { name: 'test' }
      const action = routerNavigatedAction({
        payload: {
          routerState: {
            root: { queryParams }
          }
        }
      } as any)
      const state = aiKnowledgeBaseSearchReducer(initialState, action)
      expect(state.criteria).toEqual({ name: 'test' })
      expect(state.searchLoadingIndicator).toBe(true)
    })

    it('should not update state on routerNavigatedAction with invalid queryParams', () => {
      jest.spyOn(aiKnowledgeBaseSearchCriteriasSchema, 'safeParse').mockReturnValue({
        success: false,
        error: new ZodError([]) 
      })
      const queryParams = { invalid: true }
      const action = routerNavigatedAction({
        payload: {
          routerState: {
            root: { queryParams }
          }
        }
      } as any)
      const state = aiKnowledgeBaseSearchReducer(initialState, action)
      expect(state).toEqual(initialState)
    })

    it('should update resultComponentState on resultComponentStateChanged', () => {
      const payload = { layout: 'grid' } as any
      const state = aiKnowledgeBaseSearchReducer(
        initialState,
        AiKnowledgeBaseSearchActions.resultComponentStateChanged(payload)
      )
      expect(state.resultComponentState).not.toBeNull()
      expect(state.resultComponentState!.layout).toEqual(payload.layout)
    })

    it('should update searchHeaderComponentState on searchHeaderComponentStateChanged', () => {
      const payload = { activeViewMode: 'advanced' } as any
      const state = aiKnowledgeBaseSearchReducer(
        initialState,
        AiKnowledgeBaseSearchActions.searchHeaderComponentStateChanged(payload)
      )
      expect(state.searchHeaderComponentState).not.toBeNull()
      expect(state.searchHeaderComponentState!.activeViewMode).toEqual(payload.activeViewMode)
    })

    it('should update diagramComponentState on diagramComponentStateChanged', () => {
      const payload = { activeDiagramType: 'pie' } as unknown as DiagramComponentState
      const state = aiKnowledgeBaseSearchReducer(
        initialState,
        AiKnowledgeBaseSearchActions.diagramComponentStateChanged(payload)
      )
      expect(state.diagramComponentState).not.toBeNull()
      expect(state.diagramComponentState!.activeDiagramType).toEqual(payload.activeDiagramType)
    })
  })

  describe('dispatch actions', () => {
    const actions = [
      { method: 'resultComponentStateChanged', action: AiKnowledgeBaseSearchActions.resultComponentStateChanged, payload: { layout: 'grid' } as InteractiveDataViewComponentState },
      { method: 'diagramComponentStateChanged', action: AiKnowledgeBaseSearchActions.diagramComponentStateChanged, payload: { activeDiagramType: 'pie' } as unknown as DiagramComponentState },
      { method: 'details', action: AiKnowledgeBaseSearchActions.detailsButtonClicked, payload: { id: '123', imagePath: '' }, expected: { id: '123' } },
      { method: 'createAiKnowledgeBase', action: AiKnowledgeBaseSearchActions.createButtonClicked, payload: undefined },
      { method: 'edit', action: AiKnowledgeBaseSearchActions.editButtonClicked, payload: { id: '456', imagePath: '' }, expected: { id: '456' } },
      { method: 'delete', action: AiKnowledgeBaseSearchActions.deleteButtonClicked, payload: { id: '789', imagePath: '' }, expected: { id: '789' } }
    ]

    actions.forEach(({ method, action, payload, expected }) => {
      it(`should dispatch ${action.type} from ${method}`, () => {
        if (payload !== undefined) {
          (component as any)[method](payload)
          expect(store.dispatch).toHaveBeenCalledWith(
            expected ? action(expected) : action(payload)
          )
        } else {
          (component as any)[method]()
          expect(store.dispatch).toHaveBeenCalledWith(
            action()
          )
        }
      })
    })
  })
  it('should call createAiKnowledgeBase from actionCallback', () => {
    const spy = jest.spyOn(component, 'createAiKnowledgeBase')
    component.headerActions$.subscribe(actions => {
      actions[0].actionCallback()
      expect(spy).toHaveBeenCalled()
    })
  })

  describe('aiKnowledgeBaseSearch selectors', () => {
    it('should add imagePath to each result in selectResults', () => {
      const results = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }]
      const selected = selectResults.projector(results)
      expect(selected).toEqual([
        { imagePath: '', id: '1', name: 'A' },
        { imagePath: '', id: '2', name: 'B' }
      ])
    })

    it('should build AiKnowledgeBaseSearchViewModel in selectAiKnowledgeBaseSearchViewModel', () => {
      const columns = [
        { id: 'col1', nameKey: 'Col1', columnType: ColumnType.STRING },
        { id: 'col2', nameKey: 'Col2', columnType: ColumnType.STRING }
      ]
      const searchCriteria = { name: 'test' }
      const results = [{ imagePath: '', id: '1' }]
      const resultComponentState: InteractiveDataViewComponentState = {
        layout: 'grid'
      }
      const searchHeaderComponentState: SearchHeaderComponentState = {
        activeViewMode: 'advanced'
      }
      const diagramComponentState: GroupByCountDiagramComponentState = {}
      const chartVisible = true
      const searchLoadingIndicator = false
      const searchExecuted = true

      const vm: AiKnowledgeBaseSearchViewModel = selectAiKnowledgeBaseSearchViewModel.projector(
        columns,
        searchCriteria,
        results,
        resultComponentState,
        searchHeaderComponentState,
        diagramComponentState,
        chartVisible,
        searchLoadingIndicator,
        searchExecuted
      )
      expect(vm).toEqual({
        columns,
        searchCriteria,
        results,
        resultComponentState,
        searchHeaderComponentState,
        diagramComponentState,
        chartVisible,
        searchLoadingIndicator,
        searchExecuted
      })
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
