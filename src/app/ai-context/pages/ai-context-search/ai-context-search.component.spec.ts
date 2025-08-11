import { PrimeIcons } from 'primeng/api'
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClientTesting } from '@angular/common/http/testing'
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
  InteractiveDataViewComponentState,
  PortalCoreModule,
  RowListGridData,
  SearchHeaderComponentState,
  UserService
} from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'
import { AiContextSearchActions } from './ai-context-search.actions'
import { aiContextSearchColumns } from './ai-context-search.columns'
import { AiContextSearchComponent } from './ai-context-search.component'
import { AiContextSearchHarness } from './ai-context-search.harness'
import { initialState } from './ai-context-search.reducers'
import { selectAiContextSearchViewModel } from './ai-context-search.selectors'
import { AiContextSearchViewModel } from './ai-context-search.viewmodel'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import * as selectors from './ai-context-search.selectors'
describe('AiContextSearchComponent', () => {
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
  let component: AiContextSearchComponent
  let fixture: ComponentFixture<AiContextSearchComponent>
  let store: MockStore<Store>
  let formBuilder: FormBuilder
  let AiContextSearch: AiContextSearchHarness

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseAiContextSearchViewModel: AiContextSearchViewModel = {
    columns: aiContextSearchColumns,
    searchCriteria: {
      appId: '',
      name: '',
      description: ''
    },
    results: [],
    displayedColumns: [],
    chartVisible: false,
    resultComponentState: null,
    searchHeaderComponentState: null,
    diagramComponentState: null,
    searchLoadingIndicator: false,
    searchExecuted: false
  }

  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn()
      }))
    })
  })

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AiContextSearchComponent],
      imports: [
        PortalCoreModule,
        LetDirective,
        ReactiveFormsModule,
        StoreModule.forRoot({}),
        TranslateTestingModule.withTranslations('en', require('./../../../../assets/i18n/en.json')).withTranslations(
          'de',
          require('./../../../../assets/i18n/de.json')
        ),
        NoopAnimationsModule
      ],
      providers: [
        DialogService,
        provideMockStore({
          initialState: { AiContext: { search: initialState } }
        }),
        FormBuilder,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
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
    store.overrideSelector(selectAiContextSearchViewModel, baseAiContextSearchViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(AiContextSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    AiContextSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, AiContextSearchHarness)
  })

  it('should create the component', () => {
    expect(component).toBeTruthy()
  })

  it('should dispatch resetButtonClicked action on resetSearch', async () => {
    const doneFn = jest.fn()
    store.overrideSelector(selectAiContextSearchViewModel, {
      ...baseAiContextSearchViewModel,
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

    store.scannedActions$.pipe(ofType(AiContextSearchActions.resetButtonClicked)).subscribe(() => {
      doneFn()
    })

    const searchHeader = await AiContextSearch.getHeader()
    await searchHeader.clickResetButton()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should have 2 overFlow header actions when search config is disabled', async () => {
    const searchHeader = await AiContextSearch.getHeader()
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
    store.overrideSelector(selectAiContextSearchViewModel, {
      ...baseAiContextSearchViewModel,
      chartVisible: true
    })
    store.refreshState()

    const searchHeader = await AiContextSearch.getHeader()
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
    store.overrideSelector(selectAiContextSearchViewModel, {
      ...baseAiContextSearchViewModel,
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

    const diagram = await (await AiContextSearch.getDiagram())!.getDiagram()

    expect(await diagram.getTotalNumberOfResults()).toBe(3)
    expect(await diagram.getSumLabel()).toEqual('Total')
  })

  it('should display correct breadcrumbs', async () => {
    const breadcrumbService = TestBed.inject(BreadcrumbService)
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const searchHeader = await AiContextSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Search')

    expect(await searchBreadcrumbItem!.getText()).toEqual('Search')
  })

  it('should dispatch searchButtonClicked action on search', (done) => {
    const formValue = formBuilder.group({
      changeMe: '123'
    })
    component.aiContextSearchFormGroup = formValue

    store.scannedActions$.pipe(ofType(AiContextSearchActions.searchButtonClicked)).subscribe((a) => {
      expect(a.searchCriteria).toEqual({ changeMe: '123' })
      done()
    })

    component.search(formValue)
  })

  it('should dispatch editAiContextButtonClicked action on item edit click', async () => {
    jest.spyOn(store, 'dispatch')

    store.overrideSelector(selectAiContextSearchViewModel, {
      ...baseAiContextSearchViewModel,
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

    const interactiveDataView = await AiContextSearch.getSearchResults()
    const dataView = await interactiveDataView.getDataView()
    const dataTable = await dataView.getDataTable()
    const rowActionButtons = await dataTable?.getActionButtons()

    expect(rowActionButtons?.length).toBeGreaterThan(0)
    let editButton
    for (const actionButton of rowActionButtons ?? []) {
      const icon = await actionButton.getAttribute('ng-reflect-icon')
      expect(icon).toBeTruthy()
      if (icon == 'pi pi-pencil') {
        editButton = actionButton
      }
    }
    expect(editButton).toBeTruthy()
    editButton?.click()

    expect(store.dispatch).toHaveBeenCalledWith(AiContextSearchActions.editAiContextButtonClicked({ id: '1' }))
  })

  it('should dispatch aiKnowledgeVectorDetailsClicked on on item delete click', async () => {
    jest.spyOn(store, 'dispatch')

    store.overrideSelector(selectAiContextSearchViewModel, {
      ...baseAiContextSearchViewModel,
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

    const interactiveDataView = await AiContextSearch.getSearchResults()
    const dataView = await interactiveDataView.getDataView()
    const dataTable = await dataView.getDataTable()
    const rowActionButtons = await dataTable?.getActionButtons()

    expect(rowActionButtons?.length).toBeGreaterThan(0)
    let deleteButton
    for (const actionButton of rowActionButtons ?? []) {
      const icon = await actionButton.getAttribute('ng-reflect-icon')
      expect(icon).toBeTruthy()
      if (icon == PrimeIcons.TRASH) {
        deleteButton = actionButton
      }
    }
    expect(deleteButton).toBeTruthy()
    deleteButton?.click()

    expect(store.dispatch).toHaveBeenCalledWith(AiContextSearchActions.deleteAiContextButtonClicked({ id: '1' }))
  })

  it('should dispatch createAiContextButtonClicked action on create click', async () => {
    jest.spyOn(store, 'dispatch')

    const header = await AiContextSearch.getHeader()
    const createButton = await (await header.getPageHeader()).getInlineActionButtonByIcon(PrimeIcons.PLUS)

    expect(createButton).toBeTruthy()
    await createButton?.click()

    expect(store.dispatch).toHaveBeenCalledWith(AiContextSearchActions.createAiContextButtonClicked())
  })

  it('should dispatch detailsButtonClicked action on details', () => {
    jest.spyOn(store, 'dispatch')
    const row: RowListGridData = { id: 'test-id', imagePath: '' }
    component.details(row)
    expect(store.dispatch).toHaveBeenCalledWith(AiContextSearchActions.detailsButtonClicked({ id: 'test-id' }))
  })

  it('should convert Date values to UTC and dispatch searchButtonClicked with correct searchCriteria', () => {
    jest.spyOn(store, 'dispatch')
    const formValue = {
      appId: 'appId',
      name: 'testName',
      description: 'testDescription'
    }
    component.aiContextSearchFormGroup = {
      value: formValue,
      getRawValue: () => formValue
    } as any

    component.search(component.aiContextSearchFormGroup)

    expect(store.dispatch).toHaveBeenCalledWith(
      AiContextSearchActions.searchButtonClicked({
        searchCriteria: {
          appId: 'appId',
          name: 'testName',
          description: 'testDescription'
        }
      })
    )
  })
  it('should pass through non-date, non-empty values unchanged in searchCriteria', () => {
    jest.spyOn(store, 'dispatch')
    const formValue = {
      name: 'testName'
    }
    component.aiContextSearchFormGroup = {
      value: formValue,
      getRawValue: () => formValue
    } as any

    component.search(component.aiContextSearchFormGroup)

    expect(store.dispatch).toHaveBeenCalledWith(
      AiContextSearchActions.searchButtonClicked({
        searchCriteria: {
          name: 'testName'
        }
      })
    )
  })

  it('should set searchCriteria property to undefined for falsy non-date values', () => {
    jest.spyOn(store, 'dispatch')
    const formValue = {
      name: ''
    }
    component.aiContextSearchFormGroup = {
      value: formValue,
      getRawValue: () => formValue
    } as any

    component.search(component.aiContextSearchFormGroup)

    expect(store.dispatch).toHaveBeenCalledWith(
      AiContextSearchActions.searchButtonClicked({
        searchCriteria: {
          name: undefined
        }
      })
    )
  })

  it('should handle isValidDate true branch for allowed key (using as any for coverage)', () => {
    jest.spyOn(store, 'dispatch')
    const testDate = new Date(2024, 4, 15, 12, 30, 45)
    const formValue = {
      appId: testDate as any
    }
    component.aiContextSearchFormGroup = {
      value: formValue,
      getRawValue: () => formValue
    } as any

    component.search(component.aiContextSearchFormGroup)

    expect(store.dispatch).toHaveBeenCalledWith(
      AiContextSearchActions.searchButtonClicked({
        searchCriteria: {
          appId: new Date(
            Date.UTC(
              testDate.getFullYear(),
              testDate.getMonth(),
              testDate.getDate(),
              testDate.getHours(),
              testDate.getMinutes(),
              testDate.getSeconds()
            )
          ) as any
        }
      })
    )
  })

  it('should pass through non-date, non-empty values unchanged in searchCriteria', () => {
    jest.spyOn(store, 'dispatch')
    const formValue = {
      name: 'testName'
    }
    component.aiContextSearchFormGroup = {
      value: formValue,
      getRawValue: () => formValue
    } as any

    component.search(component.aiContextSearchFormGroup)

    expect(store.dispatch).toHaveBeenCalledWith(
      AiContextSearchActions.searchButtonClicked({
        searchCriteria: {
          name: 'testName'
        }
      })
    )
  })

  it('should set searchCriteria property to undefined for falsy non-date values', () => {
    jest.spyOn(store, 'dispatch')
    const formValue = {
      name: ''
    }
    component.aiContextSearchFormGroup = {
      value: formValue,
      getRawValue: () => formValue
    } as any

    component.search(component.aiContextSearchFormGroup)

    expect(store.dispatch).toHaveBeenCalledWith(
      AiContextSearchActions.searchButtonClicked({
        searchCriteria: {
          name: undefined
        }
      })
    )
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
    store.overrideSelector(selectAiContextSearchViewModel, {
      ...baseAiContextSearchViewModel,
      results: results,
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const searchHeader = await AiContextSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const exportAllActionItem = await pageHeader.getOverFlowMenuItem('Export all')
    await exportAllActionItem!.selectItem()

    expect(store.dispatch).toHaveBeenCalledWith(AiContextSearchActions.exportButtonClicked())
  })

  it('should dispatch viewModeChanged action on view mode changes', async () => {
    jest.spyOn(store, 'dispatch')

    component.viewModeChanged('advanced')

    expect(store.dispatch).toHaveBeenCalledWith(AiContextSearchActions.viewModeChanged({ viewMode: 'advanced' }))
  })

  it('should dispatch displayedColumnsChanged on data view column change', async () => {
    jest.spyOn(store, 'dispatch')

    fixture = TestBed.createComponent(AiContextSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    AiContextSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, AiContextSearchHarness)

    expect(store.dispatch).toHaveBeenCalledWith(
      AiContextSearchActions.displayedColumnsChanged({ displayedColumns: aiContextSearchColumns })
    )

    jest.clearAllMocks()

    store.overrideSelector(selectAiContextSearchViewModel, {
      ...baseAiContextSearchViewModel,
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

    const interactiveDataView = await AiContextSearch.getSearchResults()
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
      AiContextSearchActions.displayedColumnsChanged({
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

    store.overrideSelector(selectAiContextSearchViewModel, {
      ...baseAiContextSearchViewModel,
      chartVisible: false
    })
    store.refreshState()

    const searchHeader = await AiContextSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const showChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    await showChartActionItem!.selectItem()
    expect(store.dispatch).toHaveBeenCalledWith(AiContextSearchActions.chartVisibilityToggled())
  })

  it('should display translated headers', async () => {
    const searchHeader = await AiContextSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    expect(await pageHeader.getHeaderText()).toEqual('AiContext Search')
    expect(await pageHeader.getSubheaderText()).toEqual('Searching and displaying of AiContext')
  })

  it('should display translated empty message when no search results', async () => {
    const columns = [
      {
        columnType: ColumnType.STRING,
        nameKey: 'COLUMN_KEY',
        id: 'column_1'
      }
    ]
    store.overrideSelector(selectAiContextSearchViewModel, {
      ...baseAiContextSearchViewModel,
      results: [],
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const interactiveDataView = await AiContextSearch.getSearchResults()
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

    store.overrideSelector(selectAiContextSearchViewModel, {
      ...baseAiContextSearchViewModel,
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

    let diagram = await AiContextSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectAiContextSearchViewModel, {
      ...baseAiContextSearchViewModel,
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

    diagram = await AiContextSearch.getDiagram()
    expect(diagram).toBeNull()

    store.overrideSelector(selectAiContextSearchViewModel, {
      ...baseAiContextSearchViewModel,
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

    diagram = await AiContextSearch.getDiagram()
    expect(diagram).toBeTruthy()
  })

  it('should dispatch resultComponentStateChanged action when resultComponentStateChanged is called', () => {
    jest.spyOn(store, 'dispatch')
    const mockState: InteractiveDataViewComponentState = { groupKey: 'test-group' } as InteractiveDataViewComponentState

    component.resultComponentStateChanged(mockState)

    expect(store.dispatch).toHaveBeenCalledWith(AiContextSearchActions.resultComponentStateChanged(mockState))
  })

  it('should dispatch searchHeaderComponentStateChanged action when searchHeaderComponentStateChanged is called', () => {
    jest.spyOn(store, 'dispatch')
    const mockState: SearchHeaderComponentState = {
      activeViewMode: 'basic',
      selectedSearchConfig: 'config1'
    } as SearchHeaderComponentState

    component.searchHeaderComponentStateChanged(mockState)

    expect(store.dispatch).toHaveBeenCalledWith(AiContextSearchActions.searchHeaderComponentStateChanged(mockState))
  })

  it('should dispatch diagramComponentStateChanged action when diagramComponentStateChanged is called', () => {
    jest.spyOn(store, 'dispatch')
    const mockState: DiagramComponentState = { label: 'Test Diagram' } as DiagramComponentState

    component.diagramComponentStateChanged(mockState)

    expect(store.dispatch).toHaveBeenCalledWith(AiContextSearchActions.diagramComponentStateChanged(mockState))
  })

  describe('AiContextSearchReducer', () => {
    const { aiContextSearchReducer, initialState } = require('./ai-context-search.reducers')
    const { AiContextSearchActions } = require('./ai-context-search.actions')

    it('should reset results and criteria on resetButtonClicked', () => {
      const preState = { ...initialState, results: [{ id: '1' }], criteria: { test: 'val' } }
      const action = AiContextSearchActions.resetButtonClicked()
      const state = aiContextSearchReducer(preState, action)
      expect(state.results).toEqual([])
      expect(state.criteria).toEqual({})
    })

    it('should set searchLoadingIndicator and criteria on searchButtonClicked', () => {
      const searchCriteria = { name: 'foo' }
      const action = AiContextSearchActions.searchButtonClicked({ searchCriteria })
      const state = aiContextSearchReducer(initialState, action)
      expect(state.searchLoadingIndicator).toBe(true)
      expect(state.criteria).toEqual(searchCriteria)
    })

    it('should set results on aiContextSearchResultsReceived', () => {
      const stream = [{ id: '1' }, { id: '2' }]
      const action = AiContextSearchActions.aiContextSearchResultsReceived({ stream })
      const state = aiContextSearchReducer(initialState, action)
      expect(state.results).toEqual(stream)
    })

    it('should clear results on aiContextSearchResultsLoadingFailed', () => {
      const preState = { ...initialState, results: [{ id: '1' }] }
      const action = AiContextSearchActions.aiContextSearchResultsLoadingFailed()
      const state = aiContextSearchReducer(preState, action)
      expect(state.results).toEqual([])
    })

    it('should toggle chartVisible on chartVisibilityToggled', () => {
      const initialStateWithChartHidden = { ...initialState, chartVisible: false }
      const action = AiContextSearchActions.chartVisibilityToggled()
      let state = aiContextSearchReducer(initialStateWithChartHidden, action)
      expect(state.chartVisible).toBe(true)

      const stateWithChartVisible = { ...initialState, chartVisible: true }
      state = aiContextSearchReducer(stateWithChartVisible, action)
      expect(state.chartVisible).toBe(false)
    })

    it('should update resultComponentState when resultComponentStateChanged', () => {
      const newComponentState = {
        groupKey: 'someValue'
      }

      const action = AiContextSearchActions.resultComponentStateChanged(newComponentState)
      const state = aiContextSearchReducer(initialState, action)

      expect(state.resultComponentState).toBeDefined()
      expect(state.resultComponentState.groupKey).toBe('someValue')
      expect(state).not.toBe(initialState)
    })

    it('should update searchHeaderComponentState when searchHeaderComponentStateChanged', () => {
      const newHeaderState = {
        activeViewMode: 'basic',
        selectedSearchConfig: 'config1'
      }

      const action = AiContextSearchActions.searchHeaderComponentStateChanged(newHeaderState)
      const state = aiContextSearchReducer(initialState, action)

      expect(state.searchHeaderComponentState).toBeDefined()
      expect(state.searchHeaderComponentState.activeViewMode).toBe('basic')
      expect(state.searchHeaderComponentState.selectedSearchConfig).toBe('config1')
      expect(state).not.toBe(initialState)
    })

    it('should update diagramComponentState when diagramComponentStateChanged', () => {
      const newDiagramState = {
        activeDiagramType: 'PIE'
      }

      const action = AiContextSearchActions.diagramComponentStateChanged(newDiagramState)
      const state = aiContextSearchReducer(initialState, action)

      expect(state.diagramComponentState).toBeDefined()
      expect(state.diagramComponentState.activeDiagramType).toBe('PIE')
      expect(state).not.toBe(initialState)
    })

    it('should set viewMode on viewModeChanged', () => {
      const action = AiContextSearchActions.viewModeChanged({ viewMode: 'advanced' })
      const state = aiContextSearchReducer(initialState, action)
      expect(state.viewMode).toBe('advanced')
    })

    it('should set displayedColumns on displayedColumnsChanged', () => {
      const displayedColumns = [{ id: 'col1' }, { id: 'col2' }]
      const action = AiContextSearchActions.displayedColumnsChanged({ displayedColumns })
      const state = aiContextSearchReducer(initialState, action)
      expect(state.displayedColumns).toEqual(['col1', 'col2'])
    })

    it('should set criteria and searchLoadingIndicator=true when routerNavigatedAction succeeds and queryParams present', () => {
      const { routerNavigatedAction } = require('@ngrx/router-store')
      const mockSchema = require('./ai-context-search.parameters')
      jest.spyOn(mockSchema.aiContextSearchCriteriasSchema, 'safeParse').mockReturnValue({
        success: true,
        data: { foo: 'bar' }
      })
      const preState = { ...initialState, criteria: {}, searchLoadingIndicator: false }
      const action = routerNavigatedAction({ payload: { routerState: { root: { queryParams: { foo: 'bar' } } } } })
      const state = aiContextSearchReducer(preState, action)
      expect(state.criteria).toEqual({ foo: 'bar' })
      expect(state.searchLoadingIndicator).toBe(true)
    })

    it('should not change state when routerNavigatedAction fails schema parse', () => {
      const { routerNavigatedAction } = require('@ngrx/router-store')
      const mockSchema = require('./ai-context-search.parameters')
      jest.spyOn(mockSchema.aiContextSearchCriteriasSchema, 'safeParse').mockReturnValue({
        success: false
      })
      const preState = { ...initialState, criteria: { foo: 'bar' }, searchLoadingIndicator: true }
      const action = routerNavigatedAction({ payload: { routerState: { root: { queryParams: { foo: 'bar' } } } } })
      const state = aiContextSearchReducer(preState, action)
      expect(state).toBe(preState)
    })
  })

  describe('AiContextSearch selectors', () => {
    it('selectResults should map results to RowListGridData[]', () => {
      const state = {
        ...initialState,
        results: [
          { id: '1', name: 'A', description: 'desc', vdb: 'vdb1', vdbCollection: 'c1' },
          { id: '2', name: 'B', description: 'desc2', vdb: 'vdb2', vdbCollection: 'c2' }
        ]
      }
      const result = selectors.selectResults.projector(state.results)
      expect(result).toEqual([
        { imagePath: '', id: '1', name: 'A', description: 'desc', vdb: 'vdb1', vdbCollection: 'c1' },
        { imagePath: '', id: '2', name: 'B', description: 'desc2', vdb: 'vdb2', vdbCollection: 'c2' }
      ])
    })

    it('selectResults should use empty string fallback when item.id is falsy', () => {
      const state = {
        ...initialState,
        results: [
          { id: undefined, name: 'A', description: 'desc' },
          { id: '', name: 'B', description: 'desc2' },
          { name: 'C', description: 'desc3' }
        ]
      }
      const result = selectors.selectResults.projector(state.results)
      expect(result).toEqual([
        { imagePath: '', id: '', name: 'A', description: 'desc' },
        { imagePath: '', id: '', name: 'B', description: 'desc2' },
        { imagePath: '', id: '', name: 'C', description: 'desc3' }
      ])
    })

    it('selectDisplayedColumns should map displayedColumns ids to columns', () => {
      const columns = [
        { id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING },
        { id: 'col2', nameKey: 'Col 2', columnType: ColumnType.STRING }
      ]
      const displayedColumns = ['col2', 'col1']
      const result = selectors.selectDisplayedColumns.projector(columns, displayedColumns)
      expect(result).toEqual([
        { id: 'col2', nameKey: 'Col 2', columnType: ColumnType.STRING },
        { id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING }
      ])
    })

    it('selectAiContextSearchViewModel should combine all selector results', () => {
      const columns = [{ id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING }]
      const searchCriteria = {
        name: 'Test Name',
        description: 'Test Description',
        vdb: 'vdb1',
        vdbCollection: 'collection1',
        id: 1,
        limit: 10
      }
      const results = [{ imagePath: '', id: '1', name: 'A', description: 'desc', vdb: 'vdb1', vdbCollection: 'c1' }]
      const displayedColumns = [{ id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING }]
      const chartVisible = true

      const result = selectors.selectAiContextSearchViewModel.projector(
        columns,
        searchCriteria,
        results,
        displayedColumns,
        null,
        null,
        null,
        chartVisible,
        false,
        true
      )
      expect(result).toEqual({
        columns,
        searchCriteria,
        results,
        displayedColumns,
        resultComponentState: null,
        searchHeaderComponentState: null,
        diagramComponentState: null,
        chartVisible,
        searchLoadingIndicator: false,
        searchExecuted: true
      })
    })

    it('selectDisplayedColumns should return [] if displayedColumns is undefined', () => {
      const columns = [
        { id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING },
        { id: 'col2', nameKey: 'Col 2', columnType: ColumnType.STRING }
      ]
      const displayedColumns = null
      const result = selectors.selectDisplayedColumns.projector(columns, displayedColumns)
      expect(result).toEqual([])
    })
  })
})
