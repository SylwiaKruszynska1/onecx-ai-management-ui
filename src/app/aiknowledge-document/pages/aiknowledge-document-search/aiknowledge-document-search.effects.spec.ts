import { Store, StoreModule } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { ColumnType, PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { PrimeIcons } from 'primeng/api'
import { DialogService } from 'primeng/dynamicdialog'
import { AIKnowledgeDocumentSearchActions } from './aiknowledge-document-search.actions'
import { AIKnowledgeDocumentSearchColumns } from './aiknowledge-document-search.columns'
import { AIKnowledgeDocumentSearchComponent } from './aiknowledge-document-search.component'
import { AIKnowledgeDocumentSearchHarness } from './aiknowledge-document-search.harness'
import { initialState } from './aiknowledge-document-search.reducers'
import { selectAIKnowledgeDocumentSearchViewModel } from './aiknowledge-document-search.selectors'
import { AIKnowledgeDocumentSearchViewModel } from './aiknowledge-document-search.viewmodel'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { TestbedHarnessEnvironment } from '@onecx/angular-accelerator/testing'
import { ActivatedRoute } from '@angular/router'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { LetDirective } from '@ngrx/component'
import { ofType } from '@ngrx/effects'

describe('AIKnowledgeDocumentSearchComponent actions', () => {
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AIKnowledgeDocumentSearchComponent],
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
          initialState: { aIKnowledgeDocument: { search: initialState } }
        }),
        FormBuilder,
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents()

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
})
  