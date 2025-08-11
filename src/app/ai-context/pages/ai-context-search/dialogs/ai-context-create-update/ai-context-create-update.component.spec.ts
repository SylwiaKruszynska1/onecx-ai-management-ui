import { provideHttpClientTesting } from '@angular/common/http/testing'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute } from '@angular/router'
import { LetDirective } from '@ngrx/component'
import { BreadcrumbService, PortalCoreModule } from '@onecx/portal-integration-angular'
import { TranslateTestingModule } from 'ngx-translate-testing'
import { AiContextCreateUpdateComponent } from './ai-context-create-update.component'
import { AIContext } from 'src/app/shared/generated'

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})

describe('AiContextCreateUpdateComponent', () => {
  let component: AiContextCreateUpdateComponent
  let fixture: ComponentFixture<AiContextCreateUpdateComponent>

  const mockActivatedRoute = {}
  const mockItem: AIContext = {
    id: '1',
    appId: 'ai-context-1',
    name: 'AI Context 1',
    description: 'Description'
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AiContextCreateUpdateComponent],
      imports: [
        PortalCoreModule,
        FormsModule,
        ReactiveFormsModule,
        LetDirective,
        TranslateTestingModule.withTranslations(
          'en',
          require('./../../../../../../assets/i18n/en.json')
        ).withTranslations('de', require('./../../../../../../assets/i18n/de.json'))
      ],
      providers: [
        BreadcrumbService,
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideHttpClientTesting()
      ]
    }).compileComponents()

    fixture = TestBed.createComponent(AiContextCreateUpdateComponent)
    component = fixture.componentInstance
    fixture.detectChanges()
  })

  it('should create', () => {
    expect(component).toBeTruthy()
  })

  it('should initialize form with empty values', () => {
    expect(component.formGroup.get('appId')?.value).toBeNull()
    expect(component.formGroup.get('name')?.value).toBeNull()
    expect(component.formGroup.get('description')?.value).toBeNull()
  })

  it('should initialize form with item values when editing', () => {
    component.vm = { itemToEdit: mockItem }
    component.ngOnInit()

    expect(component.formGroup.get('appId')?.value).toBe(mockItem.appId)
    expect(component.formGroup.get('name')?.value).toBe(mockItem.name)
    expect(component.formGroup.get('description')?.value).toBe(mockItem.description)
  })

  it('should create dialog result with form values', () => {
    const formValues = {
      appId: 'ai-context-1',
      name: 'AI Context 1',
      description: 'Description'
    }

    component.formGroup.patchValue(formValues)
    component.ocxDialogButtonClicked()

    expect(component.dialogResult).toEqual({
      ...formValues
    })
  })

  it('should merge existing item with form values in dialog result when editing', () => {
    component.vm = { itemToEdit: mockItem }
    const formValues = {
      appId: 'updated-ai-context-1',
      name: 'Updated AI Context 1',
      description: 'Updated Description'
    }

    component.formGroup.patchValue(formValues)
    component.ocxDialogButtonClicked()

    expect(component.dialogResult).toEqual({
      ...mockItem,
      ...formValues
    })
  })

  it('should validate max length for all fields', () => {
    const longString = 'a'.repeat(256)

    component.formGroup.patchValue({
      appId: longString,
      name: longString,
      description: longString
    })

    expect(component.formGroup.get('appId')?.errors?.['maxlength']).toBeTruthy()
    expect(component.formGroup.get('name')?.errors?.['maxlength']).toBeTruthy()
    expect(component.formGroup.get('description')?.errors?.['maxlength']).toBeTruthy()
  })

  it('should consider form valid with valid values', () => {
    component.formGroup.patchValue({
      appId: 'valid-ai-context-1',
      name: 'Valid AI Context 1',
      description: 'Valid Description'
    })

    expect(component.formGroup.valid).toBeTruthy()
  })
})
