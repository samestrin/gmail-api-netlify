// netlify/functions/formDataParser.js

const busboy = require("busboy");

const parseFormData = (event) => {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: event.headers });
    const result = {
      files: [],
      fields: {},
    };

    bb.on("file", (fieldname, file, filename, encoding, mimetype) => {
      let buffer = "";
      file.on("data", (data) => {
        buffer += data.toString("base64");
      });
      file.on("end", () => {
        result.files.push({
          fieldname,
          filename,
          content: buffer,
          encoding,
          mimetype,
        });
      });
    });

    bb.on("field", (fieldname, val) => {
      result.fields[fieldname] = val;
    });

    bb.on("close", () => {
      resolve(result);
    });

    bb.on("error", (err) => {
      reject(err);
    });

    bb.write(Buffer.from(event.body, "base64"));
    bb.end();
  });
};

module.exports = parseFormData;
