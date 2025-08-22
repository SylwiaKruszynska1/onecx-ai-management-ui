import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { AIProviderDetailsComponent } from './aiprovider-details.component'
import { AIProviderDetailsHarness } from './aiprovider-details.harness'
import { initialState } from './aiprovider-details.reducers'
import { selectAIProviderDetailsViewModel } from './aiprovider-details.selectors'
import { AIProviderDetailsViewModel } from './aiprovider-details.viewmodel'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { ReactiveFormsModule } from '@angular/forms'
import { AIProviderSearchActions } from '../aiprovider-search/aiprovider-search.actions'
import { AIProviderDetailsActions } from './aiprovider-details.actions'
import { firstValueFrom } from 'rxjs'

describe('AIProviderDetailsComponent actions & dispatch', () => {
  let component: AIProviderDetailsComponent
  let fixture: ComponentFixture<AIProviderDetailsComponent>
  let store: MockStore<Store>
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
    fixture.detectChanges()
    aIProviderDetails = await TestbedHarnessEnvironment.harnessForFixture(fixture, AIProviderDetailsHarness)
  })

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
