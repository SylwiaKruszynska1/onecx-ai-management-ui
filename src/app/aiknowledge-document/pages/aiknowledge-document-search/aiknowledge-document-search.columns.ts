import { ColumnType, DataTableColumn } from '@onecx/angular-accelerator'

export const AIKnowledgeDocumentSearchColumns: DataTableColumn[] = [
  {
    id: 'id',
    columnType: ColumnType.STRING,
    nameKey: 'AI_KNOWLEDGE_DOCUMENT_SEARCH.COLUMNS.ID',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'AI_KNOWLEDGE_DOCUMENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'AI_KNOWLEDGE_DOCUMENT_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  },
  {
    id: 'name',
    columnType: ColumnType.STRING,
    nameKey: 'AI_KNOWLEDGE_DOCUMENT_SEARCH.COLUMNS.NAME',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'AI_KNOWLEDGE_DOCUMENT_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'AI_KNOWLEDGE_DOCUMENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'AI_KNOWLEDGE_DOCUMENT_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  },
  {
    id: 'documentRefId',
    columnType: ColumnType.STRING,
    nameKey: 'AI_KNOWLEDGE_DOCUMENT_SEARCH.COLUMNS.DOCUMENTREFID',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'AI_KNOWLEDGE_DOCUMENT_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'AI_KNOWLEDGE_DOCUMENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'AI_KNOWLEDGE_DOCUMENT_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  },

  {
    id: 'status',
    columnType: ColumnType.STRING,
    nameKey: 'AI_KNOWLEDGE_DOCUMENT_SEARCH.COLUMNS.STATUS',
    filterable: true,
    sortable: true,
    predefinedGroupKeys: [
      'AI_KNOWLEDGE_DOCUMENT_SEARCH.PREDEFINED_GROUP.DEFAULT',
      'AI_KNOWLEDGE_DOCUMENT_SEARCH.PREDEFINED_GROUP.EXTENDED',
      'AI_KNOWLEDGE_DOCUMENT_SEARCH.PREDEFINED_GROUP.FULL'
    ]
  }
]
