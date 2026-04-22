import * as z from 'zod'

export const inviteTokenSchema = z.object({
  token: z.string().uuid(),
})

export type InviteToken = z.infer<typeof inviteTokenSchema>
