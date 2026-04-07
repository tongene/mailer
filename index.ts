import dotenv from 'dotenv'
import 'dotenv/config'
import path from 'path'
import crypto from "crypto";
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { Queue, Worker } from 'bullmq';
import {Redis} from 'ioredis';

const REDIS_PASS = process.env.REDIS_PASSWORD;
import Fastify from 'fastify'
import { createClient } from '@supabase/supabase-js' 

export type CampaignProps={
id?:number |string
slug?:string
title?:string
subject?:string
html?:string
image?:string
url?:string
excerpt?:string
video?:string
}
 
const fastify = Fastify({ logger: true })
const fastifyX = Fastify({ logger: true })
fastify.register(import ('@fastify/cors'), {
  origin: ['http://localhost:3000', 'https://culturays.com', 'https://gowork.africareinvented.com', 'http://34.116.251.165']
})
fastifyX.register(import ('@fastify/cors'), {
  origin: ['http://localhost:3000', 'https://culturays.com', 'https://gowork.africareinvented.com', 'http://34.116.251.165']
})
/* SUPABASE */
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const supabaseUltra = createClient(
  process.env.SUPABASE_URL_TINI_TASKS!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_TINI_TASKS!
)
fastify.decorate('supabase', supabase)
fastifyX.decorate('supabase', supabaseUltra)
const connection = new Redis({
  host: '127.0.0.1',
  port: 6379,
  password: REDIS_PASS,
  maxRetriesPerRequest: null,
});
fastify.addContentTypeParser('text/plain', { parseAs: 'string' }, (req, body, done) => {
  try {
    const json = JSON.parse(body as string)
    done(null, json)
  } catch (err) {
    done(null, body)
  }
})
fastifyX.addContentTypeParser('text/plain', { parseAs: 'string' }, (req, body, done) => {
  try {
    const json = JSON.parse(body as string)
    done(null, json)
  } catch (err) {
    done(null, body)
  }
})

connection.on('error', (err) => console.error('Redis Connection Error:', err));
const emailQueue = new Queue('emails', { connection: connection });
fastify.decorate('emailQueue', emailQueue)
fastifyX.decorate('emailQueue', emailQueue)

