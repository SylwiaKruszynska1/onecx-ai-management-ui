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
import { ColumnType, PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { DialogService } from 'primeng/dynamicdialog'
import { AIProviderSearchActions } from './aiprovider-search.actions'
import { AIProviderSearchColumns } from './aiprovider-search.columns'
import { AIProviderSearchComponent } from './aiprovider-search.component'
import { AIProviderSearchHarness } from './aiprovider-search.harness'
import { initialState} from './aiprovider-search.reducers'
import { selectAIProviderSearchViewModel } from './aiprovider-search.selectors'
import { AIProviderSearchViewModel } from './aiprovider-search.viewmodel'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { PrimeIcons } from 'primeng/api'

describe('AIProviderSearchComponent effects', () => {
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


 
  it('should dispatch resetButtonClicked action on resetSearch', async () => {
    const doneFn = jest.fn()
    store.overrideSelector(selectAIProviderSearchViewModel, {
      ...baseAIProviderSearchViewModel,
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

    store.scannedActions$.pipe(ofType(AIProviderSearchActions.resetButtonClicked)).subscribe(() => {
      doneFn()
    })

    const searchHeader = await AIProviderSearch.getHeader()
    await searchHeader.clickResetButton()
    expect(doneFn).toHaveBeenCalledTimes(1)
  })

  it('should dispatch searchButtonClicked action on search', (done) => {
    const formValue = formBuilder.group({
      changeMe: '123'
    })
    component.AIProviderSearchFormGroup = formValue

    store.scannedActions$.pipe(ofType(AIProviderSearchActions.searchButtonClicked)).subscribe((a) => {
      expect(a.searchCriteria).toEqual({ changeMe: '123' })
      done()
    })

    component.search(formValue)
  })

  it('should dispatch detailsButtonClicked action on item details click', async () => {
    jest.spyOn(store, 'dispatch')

    store.overrideSelector(selectAIProviderSearchViewModel, {
      ...baseAIProviderSearchViewModel,
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

    const interactiveDataView = await AIProviderSearch.getSearchResults()
    const dataView = await interactiveDataView.getDataView()
    const dataTable = await dataView.getDataTable()
    const rowActionButtons = await dataTable?.getActionButtons()

    expect(rowActionButtons?.length).toEqual(3)
    expect(await rowActionButtons?.at(0)?.getAttribute('ng-reflect-icon')).toEqual('pi pi-eye')
    await rowActionButtons?.at(0)?.click()

    expect(store.dispatch).toHaveBeenCalledWith(AIProviderSearchActions.detailsButtonClicked({ id: '1' }))
  })

  it('should dispatch aiKnowledgeVectorDetailsClicked on on item delete click', async () => {
    jest.spyOn(store, 'dispatch')

    store.overrideSelector(selectAIProviderSearchViewModel, {
      ...baseAIProviderSearchViewModel,
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

    const interactiveDataView = await AIProviderSearch.getSearchResults()
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

    expect(store.dispatch).toHaveBeenCalledWith(
      AIProviderSearchActions.deleteAiproviderButtonClicked({ id: '1' }))
  })

  it('should dispatch viewModeChanged action on view mode changes', async () => {
    jest.spyOn(store, 'dispatch')

    component.viewModeChanged('advanced')

    expect(store.dispatch).toHaveBeenCalledWith(AIProviderSearchActions.viewModeChanged({ viewMode: 'advanced' }))
  })

  it('should dispatch displayedColumnsChanged on data view column change', async () => {
    jest.spyOn(store, 'dispatch')

    fixture = TestBed.createComponent(AIProviderSearchComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
    AIProviderSearch = await TestbedHarnessEnvironment.harnessForFixture(fixture, AIProviderSearchHarness)

    expect(store.dispatch).toHaveBeenCalledWith(
      AIProviderSearchActions.displayedColumnsChanged({ displayedColumns: AIProviderSearchColumns })
    )

    jest.clearAllMocks()

    store.overrideSelector(selectAIProviderSearchViewModel, {
      ...baseAIProviderSearchViewModel,
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

    const interactiveDataView = await AIProviderSearch.getSearchResults()
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
      AIProviderSearchActions.displayedColumnsChanged({
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

    store.overrideSelector(selectAIProviderSearchViewModel, {
      ...baseAIProviderSearchViewModel,
      chartVisible: false
    })
    store.refreshState()

    const searchHeader = await AIProviderSearch.getHeader()
    const pageHeader = await searchHeader.getPageHeader()
    const overflowActionButton = await pageHeader.getOverflowActionMenuButton()
    await overflowActionButton?.click()

    const showChartActionItem = await pageHeader.getOverFlowMenuItem('Show chart')
    await showChartActionItem!.selectItem()
    expect(store.dispatch).toHaveBeenCalledWith(AIProviderSearchActions.chartVisibilityToggled())
  })

  it('should dispatch createAiproviderButtonClicked action on create()', () => {
    jest.spyOn(store, 'dispatch')
    component.create()
    expect(store.dispatch).toHaveBeenCalledWith(AIProviderSearchActions.createAiproviderButtonClicked())
  })

  it('should dispatch editAiproviderButtonClicked action on edit()', () => {
    jest.spyOn(store, 'dispatch')
    component.edit({ id: '123', imagePath: '' }) 
    expect(store.dispatch).toHaveBeenCalledWith(
      AIProviderSearchActions.editAiproviderButtonClicked({ id: '123' })
    )
  })
  it('should call create() when headerActions$ actionCallback is triggered', (done) => {
    jest.spyOn(component, 'create')
    jest.spyOn(store, 'dispatch')

    component.ngOnInit()
    component.headerActions$.subscribe((actions) => {
      const createAction = actions.find(a => a.labelKey === 'AI_PROVIDER_CREATE_UPDATE.ACTION.CREATE')
      expect(createAction).toBeTruthy()
      createAction!.actionCallback()
      expect(component.create).toHaveBeenCalled()
      expect(store.dispatch).toHaveBeenCalledWith(AIProviderSearchActions.createAiproviderButtonClicked())
      done()
    })
  })
})
