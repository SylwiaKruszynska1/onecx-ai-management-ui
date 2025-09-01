import { AIKnowledgeDocumentStatusEnum } from "src/app/shared/generated"
import { selectAIKnowledgeDocumentSearchViewModel, selectDisplayedColumns, selectResults } from "./aiknowledge-document-search.selectors"
import { ColumnType, DataTableColumn, RowListGridData } from "@onecx/angular-accelerator"

describe('AIKnowledgeDocumentSearch selectors', () => {
  it('should map results to RowListGridData', () => {
    const results = [
      { id: '1', name: 'Doc1', documentRefId: 'ref1', status: AIKnowledgeDocumentStatusEnum.New },
      { id: '2', name: 'Doc2', documentRefId: 'ref2', status: AIKnowledgeDocumentStatusEnum.Processing }
    ]
    const mapped = selectResults.projector(results)
    expect(mapped).toEqual([
      { imagePath: '', id: '1', name: 'Doc1', documentRefId: 'ref1', status: 'NEW' },
      { imagePath: '', id: '2', name: 'Doc2', documentRefId: 'ref2', status: 'PROCESSING' }
    ] as RowListGridData[])
  })

  it('should map displayedColumns to DataTableColumn[]', () => {
    const columns: DataTableColumn[] = [
      { id: 'col1', nameKey: 'Col1', columnType: ColumnType.STRING },
      { id: 'col2', nameKey: 'Col2', columnType: ColumnType.STRING }
    ]
    const displayedColumns = ['col2', 'col1']
    const mapped = selectDisplayedColumns.projector(columns, displayedColumns)
    expect(mapped).toEqual([
      columns[1], 
      columns[0]  
    ])
  })

  it('should return empty array if displayedColumns is undefined', () => {
    const columns: DataTableColumn[] = [
      { id: 'col1', nameKey: 'Col1', columnType: ColumnType.STRING }
    ]
    const mapped = selectDisplayedColumns.projector(columns, [])
    expect(mapped).toEqual([])

    const mappedNull = selectDisplayedColumns.projector(columns, null)
    expect(mappedNull).toEqual([])
  })

  it('should build AIKnowledgeDocumentSearchViewModel', () => {
    const columns: DataTableColumn[] = [
      { id: 'col1', nameKey: 'Col1', columnType: ColumnType.STRING }
    ]
    const searchCriteria = { name: 'Doc' }
    const results: RowListGridData[] = [
      { imagePath: '', id: '1', name: 'Doc1', documentRefId: 'ref1', status: 'NEW' }
    ]
    const displayedColumns: DataTableColumn[] = columns
    const viewMode = 'basic'
    const chartVisible = true

    const vm = selectAIKnowledgeDocumentSearchViewModel.projector(
      columns,
      searchCriteria,
      results,
      displayedColumns,
      viewMode,
      chartVisible
    )
    expect(vm).toEqual({
      columns,
      searchCriteria,
      results,
      displayedColumns,
      viewMode,
      chartVisible
    })
  })
  it('should map falsy values to empty string', () => {
    const stateResults = [
      { id: '', name: '', documentRefId: '', status: undefined } 
    ]
    const result = selectResults.projector(stateResults)
    expect(result).toEqual([
      {
        imagePath: '',
        id: '',
        name: '',
        documentRefId: '',
        status: ''
      }
    ])
  })
  
  it('should map enum values to string', () => {
    const stateResults = [
      { id: '123', name: 'Doc', documentRefId: 'ref-1', status: AIKnowledgeDocumentStatusEnum.Embedded }
    ]
    const result = selectResults.projector(stateResults)
    expect(result).toEqual([
      {
        imagePath: '',
        id: '123',
        name: 'Doc',
        documentRefId: 'ref-1',
        status: 'EMBEDDED'
      }
    ])
  })
})