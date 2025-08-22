import { AIProviderDetailsActions } from "./aiprovider-details.actions"
import { aIProviderDetailsReducer, initialState } from "./aiprovider-details.reducers"
import { AIProviderDetailsState } from "./aiprovider-details.state"

describe('aIProviderDetailsReducer', () => {
  it('should set details on aiproviderDetailsReceived', () => {
    const details = { id: '1', name: 'Test' } as any
    const action = AIProviderDetailsActions.aiproviderDetailsReceived({ details })
    const state = aIProviderDetailsReducer(initialState, action)
    expect(state.details).toEqual(details)
  })


  it('should set details to undefined on aiproviderDetailsLoadingFailed', () => {
    const prevState: AIProviderDetailsState = { ...initialState, details: { id: '1' } as any }
    const action = AIProviderDetailsActions.aiproviderDetailsLoadingFailed({ error: null })
    const state = aIProviderDetailsReducer(prevState, action)
    expect(state.details).toBeUndefined()
  })

  it('should reset state on navigatedToDetailsPage', () => {
    const prevState: AIProviderDetailsState = { details: { id: '1' } as any, editMode: true, isApiKeyHidden: false }
    const action = AIProviderDetailsActions.navigatedToDetailsPage({ id: undefined })
    const state = aIProviderDetailsReducer(prevState, action)
    expect(state).toEqual(initialState)
  })


  it('should set editMode on aiproviderDetailsEditModeSet', () => {
    const action = AIProviderDetailsActions.aiproviderDetailsEditModeSet({ editMode: true })
    const state = aIProviderDetailsReducer(initialState, action)
    expect(state.editMode).toBe(true)
  })

  it('should toggle isApiKeyHidden on apiKeyVisibilityToggled', () => {
    const prevState: AIProviderDetailsState = { ...initialState, isApiKeyHidden: true }
    const action = AIProviderDetailsActions.apiKeyVisibilityToggled()
    const state = aIProviderDetailsReducer(prevState, action)
    expect(state.isApiKeyHidden).toBe(false)
  })
})