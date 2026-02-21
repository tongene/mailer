import dotenv from "dotenv";
dotenv.config();
import { Worker } from 'bullmq'
import { SendEmailCommand } from '@aws-sdk/client-ses'
import {SESClient} from '@aws-sdk/client-ses'
const ses = new SESClient({
region: 'eu-north-1',
credentials: {
accessKeyId: process.env.AWS_ACCESS_KEY!,
secretAccessKey: process.env.AWS_SECRET_KEY!
}
})
 
const worker = new Worker(
  'emails',
  async job => {
    console.log('Sending email to:', job.data.to)
 
  const { to, subject, html } = job.data

 const command = new SendEmailCommand({
Source: '[contact@culturays.com](mailto:contact@culturays.com)',
Destination: { ToAddresses: [to] },
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
  {
    connection: {
      host: '127.0.0.1',
      port: 6379
    }
    ,limiter: {
      max: 5,
      duration: 1000    
  }
  }
)

worker.on('completed', job => {
  console.log(`Email job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`Email job ${job?.id} failed`, err)
})

 




 