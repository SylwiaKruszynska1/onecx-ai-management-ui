 
import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { BreadcrumbService, PortalCoreModule } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { AIKnowledgeDocumentCreateUpdateComponent } from './aiknowledge-document-create-update.component'
import { AIKnowledgeDocument } from 'src/app/shared/generated'

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

describe('AIKnowledgeDocumentCreateUpdateComponent', () => {
  let component: AIKnowledgeDocumentCreateUpdateComponent
  let fixture: ComponentFixture<AIKnowledgeDocumentCreateUpdateComponent>

  const mockActivatedRoute = {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AIKnowledgeDocumentCreateUpdateComponent],
      imports: [
        PortalCoreModule,
        FormsModule,
        ReactiveFormsModule,
        LetDirective,
        TranslateTestingModule.withTranslations(
          'en',
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('./../../../../../../assets/i18n/en.json')
          // eslint-disable-next-line @typescript-eslint/no-require-imports
        ).withTranslations('de', require('./../../../../../../assets/i18n/de.json')),
        HttpClientTestingModule
      ],
      providers: [BreadcrumbService, { provide: ActivatedRoute, useValue: mockActivatedRoute }]
    }).compileComponents()

    fixture = TestBed.createComponent(AIKnowledgeDocumentCreateUpdateComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
  it('should emit primaryButtonEnabled as true when form is valid', (done) => {
    component.formGroup.setValue({ name: 'doc', documentRefId: 'ref' })
    component.primaryButtonEnabled.subscribe((enabled) => {
      expect(enabled).toBe(true)
      done()
    })
    component.formGroup.updateValueAndValidity()
  })

  it('should emit primaryButtonEnabled as false when form is invalid', (done) => {
    component.formGroup.setValue({ name: '', documentRefId: '' })
    component.primaryButtonEnabled.subscribe((enabled) => {
      expect(enabled).toBe(false)
      done()
    })
    component.formGroup.updateValueAndValidity()
  })

  it('should set dialogResult with merged values on ocxDialogButtonClicked', () => {
    component.vm.itemToEdit = { id: '1', name: 'old', documentRefId: 'oldRef' } as AIKnowledgeDocument
    component.formGroup.setValue({ name: 'new', documentRefId: 'newRef' })
    component.ocxDialogButtonClicked()
    expect(component.dialogResult).toEqual({
      id: '1',
      name: 'new',
      documentRefId: 'newRef'
    })
  })

  it('should patch formGroup with itemToEdit on ngOnInit', () => {
    component.vm.itemToEdit = { name: 'patched', documentRefId: 'patchedRef' } as AIKnowledgeDocument
    component.ngOnInit()
    expect(component.formGroup.value).toEqual({
      name: 'patched',
      documentRefId: 'patchedRef'
    })
  })
})