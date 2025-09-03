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
  PortalCoreModule,
  RowListGridData,
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

describe('AiContextSearchComponent', () => {
  let component: AiContextSearchComponent
  let fixture: ComponentFixture<AiContextSearchComponent>
  let store: MockStore<Store>
  let formBuilder: FormBuilder
  let AiContextSearch: AiContextSearchHarness

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
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} } } },
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
    jest.spyOn(store, 'dispatch')
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

    const header = await AiContextSearch.getHeader()
    const createButton = await (await header.getPageHeader()).getInlineActionButtonByIcon(PrimeIcons.PLUS)

    expect(createButton).toBeTruthy()
    await createButton?.click()

    expect(store.dispatch).toHaveBeenCalledWith(AiContextSearchActions.createAiContextButtonClicked())
  })

  it('should dispatch detailsButtonClicked action on details', () => {
    const row: RowListGridData = { id: 'test-id', imagePath: '' }
    component.details(row)
    expect(store.dispatch).toHaveBeenCalledWith(AiContextSearchActions.detailsButtonClicked({ id: 'test-id' }))
  })

describe('searchCriteria mapping', () => {
  const cases = [
    {
      desc: 'should convert Date values to UTC and dispatch searchButtonClicked',
      formValue: { name: new Date(2024, 4, 15, 12, 30, 45) },
      expected: { name: new Date(Date.UTC(2024, 4, 15, 12, 30, 45)).toISOString() }
    },
    {
      desc: 'should pass through non-date, non-empty values unchanged',
      formValue: { name: 'testName' },
      expected: { name: 'testName' }
    },
    {
      desc: 'should set searchCriteria property to undefined for falsy non-date values',
      formValue: { name: '' },
      expected: { name: undefined }
    }
  ]
  cases.forEach(({ desc, formValue, expected }) => {
    it(desc, () => {
      component.aiContextSearchFormGroup = {
        value: formValue,
        getRawValue: () => formValue
      } as any
      component.search(component.aiContextSearchFormGroup)

      const calls = (store.dispatch as jest.Mock).mock.calls
      const found = calls.some(call => {
      const action = call[0]
      return (
        action.type === '[AiContextSearch] Search button clicked' &&
        action.searchCriteria &&
        (
          (action.searchCriteria.name instanceof Date
            ? action.searchCriteria.name.toISOString()
            : action.searchCriteria.name
          ) === expected.name
        )
      )
    })
    expect(found).toBe(true)
    })
  })
})

  it('should handle isValidDate true branch for allowed key (using as any for coverage)', () => {
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

    describe('actions dispatch', () => {
    [
      {
        method: 'resultComponentStateChanged',
        action: AiContextSearchActions.resultComponentStateChanged,
        payload: { groupKey: 'test-group' }
      },
      {
        method: 'searchHeaderComponentStateChanged',
        action: AiContextSearchActions.searchHeaderComponentStateChanged,
        payload: { activeViewMode: 'basic', selectedSearchConfig: 'config1' } as const
      },
      {
        method: 'diagramComponentStateChanged',
        action: AiContextSearchActions.diagramComponentStateChanged,
        payload: { label: 'Test Diagram' }
      }
    ].forEach(({ method, action, payload }) => {
      it(`should dispatch ${action.type} when ${method} is called`, () => {
        (component as any)[method](payload)
        expect(store.dispatch).toHaveBeenCalledWith(action(payload))
      })
    })
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

    component.viewModeChanged('advanced')

    expect(store.dispatch).toHaveBeenCalledWith(AiContextSearchActions.viewModeChanged({ viewMode: 'advanced' }))
  })

  it('should dispatch displayedColumnsChanged on data view column change', async () => {

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

  it.each([
  {
    desc: 'should not display chart when no results',
    viewModel: {
      ...baseAiContextSearchViewModel,
      results: [],
      chartVisible: true,
      columns: [{ columnType: ColumnType.STRING, nameKey: 'COLUMN_KEY', id: 'column_1' }]
    },
    expected: null
  },
  {
    desc: 'should not display chart when toggled to not visible',
    viewModel: {
      ...baseAiContextSearchViewModel,
      results: [{ id: '1', imagePath: '', column_1: 'val_1' }],
      chartVisible: false,
      columns: [{ columnType: ColumnType.STRING, nameKey: 'COLUMN_KEY', id: 'column_1' }]
    },
    expected: null
  },
  {
    desc: 'should display chart when results and chartVisible are true',
    viewModel: {
      ...baseAiContextSearchViewModel,
      results: [{ id: '1', imagePath: '', column_1: 'val_1' }],
      chartVisible: true,
      columns: [{ columnType: ColumnType.STRING, nameKey: 'COLUMN_KEY', id: 'column_1' }]
    },
    expected: true
  }
  ])('$desc', async ({ viewModel, expected }) => {
    component.diagramColumnId = 'column_1'
    store.overrideSelector(selectAiContextSearchViewModel, viewModel)
    store.refreshState()
    const diagram = await AiContextSearch.getDiagram()
    if (expected === null) {
      expect(diagram).toBeNull()
    } else {
      expect(diagram).toBeTruthy()
    }
  })
})
