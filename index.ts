import 'dotenv/config'
import Fastify from 'fastify'
import { createClient } from '@supabase/supabase-js'
import { Queue } from 'bullmq'
export type CampaignProps={
id?:number |string
slug?:string
title?:string
subject?:string
html?:string
image?:string
url?:string
excerpt?:string
}
const fastify = Fastify({ logger: true })

fastify.register(import ('@fastify/cors'), {
  origin: ['http://localhost:3000', 'https://culturays.com', 'http://34.116.251.165']
})

/* SUPABASE */
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

fastify.decorate('supabase', supabase)
 const redisConnection = {
  host: '127.0.0.1',
  port: 6379,
  password: process.env.REDIS_PASSWORD 
};
const emailQueue = new Queue('emails', { connection: redisConnection });
fastify.decorate('emailQueue', emailQueue)

fastify.post('/admin/send-newsletter', async (req, reply ) => {
  const { campaigns } = req.body as { campaigns: CampaignProps[] }

  const { data } = await fastify.supabase
    .from('newsletter_js')
    .select('email, name')

    for (const user of data??[]) {
      const postsHtml = campaigns
        .filter((p) => p.title)
        .map(
          (p) => `
           
           <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
           
        ${p.image? `<img src=${p.image} alt="Newsletter Banner" style="width: 100%; border-radius: 6px; margin-bottom: 20px;" />`: `<img src='https://culturays.com/opengraph-image.png' alt="Newsletter Banner" style="width: 100%; border-radius: 6px; margin-bottom: 20px;" />`}

        <h2 style="font-size: 22px; color: #2c3e50; margin: 10px 0;">${p.title}</h2>
     ${p.url ? `<p><a href="${p.url}" style="display:inline-block;margin-top:1em;padding:0.5em 1em;background:#0070f3;color:white;text-decoration:none;border-radius:5px;">Read Full Post</a></p>` : ""}
        <p style="font-size: 16px; color: #444444; line-height: 1.6;">
          ${p.excerpt}
        </p> 
      </div> 
      `
        )
        .join("");
 
      const htmlContent = `
       <h2 style="color:#2c3e50;">Today's Top Stories</h2> 
    <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
        
       <p style="font-size: 35px; color: #2c3e50; margin: 10px 0; font-weight: bold;">Have you seen our AI Aid?<a href="https://culturays.com/naija-events/" style="display:inline-block;margin-top:1em;padding:0.5em 1em;background:#0070f3;color:white;text-decoration:none;border-radius:5px;">Try it!</a></p>
       
       <hr style="margin: 40px 0; border: none; border-top: 1px solid #eaeaea;" />    
         <p style="font-size: 16px; color: #333333; text-transform: capitalize;">Hi ${user?.name},</p>
      ${postsHtml}
    <p style="margin-top: 30px; font-size: 15px; color: #333333;">
          Warm regards,<br>
          <strong>Urban Naija</strong>
        </p>
       <hr style="margin: 40px 0; border: none; border-top: 1px solid #eaeaea;" />        
       <h2 style="font-size: 22px; color: #2c3e50; margin: 10px 0;">News Made for You</h2>

        <img src="https://culturays.com/tinitasks-poster.JPG/" alt="Tini Tasks Poster" style="width: 100%; border-radius: 6px; margin-bottom: 20px;" />

        <p><a href="https://gowork.africareinvented.com/" style="display:inline-block;margin-top:1em;padding:0.5em 1em;background:#0070f3;color:white;text-decoration:none;border-radius:5px;">Connect. Collaborate. Conquer on Tini Tasks</a></p>

        <hr style="margin: 40px 0; border: none; border-top: 1px solid #eaeaea;" />
      
       <footer style="font-size: 13px; color: #999999; text-align: center;">
         <p style="font-size:14px; color:#777;">You're receiving this email because you subscribed to Urban Naija News. <br/> style="color:#00796b;"><a>here</a>.</p>

    </footer>
    </div>
  `;
  // Send the email 
    await fastify.emailQueue.add('broadcast', {
       to: user?.email,
       from: "Urban Naija News — <contact@culturays.com>",
       replyTo: "contact@culturays.com",
      subject: `Today's Top Stories - ${new Date().toLocaleDateString()}`,
      html: htmlContent,
    })

    
} 

return { scheduled: data?.length ?? 0 }
})

fastify.listen({ port: 4000, host: '0.0.0.0' })