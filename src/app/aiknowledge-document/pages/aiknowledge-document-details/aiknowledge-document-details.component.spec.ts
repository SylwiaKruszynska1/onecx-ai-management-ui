/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed'
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { Store } from '@ngrx/store'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { TranslateService } from '@ngx-translate/core'
import { BreadcrumbService, PortalCoreModule, UserService } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { PrimeIcons } from 'primeng/api'
import { of } from 'rxjs'
import { AIKnowledgeDocumentDetailsComponent } from './aiknowledge-document-details.component'
import { AIKnowledgeDocumentDetailsHarness } from './aiknowledge-document-details.harness'
import { initialState } from './aiknowledge-document-details.reducers'
import { selectAIKnowledgeDocumentDetailsViewModel } from './aiknowledge-document-details.selectors'
import { AIKnowledgeDocumentDetailsViewModel } from './aiknowledge-document-details.viewmodel'
import { AIKnowledgeDocument, AIKnowledgeDocumentStatusEnum } from 'src/app/shared/generated'

describe('AIKnowledgeDocumentDetailsComponent', () => {
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

  let component: AIKnowledgeDocumentDetailsComponent
  let fixture: ComponentFixture<AIKnowledgeDocumentDetailsComponent>
  let store: MockStore<Store>
  let breadcrumbService: BreadcrumbService
  let aIKnowledgeDocumentDetails: AIKnowledgeDocumentDetailsHarness

  const mockActivatedRoute = {
    snapshot: {
      data: {}
    }
  }
  const baseAIKnowledgeDocumentDetaulsViewModel: AIKnowledgeDocumentDetailsViewModel = {
    details: undefined
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AIKnowledgeDocumentDetailsComponent],
      imports: [
        PortalCoreModule,
        LetDirective,
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        TranslateTestingModule.withTranslations('en', require('./../../../../assets/i18n/en.json')).withTranslations(
          'de',
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('./../../../../assets/i18n/de.json')
        ),
        HttpClientTestingModule
      ],
      providers: [
        provideMockStore({
          initialState: { aIKnowledgeDocument: { details: initialState } }
        }),
        BreadcrumbService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents()

    const userService = TestBed.inject(UserService)
    userService.hasPermission = () => true
    const translateService = TestBed.inject(TranslateService)
    translateService.use('en')

    store = TestBed.inject(MockStore)
    store.overrideSelector(selectAIKnowledgeDocumentDetailsViewModel, baseAIKnowledgeDocumentDetaulsViewModel)
    store.refreshState()

    fixture = TestBed.createComponent(AIKnowledgeDocumentDetailsComponent)
    component = fixture.componentInstance
    breadcrumbService = TestBed.inject(BreadcrumbService)
    fixture.detectChanges()
    aIKnowledgeDocumentDetails = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      AIKnowledgeDocumentDetailsHarness
    )
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should display correct breadcrumbs', async () => {
    jest.spyOn(breadcrumbService, 'setItems')

    component.ngOnInit()
    fixture.detectChanges()

    expect(breadcrumbService.setItems).toHaveBeenCalledTimes(1)
    const pageHeader = await aIKnowledgeDocumentDetails.getHeader()
    const searchBreadcrumbItem = await pageHeader.getBreadcrumbItem('Details')
    expect(await searchBreadcrumbItem!.getText()).toEqual('Details')
  })

  it('should display translated headers', async () => {
    const pageHeader = await aIKnowledgeDocumentDetails.getHeader()
    expect(await pageHeader.getHeaderText()).toEqual('AIKnowledgeDocument Details')
    expect(await pageHeader.getSubheaderText()).toEqual('Display of AIKnowledgeDocument Details')
  })

  it('should have 1 inline actions', async () => {
    const pageHeader = await aIKnowledgeDocumentDetails.getHeader()
    const inlineActions = await pageHeader.getInlineActionButtons()
    expect(inlineActions.length).toBe(1)

    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    expect(backAction).toBeTruthy()
  })

  it('should navigate back on back button click', async () => {
    jest.spyOn(window.history, 'back')

    const pageHeader = await aIKnowledgeDocumentDetails.getHeader()
    const backAction = await pageHeader.getInlineActionButtonByLabel('Back')
    await backAction?.click()

    expect(window.history.back).toHaveBeenCalledTimes(1)
  })

  it('should display item details in page header', async () => {
    component.headerLabels$ = of([
      {
        label: 'first',
        value: 'first value'
      },
      {
        label: 'second',
        value: 'second value'
      },
      {
        label: 'third',
        icon: PrimeIcons.PLUS
      },
      {
        label: 'fourth',
        value: 'fourth value',
        icon: PrimeIcons.QUESTION
      }
    ])

    const pageHeader = await aIKnowledgeDocumentDetails.getHeader()
    const objectDetails = await pageHeader.getObjectInfos()
    expect(objectDetails.length).toBe(4)

    const firstDetailItem = await pageHeader.getObjectInfoByLabel('first')
    expect(await firstDetailItem?.getLabel()).toEqual('first')
    expect(await firstDetailItem?.getValue()).toEqual('first value')
    expect(await firstDetailItem?.getIcon()).toBeUndefined()

    const secondDetailItem = await pageHeader.getObjectInfoByLabel('second')
    expect(await secondDetailItem?.getLabel()).toEqual('second')
    expect(await secondDetailItem?.getValue()).toEqual('second value')
    expect(await secondDetailItem?.getIcon()).toBeUndefined()

    const thirdDetailItem = await pageHeader.getObjectInfoByLabel('third')
    expect(await thirdDetailItem?.getLabel()).toEqual('third')
    expect(await thirdDetailItem?.getValue()).toEqual('')
    expect(await thirdDetailItem?.getIcon()).toEqual(PrimeIcons.PLUS)

    const fourthDetailItem = await pageHeader.getObjectInfoByLabel('fourth')
    expect(await fourthDetailItem?.getLabel()).toEqual('fourth')
    expect(await fourthDetailItem?.getValue()).toEqual('fourth value')
    expect(await fourthDetailItem?.getIcon()).toEqual(PrimeIcons.QUESTION)
  })
  describe('headerLabels$', () => {
    it('should map details fields when details is defined', (done) => {
      const details: AIKnowledgeDocument = {
        id: 'doc1',
        name: 'Test Name',
        documentRefId: 'REF123',
        status: AIKnowledgeDocumentStatusEnum.New
      }
      const viewModel: AIKnowledgeDocumentDetailsViewModel = { details }
      store.overrideSelector(selectAIKnowledgeDocumentDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()
      component.headerLabels$.subscribe(labels => {
        expect(labels).toEqual([
          { label: 'Name', value: 'Test Name' },
          { label: 'DocumentRefId', value: 'REF123' },
          { label: 'Status', value: 'NEW' }
        ])
        done()
      })
    })
    it('should map details fields to empty string when details is undefined', (done) => {
      store.overrideSelector(selectAIKnowledgeDocumentDetailsViewModel, { details: undefined })
      store.refreshState()
      fixture.detectChanges()
      component.headerLabels$.subscribe(labels => {
        expect(labels).toEqual([
          { label: 'Name', value: '' },
          { label: 'DocumentRefId', value: '' },
          { label: 'Status', value: '' }
        ])
        done()
      })
    })

    it('should map missing fields to empty string', (done) => {
      const details: AIKnowledgeDocument = {
        id: 'doc1',
        name: '',
        documentRefId: '',
        status: undefined
      }
      const viewModel: AIKnowledgeDocumentDetailsViewModel = { details }
      store.overrideSelector(selectAIKnowledgeDocumentDetailsViewModel, viewModel)
      store.refreshState()
      fixture.detectChanges()
      component.headerLabels$.subscribe(labels => {
        expect(labels).toEqual([
          { label: 'Name', value: '' },
          { label: 'DocumentRefId', value: '' },
          { label: 'Status', value: '' }
        ])
        done()
      })
    })
  })
})
