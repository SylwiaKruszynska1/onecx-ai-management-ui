import { SearchAIContextRequest } from 'src/app/shared/generated'
import { z, ZodTypeAny } from 'zod'

export const aiContextSearchCriteriasSchema = z.object({
  appId: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
} satisfies Partial<Record<keyof SearchAIContextRequest, ZodTypeAny>>)

export type AiContextSearchCriteria = z.infer<typeof aiContextSearchCriteriasSchema>