fastify.post('/admin/send-newsletter', async (req, reply ) => {
  const { campaigns } = req.body as { campaigns: CampaignProps[] }

  const { data } = await fastify.supabase
    .from('newsletter_subscribers')
    .select('email, name')
    .eq("unsubscribed", false);
    for (const user of data??[]) {
      const token = crypto
  .createHmac("sha256", process.env.UNSUBSCRIBE_SECRET!)
  .update(user.email)
  .digest("hex");

const unsubscribeUrl = `https://culturays.com/api/unsubscribed?email=${user.email}&token=${token}`;   

const postsHtml = campaigns
        .filter((p) => p.title)
        .map(
          (p) => `           
           <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
 ${ p.video ? `
<div style="margin: 20px 0; text-align: center;">
  <a href="${p.video}" style="text-decoration: none; display: inline-block; position: relative; width: 100%; max-width: 500px;">
    <!-- Main Thumbnail -->
    <img src="https://culturays.com/opengraph-image.png" 
         alt="Watch video" 
         style="width: 100%; max-width: 500px; height: auto; display: block; border-radius: 12px; border: 1px solid #eeeeee;" />
    
    <!-- Play Button Overlay -->
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 60px; height: 60px; background-color: rgba(0,0,0,0.7); border-radius: 50%; line-height: 60px; text-align: center;">
      <span style="color: #ffffff; font-size: 30px; margin-left: 5px;">▶</span>
    </div>
    
    <!-- Video Label -->
    <p style="margin-top: 10px; color: #444444; font-family: Arial, sans-serif; font-weight: bold; text-decoration: underline;">
      Click to watch video >>
    </p>
  </a>
</div>
` : ""} 
           
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
        
  <hr style="margin: 40px 0; border: none; border-top: 1px solid #eaeaea;" />  
     <p style="font-size:18px;color: #6677; text-align:center">
    Avoid AI Misinformation — Read Only Verified News here.
    <br/>
    <a href="https://culturays.com" style="color:#f97316;">
      Culturays — The Urban Naija News
    </a>
     <br/>
    <a href="https://www.instagram.com/culturays_/" style="color:#f97316;">
      Instagram
    </a> <br/>
     <a href="https://www.facebook.com/CulturaysSpot/" style="color:#f97316;">
     Facebook
    </a> <br/>
     <a href="https://x.com/culturays" style="color:#f97316;">
      X
    </a> <br/>
     <a href="https://whatsapp.com/channel/0029VaH6uMMFsn0dN8Vzwr2v" style="color:#f97316;">
     WhatsApp
    </a> <br/>
     <a href="https://www.youtube.com/@Culturays" style="color:#f97316;">
      Youtube
    </a> <br/>
 
     <img src="https://culturays.com/qrcode_culturays.com.png" alt="Scan to Visit Culturays Poster" style="width: 25%; border-radius: 6px; margin-bottom: 20px;" />
  </p>
    <hr style="margin: 40px 0; border: none; border-top: 1px solid #eaeaea;" />  
       <p style="font-size: 35px; color: #2c3e50; margin: 10px 0; font-weight: bold;">Have you seen our AI Aid?<a href="https://culturays.com/naija-events/" style="display:inline-block;margin-top:1em;padding:0.5em 1em;background:#0070f3;color:white;text-decoration:none;border-radius:5px;">Try it!</a></p>
       
       <hr style="margin: 40px 0; border: none; border-top: 1.5px solid #0c0f8f;" />    
         <p style="font-size: 16px; color: #333333; text-transform: capitalize;">Hi ${user?.name},</p>
      ${postsHtml}
    <p style="margin-top: 30px; font-size: 15px; color: #333333;">
          Warm regards,<br>
          <strong>Urban Naija</strong>
        </p>
          <img src="https://culturays.com/qrcode_culturays.com.png" alt="Scan to Visit Culturays" style="width: 25%; border-radius: 6px; margin-bottom: 20px;" />
       <hr style="margin: 40px 0; border: none; border-top: 1px solid #0c0f8f;" />        
       <h2 style="font-size: 22px; color: #2c3e50; margin: 10px 0;">News Made for You</h2>

        <img src="https://culturays.com/tinitasks.jpg/" alt="Tini Tasks Poster" style="width: 70%; border-radius: 6px; margin-bottom: 20px;" />

        <p><a href="https://gowork.africareinvented.com/" style="display:inline-block;margin-top:1em;padding:0.5em 1em;background:#0070f3;color:white;text-decoration:none;border-radius:5px;">Connect. Collaborate. Conquer on Tini Tasks</a></p>   
      
       <footer style="font-size: 13px; color: #999999; text-align: center; height:300px"> 
     <hr style="margin: 40px 0; border: none; border-top: 1px solid #0c0f8f;" />
      <br/>
    <a href="https://culturays.com" style="color:#f97316;">
      Culturays — The Urban Naija News
    </a> <br/>
    <a href="https://www.instagram.com/culturays_/" style="color:#f97316;">
      Instagram
    </a> <br/>
     <a href="https://www.facebook.com/CulturaysSpot/" style="color:#f97316;">
     Facebook
    </a> <br/>
     <a href="https://x.com/culturays" style="color:#f97316;">
      X
    </a> <br/>
     <a href="https://www.youtube.com/@Culturays" style="color:#f97316;">
      Youtube
    </a> <br/>  

  <p style="font-size:12px;color:#666;text-align:center">
    You are receiving this email because you subscribed to Culturays — The Urban Naija News.
    <br/>
    <a href="${unsubscribeUrl}" style="color:#f97316;">
      Unsubscribe
    </a>
  </p>
    <hr style="margin-top:30px" />
    </footer>
    </div>
  `;
 
  // Send the email 
    await fastify.emailQueue.add('broadcast', {
       to: user?.email,
       from: "Culturays — The Urban Naija News — <contact@culturays.com>",
       replyTo: "contact@culturays.com",
      subject: `Today's Top Stories - ${new Date().toLocaleDateString()}`,
      html: htmlContent,
    })
    
} 

return { scheduled: data?.length ?? 0 }
})

fastifyX.post('/admin/contact-letter', async (req, reply ) => {
  const { loggedInUser, profile } = req.body as any
 if (!loggedInUser) {
  return reply.status(401).send({ error: "Unauthorized" });
}
      const htmlContent = `
       <h2 style="color:#2c3e50;">Today's Top Stories</h2> 
    <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
        
  <hr style="margin: 40px 0; border: none; border-top: 1px solid #eaeaea;" />  
     <p style="font-size:18px;color: #6677; text-align:center">
    Avoid AI Misinformation — Read Only Verified News here.
    <br/>
    <a href="https://culturays.com/" style="color:#f97316;">
      Culturays — The Urban Naija News
    </a>
     <br/>
    <a href="https://www.instagram.com/culturays_/" style="color:#f97316;">
      Instagram
    </a> <br/>
     <a href="https://www.facebook.com/CulturaysSpot/" style="color:#f97316;">
     Facebook
    </a> <br/>
     <a href="https://x.com/culturays" style="color:#f97316;">
      X
    </a> <br/>
     <a href="https://www.youtube.com/@Culturays" style="color:#f97316;">
      Youtube
    </a> <br/>
 
     <img src="https://gowork.africareinvented.com/qrcode_gowork.africareinvented.com.png" alt="Scan to Visit Tini Tasks" style="width: 25%; border-radius: 6px; margin-bottom: 20px;" />
  </p>
    <hr style="margin: 40px 0; border: none; border-top: 1px solid #eaeaea;" />  
       <p style="font-size: 35px; color: #2c3e50; margin: 10px 0; font-weight: bold;">Have you seen our AI Aid?<a href="https://culturays.com/naija-events/" style="display:inline-block;margin-top:1em;padding:0.5em 1em;background:#0070f3;color:white;text-decoration:none;border-radius:5px;">Try it!</a></p>
       
       <hr style="margin: 40px 0; border: none; border-top: 1.5px solid #0c0f8f;" />    
         <p style="font-size: 16px; color: #333333; text-transform: capitalize;">Hi, ${profile.full_name}</p>
 <p style="font-size: 16px; color: #333333; text-transform: capitalize;">Someone wants to contact you. Log in to respond.<a href="https://gowork.africareinvented.com/sign-in"> Sign in </a></p>
    <p style="margin-top: 30px; font-size: 15px; color: #333333;">
          Warm regards,<br>
          <strong>Tini Tasks</strong>
        </p>
          <img src="https://gowork.africareinvented.com/qrcode_gowork.africareinvented.com.png" alt="Scan to Visit TiniTasks" style="width: 25%; border-radius: 6px; margin-bottom: 20px;" />
       <hr style="margin: 40px 0; border: none; border-top: 1px solid #0c0f8f;" />        
       <h2 style="font-size: 22px; color: #2c3e50; margin: 10px 0;">News Made for You</h2>

        <img src="https://culturays.com/tinitasks.jpg/" alt="Tini Tasks Poster" style="width: 70%; border-radius: 6px; margin-bottom: 20px;" />

        <p><a href="https://gowork.africareinvented.com/" style="display:inline-block;margin-top:1em;padding:0.5em 1em;background:#0070f3;color:white;text-decoration:none;border-radius:5px;">Connect. Collaborate. Conquer on Tini Tasks</a></p>   
      
       <footer style="font-size: 13px; color: #999999; text-align: center; height:300px"> 
     <hr style="margin: 40px 0; border: none; border-top: 1px solid #0c0f8f;" />
      <br/>
    <a href="https://gowork.africareinvented.com/" style="color:#f97316;">
      Tini Tasks — Collaborate & Conquer
    </a> <br/>
    <a href="https://www.instagram.com/culturays_/" style="color:#f97316;">
      Instagram
    </a> <br/>
     <a href="https://www.facebook.com/CulturaysSpot/" style="color:#f97316;">
     Facebook
    </a> <br/>
     <a href="https://x.com/culturays" style="color:#f97316;">
      X
    </a> <br/>
     <a href="https://www.youtube.com/@Culturays" style="color:#f97316;">
      Youtube
    </a> <br/>  
 
    <hr style="margin-top:30px" />
    </footer>
    </div>
  `;
 
  // Send the email 
    await fastifyX.emailQueue.add('contact', {
      type: "contact",
       to: profile.email,
       from: "Tini Tasks — <contact@culturays.com>",
       replyTo: "contact@culturays.com",
      subject: `Someone wants to contact you - ${new Date().toLocaleDateString()}`,
      html: htmlContent,
    }) 
    return reply.send({ success: true });   
})


// The Webhook Route
fastify.post('/webhooks/ses', async (request, reply) => {
  const body = request.body as any

  // When you first add the URL to AWS, they send a "SubscriptionConfirmation"
  if (body.Type === 'SubscriptionConfirmation') {
    console.log('Confirming SNS Subscription...')
    // Use a simple fetch to confirm the subscription
    await fetch(body.SubscribeURL)
    return { status: 'confirmed' }
  }

  // 2. HANDLE SES NOTIFICATIONS
  if (body.Type === 'Notification') {
    const message = JSON.parse(body.Message)
    const notificationType = message.notificationType // 'Bounce', 'Complaint', or 'Delivery'
    const mail = message.mail
    const emailAddress = mail.destination[0]

    console.log(`SES Event: ${notificationType} for ${emailAddress}`)

    // 3. UPDATE SUPABASE
    if (notificationType === 'Bounce' || notificationType === 'Complaint') {
      // Mark user as unsubscribed or "bounced" so you don't mail them again
      await fastify.supabase
        .from('newsletter_subscribers')
        .update({ 
          status: notificationType.toLowerCase(),
          active: false 
        })
        .eq('email', emailAddress)
    } 
    
    else if (notificationType === 'Delivery') {
      // Optional: Log successful delivery
      console.log(`Successfully delivered to ${emailAddress}`)
    }
  }

  return { ok: true }
})

 
fastify.listen({ port: 4000, host: '0.0.0.0' })