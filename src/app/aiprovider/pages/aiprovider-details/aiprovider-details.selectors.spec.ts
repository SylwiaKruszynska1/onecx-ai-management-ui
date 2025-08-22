import { selectAIProviderDetailsViewModel } from "./aiprovider-details.selectors"

describe('selectAIProviderDetailsViewModel', () => {
  it('should return correct view model for all fields', () => {
    const details = { id: '1', name: 'Test', apiKey: 'key' } as any
    const result = selectAIProviderDetailsViewModel.projector(details, true, false)
    expect(result).toEqual({ details, editMode: true, isApiKeyHidden: false })
  })

  it('should handle undefined details', () => {
    const result = selectAIProviderDetailsViewModel.projector(undefined, false, true)
    expect(result).toEqual({ details: undefined, editMode: false, isApiKeyHidden: true })
  })
})