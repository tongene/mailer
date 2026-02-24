import dotenv from "dotenv";
dotenv.config();
import { Worker } from 'bullmq'
import { SendEmailCommand } from '@aws-sdk/client-ses'
import {SESClient} from '@aws-sdk/client-ses'
const ses = new SESClient({
region: 'us-east-1',
credentials: {
accessKeyId: process.env.AWS_ACCESS_KEY!,
secretAccessKey: process.env.AWS_SECRET_KEY!
}
})
 const redisConnection = {
  host: '127.0.0.1',
  port: 6379,
  password: process.env.REDIS_PASSWORD 
};
 
const worker = new Worker(
  'emails',
  async job => {
    // console.log('Sending email to:', job.data.to)
 
  const { to, subject, html } = job.data

 const command = new SendEmailCommand({
Source: 'contact@culturays.com',
Destination: { ToAddresses: [to] },
ReplyToAddresses: ["contact@culturays.com"],
ConfigurationSetName: 'my-first-configuration-set',
Message: {
Subject: { Data: subject },
Body: {
Html: { Data: html }
}
}
})

await ses.send(command)
    return true
  },
   { connection:
     redisConnection,
      limiter: {
      max: 5,
      duration: 1000    
  }
  },
   
  
)

worker.on('completed', job => {
  console.log(`Email job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed`, err)
})
