const nodemailer = require("nodemailer");
const Redis = require("ioredis");
const querystring = require("querystring");
const parseFormData = require("./parseFormData");
require("dotenv").config();

// Initialize Redis client
const client = new Redis({
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_HOST,
  password: process.env.REDIS_PASSWORD,
});

const windowOfTimeSeconds = 60;
const maxTriesInWindow = 5;

exports.handler = async (event) => {
  const startTime = process.hrtime();

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify("Method Not Allowed"),
    };
  }

  const headers = event.headers;
  const contentType = headers["content-type"];

  let body = {};
  try {
    if (contentType.includes("application/json")) {
      body = JSON.parse(event.body);
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      body = querystring.parse(event.body);
    } else if (contentType.includes("multipart/form-data")) {
      body = await parseFormData(event);
    } else {
      return {
        statusCode: 400,
        body: `Unsupported content type: ${contentType}`,
      };
    }
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify("Invalid data"),
    };
  }

  const { username, password } = headers;
  const {
    to,
    cc,
    bcc,
    from,
    subject,
    body: emailBody,
    attachment,
    port,
  } = body.fields;

  const requiredFields = { username, password, to, subject, body };
  const missingFields = [];

  for (const [field, value] of Object.entries(requiredFields)) {
    if (!value) {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    return {
      statusCode: 400,
      body: `Missing required field(s): ${missingFields.join(", ")}`,
    };
  }

  const ip = event.headers["x-forwarded-for"] || event.headers["client-ip"];
  const currentTime = Math.floor(Date.now() / 1000);

  try {
    // Check IP rate limit
    const record = await client.get(ip);
    const data = record
      ? JSON.parse(record)
      : { count: 0, startTime: currentTime };
    const elapsedTime = currentTime - data.startTime;

    if (elapsedTime < windowOfTimeSeconds) {
      if (data.count >= maxTriesInWindow) {
        return {
          statusCode: 429,
          body: JSON.stringify({
            message: "Too many requests, please try again later.",
          }),
        };
      }
      data.count += 1;
    } else {
      data.count = 1;
      data.startTime = currentTime;
    }

    await client.set(ip, JSON.stringify(data));

    let fromAddress = from || username;
    let smtpPort = port === 465 ? 465 : 587;

    // Append the footer to the email body
    const modifiedEmailBody = `${emailBody}\r\n\r\n[ sent by: https://restmail.ing/ ]`;

    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: username,
        pass: password,
      },
    });

    let mailOptions = {
      from: fromAddress,
      to: to,
      cc: cc,
      bcc: bcc,
      subject: subject,
      text: modifiedEmailBody,
      attachments: attachment ? [attachment] : [],
    };

    let info = await transporter.sendMail(mailOptions);

    const endTime = process.hrtime(startTime);
    const runTime = (endTime[0] * 1e9 + endTime[1]) / 1e6; // Convert to milliseconds

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Email sent",
        info: info,
        runtime: `${runTime.toFixed(2)}ms`,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error sending email",
        error: error.toString(),
      }),
    };
  } finally {
    // Optionally, you can close the Redis client here if you're sure all operations are complete.
    await client.quit();
  }
};
