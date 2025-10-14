import { AiKnowledgeBaseSearchActions } from './ai-knowledge-base-search.actions'
import { AiKnowledgeBaseSearchComponent } from './ai-knowledge-base-search.component'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ColumnType, DiagramComponentState, DialogState, InteractiveDataViewComponentState, PortalCoreModule, PortalDialogService, UserService } from '@onecx/portal-integration-angular'
import { ofType, Actions } from '@ngrx/effects'
import { ScannedActionsSubject, Store, StoreModule } from '@ngrx/store'
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
import { AIKnowledgeBase, AiKnowledgeBaseBffService, UpdateAIKnowledgeBaseResponse } from 'src/app/shared/generated'
import { ReplaySubject, of } from 'rxjs'
import { AiKnowledgeBaseSearchEffects } from './ai-knowledge-base-search.effects'
import { HttpResponse } from '@angular/common/http'

describe('AiKnowledgeBaseSearchComponent effects', () => {
  let component: AiKnowledgeBaseSearchComponent
  let fixture: ComponentFixture<AiKnowledgeBaseSearchComponent>
  let store: MockStore<Store>
  let formBuilder: FormBuilder
  let aiKnowledgeBaseSearch: AiKnowledgeBaseSearchHarness
  const actions$ = new ReplaySubject<any>(1)

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const portalDialogServiceMock = {
    openDialog: jest.fn(() => of({ button: 'primary', result: true }))
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
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        AiKnowledgeBaseSearchEffects,
        { provide: ScannedActionsSubject, useValue: new ReplaySubject<any>(1) },
        { provide: PortalDialogService, useValue: portalDialogServiceMock },
        { provide: Actions, useValue: actions$ }
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
  it('should call updateAiKnowledgeBase in effect when editButtonClicked is dispatched', (done) => {
    const aiKnowledgeBaseService = TestBed.inject(AiKnowledgeBaseBffService)
    const mockResponse: UpdateAIKnowledgeBaseResponse = {}
    const spy = jest.spyOn(aiKnowledgeBaseService, 'updateAiKnowledgeBase').mockReturnValue(
      of(new HttpResponse<UpdateAIKnowledgeBaseResponse>({ status: 200, body: mockResponse }))
    )
    const effects = TestBed.inject(AiKnowledgeBaseSearchEffects)
    
    const itemToEdit = { id: '123', name: 'test' }
    
    jest.spyOn(effects['store'], 'select').mockReturnValue(of([itemToEdit]))

    jest.spyOn(effects['portalDialogService'], 'openDialog').mockReturnValue(
      of({ 
        button: 'primary', 
        result: { id: '123', name: 'test' }
      } as DialogState<AIKnowledgeBase>)
    )

    effects.editButtonClicked$.subscribe(() => {
      expect(spy).toHaveBeenCalledWith('123', { 
        aIKnowledgeDocumentData: { id: '123', name: 'test' }
      })
      done()
    })

    actions$.next(AiKnowledgeBaseSearchActions.editButtonClicked({ id: '123' }))
  })

  it('should dispatch editAIKnowledgeBaseFailed when item ID is missing in edit effect', (done) => {
    const effects = TestBed.inject(AiKnowledgeBaseSearchEffects)
    
    const itemToEdit = { id: '123', name: 'test' }
    
    jest.spyOn(effects['store'], 'select').mockReturnValue(of([itemToEdit]))

    jest.spyOn(effects['portalDialogService'], 'openDialog').mockReturnValue(
      of({ 
        button: 'primary', 
        result: { name: 'test' }
      } as DialogState<AIKnowledgeBase>)
    )

    effects.editButtonClicked$.subscribe((action) => {
      if (action.type === AiKnowledgeBaseSearchActions.editAIKnowledgeBaseFailed.type) {
        expect((action as any).error.message).toBe('Item ID is required for update!')
        done()
      }
    })

    actions$.next(AiKnowledgeBaseSearchActions.editButtonClicked({ id: '123' }))
  })

  it('should call deleteAiKnowledgeBase in effect when deleteButtonClicked is dispatched', (done) => {
    const aiKnowledgeBaseService = TestBed.inject(AiKnowledgeBaseBffService)
    const spy = jest.spyOn(aiKnowledgeBaseService, 'deleteAiKnowledgeBase').mockReturnValue(of(new HttpResponse({ status: 200 })))
    const effects = TestBed.inject(AiKnowledgeBaseSearchEffects)
    const itemToDelete = { id: '789', name: 'test' }

    jest.spyOn(effects['store'], 'select').mockReturnValue(of([itemToDelete]))
    jest.spyOn(effects['portalDialogService'], 'openDialog').mockReturnValue(
      of({ button: 'primary', result: true } as DialogState<unknown>)
    )

    effects.deleteButtonClicked$.subscribe(() => {
      expect(spy).toHaveBeenCalledWith('789')
      done()
    })

    actions$.next(AiKnowledgeBaseSearchActions.deleteButtonClicked({ id: '789' }))
  })

  it('should dispatch deleteAiKnowledgeBaseFailed when item to delete is not found (itemToDelete is undefined)', (done) => {
    const effects = TestBed.inject(AiKnowledgeBaseSearchEffects)
    
    jest.spyOn(effects['store'], 'select').mockReturnValue(of([]))
    jest.spyOn(effects['portalDialogService'], 'openDialog').mockReturnValue(
      of({ button: 'primary', result: true } as DialogState<unknown>)
    )

    effects.deleteButtonClicked$.subscribe({
      next: (action) => {
        if (action.type === AiKnowledgeBaseSearchActions.deleteAiKnowledgeBaseFailed.type) {
          expect((action as any).error.message).toBe('Item to delete not found!')
          done()
        }
      },
      error: (error) => {
        fail('Error should be caught by effect and converted to action: ' + error.message)
      }
    })

    actions$.next(AiKnowledgeBaseSearchActions.deleteButtonClicked({ id: 'nonexistent' }))
  })

  it('should dispatch deleteAiKnowledgeBaseFailed when item exists but has no id property', (done) => {
    const effects = TestBed.inject(AiKnowledgeBaseSearchEffects)
     
    const itemWithoutId = { name: 'test' } as any
    jest.spyOn(effects['store'], 'select').mockReturnValue(of([itemWithoutId]))
    
    jest.spyOn(effects['portalDialogService'], 'openDialog').mockReturnValue(
      of({ button: 'primary', result: true } as DialogState<unknown>)
    )

    effects.deleteButtonClicked$.subscribe({
      next: (action) => {
        if (action.type === AiKnowledgeBaseSearchActions.deleteAiKnowledgeBaseFailed.type) {
          expect((action as any).error.message).toBe('Item to delete not found!')
          done()
        }
      },
      error: (error) => {
        fail('Error should be caught by effect and converted to action: ' + error.message)
      }
    })

    actions$.next(AiKnowledgeBaseSearchActions.deleteButtonClicked({ id: 'some-id' }))
  })

  it('should dispatch deleteAiKnowledgeBaseFailed when item exists but has falsy ID', (done) => {
    const effects = TestBed.inject(AiKnowledgeBaseSearchEffects)
     
    // Item with falsy ID, tests second part of optional chaining (!itemToDelete?.id)
    const itemWithFalsyId = { name: 'test', id: '' } as any
    jest.spyOn(effects['store'], 'select').mockReturnValue(of([itemWithFalsyId]))
    
    jest.spyOn(effects['portalDialogService'], 'openDialog').mockReturnValue(
      of({ button: 'primary', result: true } as DialogState<unknown>)
    )

    effects.deleteButtonClicked$.subscribe({
      next: (action) => {
        if (action.type === AiKnowledgeBaseSearchActions.deleteAiKnowledgeBaseFailed.type) {
          expect((action as any).error.message).toBe('Item to delete not found!')
          done()
        }
      },
      error: (error) => {
        fail('Error should be caught by effect and converted to action: ' + error.message)
      }
    })

    actions$.next(AiKnowledgeBaseSearchActions.deleteButtonClicked({ id: '' }))
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