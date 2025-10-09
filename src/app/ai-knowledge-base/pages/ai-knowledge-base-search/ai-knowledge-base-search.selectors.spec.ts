import { ColumnType, GroupByCountDiagramComponentState, InteractiveDataViewComponentState, SearchHeaderComponentState } from "@onecx/angular-accelerator"
import { selectAiKnowledgeBaseSearchViewModel, selectResults } from "./ai-knowledge-base-search.selectors"
import { AiKnowledgeBaseSearchViewModel } from "./ai-knowledge-base-search.viewmodel"

describe('aiKnowledgeBaseSearch selectors', () => {
  it('should add imagePath to each result in selectResults', () => {
    const results = [{ id: '1', name: 'A' }, { id: '2', name: 'B' }]
    const selected = selectResults.projector(results)
    expect(selected).toEqual([
      { imagePath: '', id: '1', name: 'A' },
      { imagePath: '', id: '2', name: 'B' }
    ])
  })
  it('should set id to "unknown" if id is undefined in selectResults', () => {
    const results = [{ id: '', name: 'A' }, { id: '2', name: 'B' }]
    const selected = selectResults.projector(results)
    expect(selected).toEqual([
      { imagePath: '', name: 'A', id: 'unknown' },
      { imagePath: '', id: '2', name: 'B' }
    ])
  })

  it('should build AiKnowledgeBaseSearchViewModel in selectAiKnowledgeBaseSearchViewModel', () => {
    const columns = [
      { id: 'col1', nameKey: 'Col1', columnType: ColumnType.STRING },
      { id: 'col2', nameKey: 'Col2', columnType: ColumnType.STRING }
    ]
    const searchCriteria = { name: 'test' }
    const results = [{ imagePath: '', id: '1' }]
    const resultComponentState: InteractiveDataViewComponentState = {
      layout: 'grid'
    }
    const searchHeaderComponentState: SearchHeaderComponentState = {
      activeViewMode: 'advanced'
    }
    const diagramComponentState: GroupByCountDiagramComponentState = {}
    const chartVisible = true
    const searchLoadingIndicator = false
    const searchExecuted = true

    const vm: AiKnowledgeBaseSearchViewModel = selectAiKnowledgeBaseSearchViewModel.projector(
      columns,
      searchCriteria,
      results,
      resultComponentState,
      searchHeaderComponentState,
      diagramComponentState,
      chartVisible,
      searchLoadingIndicator,
      searchExecuted
    )
    expect(vm).toEqual({
      columns,
      searchCriteria,
      results,
      resultComponentState,
      searchHeaderComponentState,
      diagramComponentState,
      chartVisible,
      searchLoadingIndicator,
      searchExecuted
    })
  })
})