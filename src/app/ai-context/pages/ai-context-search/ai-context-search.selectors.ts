import { createSelector } from '@ngrx/store'
import { createChildSelectors } from '@onecx/ngrx-accelerator'
import { DataTableColumn, RowListGridData } from '@onecx/portal-integration-angular'
import { aiContextFeature } from '../../ai-context.reducers'
import { initialState } from './ai-context-search.reducers'
import { AiContextSearchViewModel } from './ai-context-search.viewmodel'

export const aiContextSearchSelectors = createChildSelectors(aiContextFeature.selectSearch, initialState)

export const selectResults = createSelector(aiContextSearchSelectors.selectResults, (results): RowListGridData[] => {
  return results.map((item) => ({
    imagePath: '',
    ...item,
    id: item.id || ''
  }))
})

export const selectDisplayedColumns = createSelector(
  aiContextSearchSelectors.selectColumns,
  aiContextSearchSelectors.selectDisplayedColumns,
  (columns, displayedColumns): DataTableColumn[] => {
    return (displayedColumns?.map((d) => columns.find((c) => c.id === d)).filter((d) => d) as DataTableColumn[]) ?? []
  }
)

export const selectAiContextSearchViewModel = createSelector(
  aiContextSearchSelectors.selectColumns,
  aiContextSearchSelectors.selectCriteria,
  selectResults,
  selectDisplayedColumns,
  aiContextSearchSelectors.selectResultComponentState,
  aiContextSearchSelectors.selectSearchHeaderComponentState,
  aiContextSearchSelectors.selectDiagramComponentState,
  aiContextSearchSelectors.selectChartVisible,
  aiContextSearchSelectors.selectSearchLoadingIndicator,
  aiContextSearchSelectors.selectSearchExecuted,
  (
    columns,
    searchCriteria,
    results,
    displayedColumns,
    resultComponentState,
    searchHeaderComponentState,
    diagramComponentState,
    chartVisible,
    searchLoadingIndicator,
    searchExecuted
  ): AiContextSearchViewModel => ({
    columns,
    searchCriteria,
    results,
    displayedColumns,
    resultComponentState,
    searchHeaderComponentState,
    diagramComponentState,
    chartVisible,
    searchLoadingIndicator,
    searchExecuted
  })
)
