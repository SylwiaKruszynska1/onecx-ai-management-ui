import { ComponentHarness } from '@angular/cdk/testing'
import { DataTableHarness, PageHeaderHarness } from '@onecx/angular-accelerator/testing'

export class AiContextDetailsHarness extends ComponentHarness {
  static readonly hostSelector = 'app-ai-context-details'

  getHeader = this.locatorFor(PageHeaderHarness)
  getDataTable = this.locatorFor(DataTableHarness)
}
