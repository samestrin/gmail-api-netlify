const nodemailer = require("nodemailer");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  const headers = event.headers;
  const body = JSON.parse(event.body);

  const { username, password } = headers;
  const { to, cc, bcc, from, subject, body: emailBody, attachment } = body;

  if (!username || !password || !to || !subject || !emailBody) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing required fields" }),
    };
  }

  let fromAddress = from || username;

  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
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
    text: emailBody,
    attachments: attachment ? [attachment] : [],
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email sent", info: info }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error sending email",
        error: error.toString(),
      }),
    };
  }
};
