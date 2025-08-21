/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { BreadcrumbService, ColumnType, DataTableColumn, PortalCoreModule, RowListGridData, UserService } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { PrimeIcons } from 'primeng/api'
import { DialogService } from 'primeng/dynamicdialog'
import { AIKnowledgeDocumentSearchActions } from './aiknowledge-document-search.actions'
import { AIKnowledgeDocumentSearchColumns } from './aiknowledge-document-search.columns'
import { AIKnowledgeDocumentSearchComponent } from './aiknowledge-document-search.component'
import { AIKnowledgeDocumentSearchHarness } from './aiknowledge-document-search.harness'
import { AIKnowledgeDocumentSearchReducer, initialState } from './aiknowledge-document-search.reducers'
import { selectAIKnowledgeDocumentSearchViewModel, selectDisplayedColumns, selectResults } from './aiknowledge-document-search.selectors'
import { AIKnowledgeDocumentSearchViewModel } from './aiknowledge-document-search.viewmodel'
import { AIKnowledgeDocumentSearchCriteriasSchema } from './aiknowledge-document-search.parameters'
import { AIKnowledgeDocumentStatusEnum } from 'src/app/shared/generated'
import { routerNavigatedAction } from '@ngrx/router-store'

describe('AIKnowledgeDocumentSearchComponent', () => {
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
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        stopImmediatePropagation: () => {},
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        stopPropagation: () => {}
      })
    )
  }

  afterAll(() => {
    window.addEventListener = origAddEventListener
    window.postMessage = origPostMessage
  })

  HTMLCanvasElement.prototype.getContext = jest.fn()
  let component: AIKnowledgeDocumentSearchComponent
  let fixture: ComponentFixture<AIKnowledgeDocumentSearchComponent>
  let store: MockStore<Store>
  let formBuilder: FormBuilder
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

  it('should dispatch resetButtonClicked action on resetSearch', async () => {
    const doneFn = jest.fn()
    store.overrideSelector(selectAIKnowledgeDocumentSearchViewModel, {
      ...baseAIKnowledgeDocumentSearchViewModel,
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

    store.scannedActions$.pipe(ofType(AIKnowledgeDocumentSearchActions.resetButtonClicked)).subscribe(() => {
      doneFn()
    })

    const searchHeader = await aIKnowledgeDocumentSearch.getHeader()
    await searchHeader.clickResetButton()
    expect(doneFn).toHaveBeenCalledTimes(1)
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

  it('should dispatch searchButtonClicked action on search', (done) => {
    const formValue = formBuilder.group({
      name: undefined
    })
    component.aIKnowledgeDocumentSearchFormGroup = formValue

    store.scannedActions$.pipe(ofType(AIKnowledgeDocumentSearchActions.searchButtonClicked)).subscribe((a) => {
      expect(a.searchCriteria).toEqual({ name: undefined })
      done()
    })

    component.search(formValue)
  })

  it('should dispatch editAIKnowledgeDocumentButtonClicked action on item edit click', async () => {

    store.overrideSelector(selectAIKnowledgeDocumentSearchViewModel, {
      ...baseAIKnowledgeDocumentSearchViewModel,
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

    const interactiveDataView = await aIKnowledgeDocumentSearch.getSearchResults()
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

    expect(store.dispatch).toHaveBeenCalledWith(
      AIKnowledgeDocumentSearchActions.editAIKnowledgeDocumentButtonClicked({ id: '1' })
    )
  })

  it('should dispatch createAIKnowledgeDocumentButtonClicked action on create click', async () => {

    const header = await aIKnowledgeDocumentSearch.getHeader()
    const createButton = await (await header.getPageHeader()).getInlineActionButtonByIcon(PrimeIcons.PLUS)

    expect(createButton).toBeTruthy()
    await createButton?.click()

    expect(store.dispatch).toHaveBeenCalledWith(
      AIKnowledgeDocumentSearchActions.createAIKnowledgeDocumentButtonClicked()
    )
  })

  it('should export csv data on export action click', async () => {

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
    store.overrideSelector(selectAIKnowledgeDocumentSearchViewModel, {
      ...baseAIKnowledgeDocumentSearchViewModel,
      results: results,
      columns: columns,
      displayedColumns: columns
    })
    store.refreshState()

    const searchHeader = await aIKnowledgeDocumentSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const exportAllActionItem = await pageHeader.getOverFlowMenuItem('Export all')
    await exportAllActionItem!.selectItem()

    expect(store.dispatch).toHaveBeenCalledWith(AIKnowledgeDocumentSearchActions.exportButtonClicked())
  })

  it('should dispatch viewModeChanged action on view mode changes', async () => {

    component.viewModeChanged('advanced')

    expect(store.dispatch).toHaveBeenCalledWith(
      AIKnowledgeDocumentSearchActions.viewModeChanged({ viewMode: 'advanced' })
    )
  })

  it('should dispatch displayedColumnsChanged on data view column change', async () => {

    fixture = TestBed.createComponent(AIKnowledgeDocumentSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    aIKnowledgeDocumentSearch = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      AIKnowledgeDocumentSearchHarness
    )

    jest.clearAllMocks()

    store.overrideSelector(selectAIKnowledgeDocumentSearchViewModel, {
      ...baseAIKnowledgeDocumentSearchViewModel,
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

    const interactiveDataView = await aIKnowledgeDocumentSearch.getSearchResults()
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
      AIKnowledgeDocumentSearchActions.displayedColumnsChanged({
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

    store.overrideSelector(selectAIKnowledgeDocumentSearchViewModel, {
      ...baseAIKnowledgeDocumentSearchViewModel,
      chartVisible: false
    })
    store.refreshState()

    const searchHeader = await aIKnowledgeDocumentSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const showChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    await showChartActionItem!.selectItem()
    expect(store.dispatch).toHaveBeenCalledWith(AIKnowledgeDocumentSearchActions.chartVisibilityToggled())
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
  describe('AIKnowledgeDocumentSearchComponent actions', () => {
    it('should dispatch detailsButtonClicked action on details()', () => {
      const rowData = { id: '123', imagePath: '' } 
      component.details(rowData)
      expect(store.dispatch).toHaveBeenCalledWith(
        AIKnowledgeDocumentSearchActions.detailsButtonClicked({ id: '123' })
      )
    })

    it('should dispatch deleteAIKnowledgeDocumentButtonClicked action on delete()', () => {
      const rowData = { id: '456', imagePath: '' } 
      component.delete(rowData)
      expect(store.dispatch).toHaveBeenCalledWith(
        AIKnowledgeDocumentSearchActions.deleteAIKnowledgeDocumentButtonClicked({ id: '456' })
      )
    })

    it('should map valid Date value to ISO string in searchCriteria (for name)', () => {
      const formBuilder = TestBed.inject(FormBuilder)
      const localDate = new Date(2023, 7, 14, 12, 30, 45)
      const expectedIso = new Date(Date.UTC(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        localDate.getHours(),
        localDate.getMinutes(),
        localDate.getSeconds()
      )).toISOString()

      const formValue = formBuilder.group({ name: localDate })
      component.search(formValue)

      expect(store.dispatch).toHaveBeenCalledWith(
        AIKnowledgeDocumentSearchActions.searchButtonClicked({
          searchCriteria: {
            name: expectedIso
          }
        })
      )
    })
  })

  describe('AIKnowledgeDocumentSearch parameters', () => {
    it('should transform status string to AIKnowledgeDocumentStatusEnum', () => {
      const input = { status: 'NEW' }
      const result = AIKnowledgeDocumentSearchCriteriasSchema.parse(input)
      expect(result.status).toBe('NEW' as AIKnowledgeDocumentStatusEnum)
    })

    it('should allow undefined status', () => {
      const input = {}
      const result = AIKnowledgeDocumentSearchCriteriasSchema.parse(input)
      expect(result.status).toBeUndefined()
    })
  })

  describe('AIKnowledgeDocumentSearchReducer', () => {
    it('should set criteria and searchLoadingIndicator on routerNavigatedAction with valid queryParams', () => {
      const validQueryParams = { name: 'test' }
      const action = routerNavigatedAction({
        payload: {
          routerState: {
            root: {
              queryParams: validQueryParams
            }
          }
        }
      } as any)
      jest.spyOn(AIKnowledgeDocumentSearchCriteriasSchema, 'safeParse').mockReturnValue({
        success: true,
        data: validQueryParams
      } as any)
      const state = AIKnowledgeDocumentSearchReducer(initialState, action)
      expect(state.criteria).toEqual(validQueryParams)
      expect(state.searchLoadingIndicator).toBe(true)
    })

    it('should not change state on routerNavigatedAction with invalid queryParams', () => {
      const action = routerNavigatedAction({
        payload: {
          routerState: {
            root: {
              queryParams: {}
            }
          }
        }
      } as any)
      jest.spyOn(AIKnowledgeDocumentSearchCriteriasSchema, 'safeParse').mockReturnValue({
        success: false
      } as any)
      const state = AIKnowledgeDocumentSearchReducer(initialState, action)
      expect(state).toEqual(initialState)
    })

    it('should reset results and criteria on resetButtonClicked', () => {
      const state = AIKnowledgeDocumentSearchReducer(
        { ...initialState, results: [{
          id: '1',
          name: ''
        }], criteria: { name: 'abc' } },
        AIKnowledgeDocumentSearchActions.resetButtonClicked()
      )
      expect(state.results).toEqual(initialState.results)
      expect(state.criteria).toEqual({})
    })

    it('should set searchLoadingIndicator and criteria on searchButtonClicked', () => {
      const criteria = { name: 'abc' }
      const state = AIKnowledgeDocumentSearchReducer(
        initialState,
        AIKnowledgeDocumentSearchActions.searchButtonClicked({ searchCriteria: criteria })
      )
      expect(state.searchLoadingIndicator).toBe(true)
      expect(state.criteria).toEqual(criteria)
    })

    it('should set results on aIKnowledgeDocumentSearchResultsReceived', () => {
      const results = [
        { id: '1', imagePath: '', name: 'Document 1' }
      ]
      const state = AIKnowledgeDocumentSearchReducer(
        initialState,
        AIKnowledgeDocumentSearchActions.aIKnowledgeDocumentSearchResultsReceived({
          results,
          totalNumberOfResults: results.length
        })
      )
      expect(state.results).toEqual(results)
    })

    it('should clear results on aIKnowledgeDocumentSearchResultsLoadingFailed', () => {
      const state = AIKnowledgeDocumentSearchReducer(
        { ...initialState, results: [{
          id: '1',
          name: ''
        }] },
        AIKnowledgeDocumentSearchActions.aIKnowledgeDocumentSearchResultsLoadingFailed({ error: null })
      )
      expect(state.results).toEqual([])
    })

    it('should set chartVisible on chartVisibilityRehydrated', () => {
      const state = AIKnowledgeDocumentSearchReducer(
        initialState,
        AIKnowledgeDocumentSearchActions.chartVisibilityRehydrated({ visible: true })
      )
      expect(state.chartVisible).toBe(true)
    })

    it('should toggle chartVisible on chartVisibilityToggled', () => {
      const state = AIKnowledgeDocumentSearchReducer(
        { ...initialState, chartVisible: false },
        AIKnowledgeDocumentSearchActions.chartVisibilityToggled()
      )
      expect(state.chartVisible).toBe(true)
    })

    it('should set viewMode on viewModeChanged', () => {
      const state = AIKnowledgeDocumentSearchReducer(
        initialState,
        AIKnowledgeDocumentSearchActions.viewModeChanged({ viewMode: 'advanced' })
      )
      expect(state.viewMode).toBe('advanced')
    })

    it('should set displayedColumns on displayedColumnsChanged', () => {
      const displayedColumns = [
        { id: 'col1', nameKey: 'Col1', columnType: ColumnType.STRING },
        { id: 'col2', nameKey: 'Col2', columnType: ColumnType.STRING }
      ]
      const state = AIKnowledgeDocumentSearchReducer(
        initialState,
        AIKnowledgeDocumentSearchActions.displayedColumnsChanged({ displayedColumns })
      )
      expect(state.displayedColumns).toEqual(['col1', 'col2'])
    })
  })

  describe('AIKnowledgeDocumentSearch selectors', () => {
    it('should map results to RowListGridData', () => {
      const results = [
        { id: '1', name: 'Doc1', documentRefId: 'ref1', status: AIKnowledgeDocumentStatusEnum.New },
        { id: '2', name: 'Doc2', documentRefId: 'ref2', status: AIKnowledgeDocumentStatusEnum.Processing }
      ]
      const mapped = selectResults.projector(results)
      expect(mapped).toEqual([
        { imagePath: '', id: '1', name: 'Doc1', documentRefId: 'ref1', status: 'NEW' },
        { imagePath: '', id: '2', name: 'Doc2', documentRefId: 'ref2', status: 'PROCESSING' }
      ] as RowListGridData[])
    })

    it('should map displayedColumns to DataTableColumn[]', () => {
      const columns: DataTableColumn[] = [
        { id: 'col1', nameKey: 'Col1', columnType: ColumnType.STRING },
        { id: 'col2', nameKey: 'Col2', columnType: ColumnType.STRING }
      ]
      const displayedColumns = ['col2', 'col1']
      const mapped = selectDisplayedColumns.projector(columns, displayedColumns)
      expect(mapped).toEqual([
        columns[1], 
        columns[0]  
      ])
    })

    it('should return empty array if displayedColumns is undefined', () => {
      const columns: DataTableColumn[] = [
        { id: 'col1', nameKey: 'Col1', columnType: ColumnType.STRING }
      ]
      const mapped = selectDisplayedColumns.projector(columns, [])
      expect(mapped).toEqual([])

      const mappedNull = selectDisplayedColumns.projector(columns, null)
      expect(mappedNull).toEqual([])
    })

    it('should build AIKnowledgeDocumentSearchViewModel', () => {
      const columns: DataTableColumn[] = [
        { id: 'col1', nameKey: 'Col1', columnType: ColumnType.STRING }
      ]
      const searchCriteria = { name: 'Doc' }
      const results: RowListGridData[] = [
        { imagePath: '', id: '1', name: 'Doc1', documentRefId: 'ref1', status: 'NEW' }
      ]
      const displayedColumns: DataTableColumn[] = columns
      const viewMode = 'basic'
      const chartVisible = true

      const vm = selectAIKnowledgeDocumentSearchViewModel.projector(
        columns,
        searchCriteria,
        results,
        displayedColumns,
        viewMode,
        chartVisible
      )
      expect(vm).toEqual({
        columns,
        searchCriteria,
        results,
        displayedColumns,
        viewMode,
        chartVisible
      })
    })
    it('should map falsy values to empty string', () => {
      const stateResults = [
        { id: '', name: '', documentRefId: '', status: undefined } 
      ]
      const result = selectResults.projector(stateResults)
      expect(result).toEqual([
        {
          imagePath: '',
          id: '',
          name: '',
          documentRefId: '',
          status: ''
        }
      ])
    })
    
    it('should map enum values to string', () => {
      const stateResults = [
        { id: '123', name: 'Doc', documentRefId: 'ref-1', status: AIKnowledgeDocumentStatusEnum.Embedded }
      ]
      const result = selectResults.projector(stateResults)
      expect(result).toEqual([
        {
          imagePath: '',
          id: '123',
          name: 'Doc',
          documentRefId: 'ref-1',
          status: 'EMBEDDED'
        }
      ])
    })
  })
})
