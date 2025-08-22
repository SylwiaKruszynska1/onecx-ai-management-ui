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
import { initialState } from './aiprovider-details.reducers'
import { selectAIProviderDetailsViewModel } from './aiprovider-details.selectors'
import { AIProviderDetailsViewModel } from './aiprovider-details.viewmodel'
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { ReactiveFormsModule } from '@angular/forms'

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
