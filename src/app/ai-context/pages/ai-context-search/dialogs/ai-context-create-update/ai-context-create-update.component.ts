import { Component, EventEmitter, Input, OnInit } from '@angular/core'
import { DialogButtonClicked, DialogPrimaryButtonDisabled, DialogResult } from '@onecx/portal-integration-angular'

import { FormControl, FormGroup, Validators } from '@angular/forms'
import { map } from 'rxjs'
import { AIContext } from 'src/app/shared/generated'

import { AiContextCreateUpdateViewModel } from './ai-context-create-update.viewmodel'

@Component({
  selector: 'app-ai-context-create-update',
  templateUrl: './ai-context-create-update.component.html',
  styleUrls: ['./ai-context-create-update.component.scss']
})
export class AiContextCreateUpdateComponent
  implements
    DialogPrimaryButtonDisabled,
    DialogResult<AIContext | undefined>,
    DialogButtonClicked<AiContextCreateUpdateComponent>,
    OnInit
{
  @Input() public vm: AiContextCreateUpdateViewModel = {
    itemToEdit: undefined
  }

  public formGroup: FormGroup

  primaryButtonEnabled = new EventEmitter<boolean>()
  dialogResult: AIContext | undefined = undefined

  constructor() {
    this.formGroup = new FormGroup({
      appId: new FormControl(null, [Validators.maxLength(255)]),
      name: new FormControl(null, [Validators.maxLength(255)]),
      description: new FormControl(null, [Validators.maxLength(255)])
    })
    this.formGroup.statusChanges
      .pipe(
        map((status) => {
          return status === 'VALID'
        })
      )
      .subscribe(this.primaryButtonEnabled)
  }

  ocxDialogButtonClicked() {
    this.dialogResult = {
      ...this.vm.itemToEdit,
      ...this.formGroup.value
    }
  }

  ngOnInit() {
    if (this.vm.itemToEdit) {
      this.formGroup.patchValue({
        appId: this.vm.itemToEdit.appId,
        name: this.vm.itemToEdit.name,
        description: this.vm.itemToEdit.description
      })
    }
  }

}
