import { ColumnType } from "@onecx/angular-accelerator"
import * as selectors from './ai-context-search.selectors'

describe('AiContextSearch selectors', () => {
    describe('selectResults projector', () => {
      const cases = [
        {
          desc: 'should map results to RowListGridData[]',
          input: [
            { id: '1', name: 'A', description: 'desc', vdb: 'vdb1', vdbCollection: 'c1' },
            { id: '2', name: 'B', description: 'desc2', vdb: 'vdb2', vdbCollection: 'c2' }
          ],
          expected: [
            { imagePath: '', id: '1', name: 'A', description: 'desc', vdb: 'vdb1', vdbCollection: 'c1' },
            { imagePath: '', id: '2', name: 'B', description: 'desc2', vdb: 'vdb2', vdbCollection: 'c2' }
          ]
        },
        {
          desc: 'should use empty string fallback when item.id is falsy',
          input: [
            { id: undefined, name: 'A', description: 'desc' },
            { id: '', name: 'B', description: 'desc2' },
            { name: 'C', description: 'desc3' }
          ],
          expected: [
            { imagePath: '', id: '', name: 'A', description: 'desc' },
            { imagePath: '', id: '', name: 'B', description: 'desc2' },
            { imagePath: '', id: '', name: 'C', description: 'desc3' }
          ]
        }
      ]
      cases.forEach(({ desc, input, expected }) => {
        it(desc, () => {
          expect(selectors.selectResults.projector(input)).toEqual(expected)
        })
      })
    })

    describe('selectDisplayedColumns projector', () => {
      it('should map displayedColumns ids to columns', () => {
        const columns = [
          { id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING },
          { id: 'col2', nameKey: 'Col 2', columnType: ColumnType.STRING }
        ]
        const displayedColumns = ['col2', 'col1']
        expect(selectors.selectDisplayedColumns.projector(columns, displayedColumns)).toEqual([
          { id: 'col2', nameKey: 'Col 2', columnType: ColumnType.STRING },
          { id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING }
        ])
      })

      it('should return [] if displayedColumns is undefined', () => {
        const columns = [
          { id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING },
          { id: 'col2', nameKey: 'Col 2', columnType: ColumnType.STRING }
        ]
        expect(selectors.selectDisplayedColumns.projector(columns, null)).toEqual([])
      })
    })

    it('selectAiContextSearchViewModel should combine all selector results', () => {
      const columns = [{ id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING }]
      const searchCriteria = {
        name: 'Test Name',
        description: 'Test Description',
        vdb: 'vdb1',
        vdbCollection: 'collection1',
        id: 1,
        limit: 10
      }
      const results = [{ imagePath: '', id: '1', name: 'A', description: 'desc', vdb: 'vdb1', vdbCollection: 'c1' }]
      const displayedColumns = [{ id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING }]
      const chartVisible = true

      const result = selectors.selectAiContextSearchViewModel.projector(
        columns,
        searchCriteria,
        results,
        displayedColumns,
        null,
        null,
        null,
        chartVisible,
        false,
        true
      )
      expect(result).toEqual({
        columns,
        searchCriteria,
        results,
        displayedColumns,
        resultComponentState: null,
        searchHeaderComponentState: null,
        diagramComponentState: null,
        chartVisible,
        searchLoadingIndicator: false,
        searchExecuted: true
      })
    })

    it('selectDisplayedColumns should return [] if displayedColumns is undefined', () => {
      const columns = [
        { id: 'col1', nameKey: 'Col 1', columnType: ColumnType.STRING },
        { id: 'col2', nameKey: 'Col 2', columnType: ColumnType.STRING }
      ]
      const displayedColumns = null
      const result = selectors.selectDisplayedColumns.projector(columns, displayedColumns)
      expect(result).toEqual([])
    })
  })