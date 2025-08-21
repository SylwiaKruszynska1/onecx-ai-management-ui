import { HttpClientTestingModule } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { BreadcrumbService, PortalCoreModule } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { AIKnowledgeBaseCreateUpdateComponent } from './aiknowledge-base-create-update.component'

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

describe('AIKnowledgeBaseCreateUpdateComponent', () => {
  let component: AIKnowledgeBaseCreateUpdateComponent
  let fixture: ComponentFixture<AIKnowledgeBaseCreateUpdateComponent>

  const mockActivatedRoute = {}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AIKnowledgeBaseCreateUpdateComponent],
      imports: [
        PortalCoreModule,
        FormsModule,
        ReactiveFormsModule,
        LetDirective,
        TranslateTestingModule.withTranslations(
          'en',
          require('./../../../../../../assets/i18n/en.json')
        ).withTranslations('de', require('./../../../../../../assets/i18n/de.json')),
        HttpClientTestingModule
      ],
      providers: [BreadcrumbService, { provide: ActivatedRoute, useValue: mockActivatedRoute }]
    }).compileComponents()

    fixture = TestBed.createComponent(AIKnowledgeBaseCreateUpdateComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })
  it('should emit primaryButtonEnabled as true when form is valid', (done) => {
    component.formGroup.setValue({
      id: '123',
      name: 'Test Name',
      description: 'Test Description'
    })
    component.primaryButtonEnabled.subscribe((enabled) => {
      expect(enabled).toBe(true)
      done()
    })
    component.formGroup.updateValueAndValidity()
  })

  it('should emit primaryButtonEnabled as false when form is invalid', (done) => {
    component.formGroup.setValue({
      id: '',
      name: '',
      description: ''
    })
    component.primaryButtonEnabled.subscribe((enabled) => {
      expect(enabled).toBe(false)
      done()
    })
    component.formGroup.updateValueAndValidity()
  })

  it('should set dialogResult with merged values on ocxDialogButtonClicked', () => {
    component.vm.itemToEdit = { id: 'oldId', name: 'oldName', description: 'oldDesc' }
    component.formGroup.setValue({
      id: 'newId',
      name: 'newName',
      description: 'newDesc'
    })
    component.ocxDialogButtonClicked()
    expect(component.dialogResult).toEqual({
      id: 'newId',
      name: 'newName',
      description: 'newDesc'
    })
  })

  it('should patch formGroup values from vm.itemToEdit on ngOnInit', () => {
    component.vm.itemToEdit = { id: 'editId', name: 'editName', description: 'editDesc' }
    component.ngOnInit()
    expect(component.formGroup.value).toEqual({
      id: 'editId',
      name: 'editName',
      description: 'editDesc'
    })
  })

})
