import { SupabaseClient } from '@supabase/supabase-js'
import { Queue } from 'bullmq'

declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient
    emailQueue: Queue
  }
}