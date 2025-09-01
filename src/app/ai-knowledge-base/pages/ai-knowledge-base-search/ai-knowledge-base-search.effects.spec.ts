import { AiKnowledgeBaseSearchActions } from './ai-knowledge-base-search.actions'
import { AiKnowledgeBaseSearchComponent } from './ai-knowledge-base-search.component'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ColumnType, DiagramComponentState, InteractiveDataViewComponentState, PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import { ofType } from '@ngrx/effects'
import { Store, StoreModule } from '@ngrx/store'
import { AiKnowledgeBaseSearchHarness } from './ai-knowledge-base-search.harness'
import { AiKnowledgeBaseSearchViewModel } from './ai-knowledge-base-search.viewmodel'
import { aiKnowledgeBaseSearchColumns } from './ai-knowledge-base-search.columns'
import { LetDirective } from '@ngrx/component'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { DialogService } from 'primeng/dynamicdialog'
import { initialState } from './ai-knowledge-base-search.reducers'
import { ActivatedRoute } from '@angular/router'
import { TranslateService } from '@ngx-translate/core'
import { selectAiKnowledgeBaseSearchViewModel } from './ai-knowledge-base-search.selectors'
import { TestbedHarnessEnvironment } from '@onecx/angular-accelerator/testing'

describe('AiKnowledgeBaseSearchComponent effects', () => {
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
})