import { selectAIProviderSearchViewModel, selectDisplayedColumns, selectResults } from "./aiprovider-search.selectors"

describe('AIProviderSearch selectors', () => {
  it('should map results to RowListGridData', () => {
    const results = [
      {
        id: '1',
        name: 'Test',
        description: 'Desc',
        llmUrl: 'url',
        modelName: 'model',
        modelVersion: 'v1',
        appId: 'app'
      }
    ]
    const mapped = selectResults.projector(results)
    expect(mapped).toEqual([
      {
        imagePath: '',
        id: '1',
        name: 'Test',
        description: 'Desc',
        llmUrl: 'url',
        modelName: 'model',
        modelVersion: 'v1',
        appId: 'app'
      }
    ])
  })

  it('should filter and map displayed columns', () => {
    const columns = [
      { id: 'col1', nameKey: 'Col1' },
      { id: 'col2', nameKey: 'Col2' }
    ] as any
    const displayedColumns = ['col2', 'col1']
    const mapped = selectDisplayedColumns.projector(columns, displayedColumns)
    expect(mapped).toEqual([
      { id: 'col2', nameKey: 'Col2' },
      { id: 'col1', nameKey: 'Col1' }
    ])
  })

  it('should build AIProviderSearchViewModel', () => {
    const columns = [{ id: 'col1', nameKey: 'Col1' }] as any
    const searchCriteria = { name: 'Test' }
    const results = [{ id: '1', name: 'Test' }]
    const viewMode = 'basic'
    const chartVisible = true

    const vm = selectAIProviderSearchViewModel.projector(
      columns,
      searchCriteria,
      selectResults.projector(results),
      selectDisplayedColumns.projector(columns, ['col1']),
      viewMode,
      chartVisible
    )
    expect(vm).toEqual({
      columns,
      searchCriteria,
      results: [
        {
          imagePath: '',
          id: '1',
          name: 'Test',
          description: undefined,
          llmUrl: undefined,
          modelName: undefined,
          modelVersion: undefined,
          appId: undefined
        }
      ],
      displayedColumns: [{ id: 'col1', nameKey: 'Col1' }],
      viewMode,
      chartVisible
    })
  })

  it('should return empty array when displayedColumns is null', () => {
    const columns = [
      { id: 'col1', nameKey: 'Col1' },
      { id: 'col2', nameKey: 'Col2' }
    ] as any
    const displayedColumns = null
    const mapped = selectDisplayedColumns.projector(columns, displayedColumns)
    expect(mapped).toEqual([])
  })

  it('should return empty array when displayedColumns is empty array', () => {
    const columns = [
      { id: 'col1', nameKey: 'Col1' },
      { id: 'col2', nameKey: 'Col2' }
    ] as any
    const displayedColumns: string[] = []
    const mapped = selectDisplayedColumns.projector(columns, displayedColumns)
    expect(mapped).toEqual([])
  })
})