import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { BreadcrumbService, PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { AIProviderDetailsComponent } from './aiprovider-details.component'
import { AIProviderDetailsHarness } from './aiprovider-details.harness'
import { aIProviderDetailsReducer, initialState } from './aiprovider-details.reducers'
import { selectAIProviderDetailsViewModel } from './aiprovider-details.selectors'
import { AIProviderDetailsViewModel } from './aiprovider-details.viewmodel'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { ReactiveFormsModule } from '@angular/forms'
import { AIProviderSearchActions } from '../aiprovider-search/aiprovider-search.actions'
import { AIProviderDetailsActions } from './aiprovider-details.actions'
import { firstValueFrom } from 'rxjs'
import { AIProviderDetailsState } from './aiprovider-details.state'

describe('AIProviderDetailsComponent', () => {
  const origAddEventListener = window.addEventListener
  const origPostMessage = window.postMessage

  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable @typescript-eslint/no-empty-function */
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
  /* eslint-enable @typescript-eslint/no-explicit-any */
  /* eslint-enable @typescript-eslint/no-empty-function */

  afterAll(() => {
    window.addEventListener = origAddEventListener
    window.postMessage = origPostMessage
  })

  let component: AIProviderDetailsComponent
  let fixture: ComponentFixture<AIProviderDetailsComponent>
  let store: MockStore<Store>
  let breadcrumbService: BreadcrumbService
  let aIProviderDetails: AIProviderDetailsHarness

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseAIProviderDetaulsViewModel: AIProviderDetailsViewModel = {
    details: {
      id: '1',
      name: 'Test name',
      description: 'Test description',
      llmUrl: 'Test llmUrl',
      modelName: 'Test modelName',
      modelVersion: 'Test modelVersion',
      appId: 'Test AppId',
      apiKey: 'TestAPIKey'
    },
    editMode: false,
    isApiKeyHidden: false
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AIProviderDetailsComponent],
      imports: [
        PortalCoreModule,
        LetDirective,
        ReactiveFormsModule,
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        TranslateTestingModule.withTranslations('en', require('./../../../../assets/i18n/en.json')).withTranslations(
          'de',
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('./../../../../assets/i18n/de.json')
        )
      ],
      providers: [
        provideMockStore({
          initialState: { aIProvider: { details: initialState } }
        }),
        BreadcrumbService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents()

    const userService = TestBed.inject(UserService)
    userService.hasPermission = () => true
    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectAIProviderDetailsViewModel, baseAIProviderDetaulsViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(AIProviderDetailsComponent)
    component = fixture.componentInstance
    breadcrumbService = TestBed.inject(BreadcrumbService)
    fixture.detectChanges()
    aIProviderDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, AIProviderDetailsHarness)
  })
  
  describe('AIProviderDetailsComponent UI', () => {
    it('should create', () => {
      expect(component).toBeTruthy()
    })

    it('should display correct breadcrumbs', async () => {
      jest.spyOn(breadcrumbService, 'setItems')

      component.ngOnInit()
      fixture.detectChanges()

      expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
      const pageHeader = await aIProviderDetails.getHeader()
      const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Details')
      expect(await searchBreadcrumbItem!.getText()).toEqual('Details')
    })

    it('should display translated headers', async () => {
      const pageHeader = await aIProviderDetails.getHeader()
      expect(await pageHeader.getHeaderText()).toEqual('AIProvider Details')
      expect(await pageHeader.getSubheaderText()).toEqual('Display of AIProvider Details')
    })

    it('should have 2 inline actions', async () => {
      const pageHeader = await aIProviderDetails.getHeader()
      const inlineActions = await pageHeader.getInlineActionButtons()
      expect(inlineActions.length).toBe(2)

      const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
      expect(backAction).toBeTruthy()

      const editAction = await pageHeader.getInlineActionButtonByLabel('Edit')
      expect(editAction).toBeTruthy()
    })

    it('should navigate back on back button click', async () => {
      jest.spyOn(window.history, 'back')

      const pageHeader = await aIProviderDetails.getHeader()
      const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
      await backAction?.click()

      expect(window.history.back).toHaveBeenCalledTimes(1)
    })
    it('should display item details in form fields', async () => {
      store.overrideSelector(selectAIProviderDetailsViewModel, baseAIProviderDetaulsViewModel)
      store.refreshState()
  
      const pageDetails = component.formGroup.value
      expect(pageDetails).toEqual({
        name: 'Test name',
        description: 'Test description',
        llmUrl: 'Test llmUrl',
        modelName: 'Test modelName',
        modelVersion: 'Test modelVersion',
        appId: 'Test AppId',
        apiKey: 'TestAPIKey'
      })
    })
  })
  
  describe('AIProviderDetailsComponent actions', () => {
    it('should call toggleEditMode(true) when Edit action is clicked', async () => {
      const toggleSpy = jest.spyOn(component, 'toggleEditMode')
      const pageHeader = await aIProviderDetails.getHeader()
      const editAction = await pageHeader.getInlineActionButtonByLabel('Edit')
      await editAction?.click()
      expect(toggleSpy).toHaveBeenCalledWith(true)
    })

    it('should call delete with empty string if details.id is undefined', async () => {
      const deleteSpy = jest.spyOn(component, 'delete')
      store.overrideSelector(selectAIProviderDetailsViewModel, {
        details: undefined,
        editMode: false,
        isApiKeyHidden: false
      })
      store.refreshState()
      fixture.detectChanges()
      await fixture.whenStable()

      const actions = await firstValueFrom(component.headerActions$)
      const deleteAction = actions.find(a => a.labelKey === 'AI_PROVIDER_DETAILS.GENERAL.DELETE')
      expect(deleteAction).toBeDefined()
      deleteAction!.actionCallback()
      expect(deleteSpy).toHaveBeenCalledWith('')
    })

    it('should call edit with empty string if details.id is undefined', async () => {
      const editSpy = jest.spyOn(component, 'edit')
      store.overrideSelector(selectAIProviderDetailsViewModel, {
        details: undefined,
        editMode: true,
        isApiKeyHidden: false
      })
      store.refreshState()
      fixture.detectChanges()

      const pageHeader = await aIProviderDetails.getHeader()
      const saveAction = await pageHeader.getInlineActionButtonByLabel('Save')
      await saveAction?.click()
      expect(editSpy).toHaveBeenCalledWith('')
    })

    it('should call edit and toggleEditMode(false) when Save action is clicked', async () => {
      const editSpy = jest.spyOn(component, 'edit')
      const toggleSpy = jest.spyOn(component, 'toggleEditMode')

      store.overrideSelector(selectAIProviderDetailsViewModel, {
        ...baseAIProviderDetaulsViewModel,
        editMode: true
      })
      store.refreshState()
      fixture.detectChanges()

      const pageHeader = await aIProviderDetails.getHeader()
      const saveAction = await pageHeader.getInlineActionButtonByLabel('Save')
      await saveAction?.click()

      expect(editSpy).toHaveBeenCalledWith('1')
      expect(toggleSpy).toHaveBeenCalledWith(false)
    })

    it('should call delete with correct id when Delete action is triggered', async () => {
      const deleteSpy = jest.spyOn(component, 'delete')

      store.overrideSelector(selectAIProviderDetailsViewModel, {
        ...baseAIProviderDetaulsViewModel,
        editMode: false
      })
      store.refreshState()
      fixture.detectChanges()
      await fixture.whenStable()

      const actions = await firstValueFrom(component.headerActions$)
      const deleteAction = actions.find(a => a.labelKey === 'AI_PROVIDER_DETAILS.GENERAL.DELETE')

      expect(deleteAction).toBeDefined()
      deleteAction!.actionCallback()

      expect(deleteSpy).toHaveBeenCalledWith('1')
    })

    it('should call toggleEditMode(false) when Cancel action is clicked', async () => {
      const toggleSpy = jest.spyOn(component, 'toggleEditMode')

      store.overrideSelector(selectAIProviderDetailsViewModel, {
        ...baseAIProviderDetaulsViewModel,
        editMode: true
      })
      store.refreshState()
      fixture.detectChanges()

      const pageHeader = await aIProviderDetails.getHeader()
      const cancelAction = await pageHeader.getInlineActionButtonByLabel('Cancel')
      await cancelAction?.click()

      expect(toggleSpy).toHaveBeenCalledWith(false)
    })

    it('should patch form fields with empty string if details fields are undefined', async () => {
      store.overrideSelector(selectAIProviderDetailsViewModel, {
        details: {id: ''},
        editMode: false,
        isApiKeyHidden: false
      })
      store.refreshState()
      fixture.detectChanges()

      const pageDetails = component.formGroup.value
      expect(pageDetails).toEqual({
        name: '',
        description: undefined,
        llmUrl: undefined,
        modelName: undefined,
        modelVersion: undefined,
        appId: undefined,
        apiKey: undefined
      })
    })
    it('should not throw when disabling apiKey field if formGroup or apiKey is missing', () => {
      component.formGroup.removeControl('apiKey')
      expect(() => component.formGroup.get('apiKey')?.disable()).not.toThrow()
    })
  })

  describe('AIProviderDetailsComponent dispatch', () => {
    it('should dispatch editAiproviderDetailsButtonClicked action on edit()', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.edit('123')
      expect(dispatchSpy).toHaveBeenCalledWith(
        AIProviderSearchActions.editAiproviderDetailsButtonClicked({ id: '123' })
      )
    })
    it('should dispatch deleteAiproviderButtonClicked action on delete()', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.delete('456')
      expect(dispatchSpy).toHaveBeenCalledWith(
        AIProviderSearchActions.deleteAiproviderButtonClicked({ id: '456' })
      )
    })

    it('should enable form and dispatch editMode true on toggleEditMode(true)', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      jest.spyOn(component['user'], 'hasPermission').mockReturnValue(true)

      component.toggleEditMode(true)

      expect(dispatchSpy).toHaveBeenCalledWith(
        AIProviderDetailsActions.aiproviderDetailsEditModeSet({ editMode: true })
      )
      expect(component.formGroup.enabled).toBe(true)
    })

    it('should disable form and dispatch editMode false on toggleEditMode(false)', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')

      component.toggleEditMode(false)

      expect(dispatchSpy).toHaveBeenCalledWith(
        AIProviderDetailsActions.aiproviderDetailsEditModeSet({ editMode: false })
      )
      expect(component.formGroup.disabled).toBe(true)
    })

    it('should disable apiKey field if user lacks permission', () => {
      jest.spyOn(component['user'], 'hasPermission').mockReturnValue(false)

      component.toggleEditMode(true)

      expect(component.formGroup.get('apiKey')?.disabled).toBe(true)
    })
    it('should dispatch apiKeyVisibilityToggled action on toggleApiKeyVisibility()', () => {
      const dispatchSpy = jest.spyOn(store, 'dispatch')
      component.toggleApiKeyVisibility()
      expect(dispatchSpy).toHaveBeenCalledWith(
        AIProviderDetailsActions.apiKeyVisibilityToggled()
      )
    })
  })

  describe('selectAIProviderDetailsViewModel', () => {
    it('should return correct view model for all fields', () => {
      const details = { id: '1', name: 'Test', apiKey: 'key' } as any
      const result = selectAIProviderDetailsViewModel.projector(details, true, false)
      expect(result).toEqual({ details, editMode: true, isApiKeyHidden: false })
    })

    it('should handle undefined details', () => {
      const result = selectAIProviderDetailsViewModel.projector(undefined, false, true)
      expect(result).toEqual({ details: undefined, editMode: false, isApiKeyHidden: true })
    })
  })

  describe('aIProviderDetailsReducer', () => {
    it('should set details on aiproviderDetailsReceived', () => {
      const details = { id: '1', name: 'Test' } as any
      const action = AIProviderDetailsActions.aiproviderDetailsReceived({ details })
      const state = aIProviderDetailsReducer(initialState, action)
      expect(state.details).toEqual(details)
    })


    it('should set details to undefined on aiproviderDetailsLoadingFailed', () => {
      const prevState: AIProviderDetailsState = { ...initialState, details: { id: '1' } as any }
      const action = AIProviderDetailsActions.aiproviderDetailsLoadingFailed({ error: null })
      const state = aIProviderDetailsReducer(prevState, action)
      expect(state.details).toBeUndefined()
    })

    it('should reset state on navigatedToDetailsPage', () => {
      const prevState: AIProviderDetailsState = { details: { id: '1' } as any, editMode: true, isApiKeyHidden: false }
      const action = AIProviderDetailsActions.navigatedToDetailsPage({ id: undefined })
      const state = aIProviderDetailsReducer(prevState, action)
      expect(state).toEqual(initialState)
    })


    it('should set editMode on aiproviderDetailsEditModeSet', () => {
      const action = AIProviderDetailsActions.aiproviderDetailsEditModeSet({ editMode: true })
      const state = aIProviderDetailsReducer(initialState, action)
      expect(state.editMode).toBe(true)
    })

    it('should toggle isApiKeyHidden on apiKeyVisibilityToggled', () => {
      const prevState: AIProviderDetailsState = { ...initialState, isApiKeyHidden: true }
      const action = AIProviderDetailsActions.apiKeyVisibilityToggled()
      const state = aIProviderDetailsReducer(prevState, action)
      expect(state.isApiKeyHidden).toBe(false)
    })
  })

  describe('apiKey control safety', () => {
    it('should safely call disable on apiKey control if it exists', () => {
      const userMock = { hasPermission: () => false }
      const component = new AIProviderDetailsComponent(store, breadcrumbService, userMock as any)
      jest.spyOn(component.formGroup.get('apiKey')!, 'disable')
      component.toggleEditMode(true)
      expect(component.formGroup.get('apiKey')?.disable).toHaveBeenCalled()
    })

    it('should not throw if apiKey control does not exist', () => {
      const userMock = { hasPermission: () => false }
      const component = new AIProviderDetailsComponent(store, breadcrumbService, userMock as any)
      component.formGroup.removeControl('apiKey')
      expect(() => component.toggleEditMode(true)).not.toThrow()
    })
  })
})
