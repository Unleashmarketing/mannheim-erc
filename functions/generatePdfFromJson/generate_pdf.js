// npm install jspdf
const { jsPDF } = require("jspdf");
const fs = require("fs");
const path = require("node:path");

function isValidIBANNumber(input) {
  var CODE_LENGTHS = {
    AD: 24,
    AE: 23,
    AT: 20,
    AZ: 28,
    BA: 20,
    BE: 16,
    BG: 22,
    BH: 22,
    BR: 29,
    CH: 21,
    CR: 21,
    CY: 28,
    CZ: 24,
    DE: 22,
    DK: 18,
    DO: 28,
    EE: 20,
    ES: 24,
    FI: 18,
    FO: 18,
    FR: 27,
    GB: 22,
    GI: 23,
    GL: 18,
    GR: 27,
    GT: 28,
    HR: 21,
    HU: 28,
    IE: 22,
    IL: 23,
    IS: 26,
    IT: 27,
    JO: 30,
    KW: 30,
    KZ: 20,
    LB: 28,
    LI: 21,
    LT: 20,
    LU: 20,
    LV: 21,
    MC: 27,
    MD: 24,
    ME: 22,
    MK: 19,
    MR: 27,
    MT: 31,
    MU: 30,
    NL: 18,
    NO: 15,
    PK: 24,
    PL: 28,
    PS: 29,
    PT: 25,
    QA: 29,
    RO: 24,
    RS: 22,
    SA: 24,
    SE: 24,
    SI: 19,
    SK: 24,
    SM: 27,
    TN: 24,
    TR: 26,
    AL: 28,
    BY: 28,
    CR: 22,
    EG: 29,
    GE: 22,
    IQ: 23,
    LC: 32,
    SC: 31,
    ST: 25,
    SV: 28,
    TL: 23,
    UA: 29,
    VA: 22,
    VG: 24,
    XK: 20,
  };
  var iban = String(input)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ""), // keep only alphanumeric characters
    code = iban.match(/^([A-Z]{2})(\d{2})([A-Z\d]+)$/), // match and capture (1) the country code, (2) the check digits, and (3) the rest
    digits;
  // check syntax and length
  if (!code || iban.length !== CODE_LENGTHS[code[1]]) {
    return false;
  }
  // rearrange country code and check digits, and convert chars to ints
  digits = (code[3] + code[1] + code[2]).replace(/[A-Z]/g, function (letter) {
    return letter.charCodeAt(0) - 55;
  });
  // final check
  return mod97(digits) === 1;
}

function mod97(string) {
  var checksum = string.slice(0, 2),
    fragment;
  for (var offset = 2; offset < string.length; offset += 7) {
    fragment = String(checksum) + string.substring(offset, offset + 7);
    checksum = parseInt(fragment, 10) % 97;
  }
  return checksum;
}

function checkAndAddPage(pageState, lineHeight) {
  if (pageState.y + lineHeight > pageState.pageHeight) {
    pageState.doc.addPage();
    pageState.y = pageState.topMargin;
    return true;
  }
  return false;
}

function prettyPrintJson(data, x, pageState, lineHeight, indentStep) {
  const doc = pageState.doc;
  const maxWidth = 195 - x; // Max width for text (A4 210mm - 15mm margin)

  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data)) {
      // Handle Array
      checkAndAddPage(pageState, 0);
      pageState.x += indentStep;
      data.forEach((item) => {
        // Recurse for the array item
        doc.text("-", x + indentStep, pageState.y);
        pageState.y += lineHeight;
        pageState.x += indentStep;
        prettyPrintJson(
          item,
          x + indentStep,
          pageState,
          lineHeight,
          indentStep
        );
        pageState.x -= indentStep;
      });
      pageState.x -= indentStep;
      checkAndAddPage(pageState, 0);
    } else {
      // Handle Object
      checkAndAddPage(pageState, 0);

      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];
          const keyLine = `${key}:`;

          checkAndAddPage(pageState, 0);
          doc.text(keyLine, x + indentStep, pageState.y);

          if (typeof value === "object" && value !== null) {
            // If value is nested object/array, start it on a new line
            pageState.y += lineHeight;
            prettyPrintJson(
              value,
              x + indentStep,
              pageState,
              lineHeight,
              indentStep
            );
          } else {
            // Primitive value, print it on the same line as the key
            const valueString = String(value);
            const keyWidth = doc.getTextWidth(keyLine);
            const valueX = x + indentStep + keyWidth + 2; // +2mm for space

            const splitLines = doc.splitTextToSize(valueString, 195 - valueX);
            if (splitLines.length > 1) {
              doc.setLineHeightFactor(1.4);
            }
            doc.text(splitLines, valueX, pageState.y);
            if (splitLines.length > 1) {
              doc.setLineHeightFactor(1.15);
              pageState.y += 3;
            }

            // Move Y position
            pageState.y += lineHeight;
          }
        }
      }

      checkAndAddPage(pageState, 0);
    }
  } else {
    // Handle Primitive (string, number, boolean, null)
    const valueString = String(data);
    const splitLines = doc.splitTextToSize(valueString, maxWidth);
    if (splitLines.length > 1) {
      doc.setLineHeightFactor(1.4);
    }
    doc.text(splitLines, x, pageState.y);
    if (splitLines.length > 1) {
      doc.setLineHeightFactor(1.15);
      pageState.y += 3;
    }
    pageState.y += lineHeight;
  }
}

/**
 * Takes a JSON formatted string, parses it, and saves a PDF
 * file pretty-printing its key-value pairs.
 * * @param {string} jsonString - The JSON string to parse.
 * @param {string} outputFilePath - The path to save the PDF file (e.g., "output.pdf").
 */
function generatePdfFromJson(jsonString, outputFilePath, documentType = 0) {
  /*documentType = 0: Membership
                   1: ELS*/
  if (
    !(
      fs.existsSync(outputFilePath) &&
      fs.lstatSync(outputFilePath).isDirectory()
    )
  ) {
    return [false, "outputFilePath either does not exist or is not a folder"];
  }
  if (!(documentType in [0, 1])) {
    return [false, "Document type must be 0 or 1"];
  }
  let parsedJson;
  try {
    // 1. Parse the JSON string
    parsedJson = JSON.parse(jsonString);
    // We can accept arrays or objects at the top level
    if (typeof parsedJson !== "object" || parsedJson === null) {
      throw new Error("Input must be a valid JSON object or array.");
    }
  } catch (error) {
    console.error("JSON Parsing Error:", error.message);
    return [false, "JSON Parsing Error"]; // Stop execution
  }

  let requiredKeys = [];
  let optionalKeys = [];
  if (documentType == 0) {
    requiredKeys = [
      "Name",
      "Vorname",
      "Straße",
      "PLZ",
      "Wohnort",
      "Geburtsdatum",
      "Geschlecht",
      "Staatsangehörigkeit",
      "Telefon/Mobil",
      "e-Mail",
      "Name Kreditinstitut",
      "Kontoinhaber",
      "IBAN",
      "Abteilung",
      "Einzugsermächtigung",
    ];
    optionalKeys = [
      "Unterabteilung",
      "Minderj-Name",
      "Minderj-Vorname",
      "Minderj-Straße",
      "Minderj-PLZ",
      "Minderj-Wohnort",
      "Minderj-Geburtsdatum",
      "Minderj-Geschlecht",
      "Minderj-Staatsangehörigkeit",
    ];
  }
  const isInteger = (string) => string == Number.parseInt(string);
  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };
  let removableKeys = [];
  for (const [key, _value] of Object.entries(parsedJson)) {
    if (requiredKeys.includes(key) || optionalKeys.includes(key)) {
      continue;
    }
    removableKeys.push(key);
  }
  for (let i in removableKeys) {
    key = removableKeys[i];
    delete parsedJson[key];
  }
  for (let i in requiredKeys) {
    reqKey = requiredKeys[i];
    if (!(reqKey in parsedJson)) {
      return [false, "Field " + reqKey + " missing from payload"];
    }
    if (!(typeof parsedJson[reqKey] == "string")) {
      return [false, "Field " + reqKey + " is not a string"];
    }
    if (parsedJson[reqKey].length == 0) {
      return [false, "Field " + reqKey + " can not be empty"];
    }
    switch (reqKey) {
      case "PLZ": {
        if (!isInteger(parsedJson[reqKey])) {
          return [false, "Field " + reqKey + " must be an integer"];
        }
        break;
      }
      case "Geburtsdatum": {
        if (isNaN(new Date(parsedJson[reqKey]))) {
          return [false, reqKey + " must be a valid date"];
        }
        break;
      }
      case "Telefon/Mobil": {
        let checkPhone = parsedJson[reqKey];
        while (parsedJson[reqKey][0] == "+") {
          checkPhone = parsedJson[reqKey].substring(1);
          if (length(checkPhone) == 0) {
            return [false, reqKey + " invalid format"];
          }
        }
        while (checkPhone[0] == "0") {
          checkPhone = checkPhone.substring(1);
          if (checkPhone.length == 0) {
            return [false, reqKey + " invalid format"];
          }
        }
        if (!isInteger(checkPhone)) {
          return [false, reqKey + " must contain only numbers"];
        }
        break;
      }
      case "e-Mail": {
        if (!validateEmail(parsedJson[reqKey])) {
          return [false, reqKey + " invalid format"];
        }
        break;
      }
      case "IBAN": {
        parsedJson[reqKey].replace(/\s/g, "");
        if (!isValidIBANNumber(parsedJson[reqKey])) {
          return [false, reqKey + " invalid format"];
        }
        break;
      }
      case "Einzugsermächtigung": {
        if (parsedJson[reqKey].toLowerCase() != "ja") {
          return [false, reqKey + " not accepted."];
        }
        break;
      }
      case "Abteilung": {
        if (
          parsedJson[reqKey].toLowerCase() != "eiskunstlauf" &&
          parsedJson[reqKey].toLowerCase() != "eisschnelllauf"
        ) {
          return [false, reqKey + " must be Eiskunstlauf or Eisschnelllauf."];
        }
        break;
      }
    }
  }
  try {
    // 2. Initialize a new jsPDF document
    const doc = new jsPDF();
    const font = fs.readFileSync("aurulent-sans.ttf", "binary");
    doc.addFileToVFS("aurulent-sans.ttf", font);
    doc.addFont("aurulent-sans.ttf", "aurulent-sans", "normal");
    doc.setFont("aurulent-sans");
    doc.setLineHeightFactor(1.15);
    const yPosition = 20; // Starting Y position on the page (in mm)
    const leftMargin = 15;
    const lineHeight = 8; // Smaller line height for denser text
    const indentStep = 7; // Smaller indent
    title = "";
    if (documentType == 0) {
      title = "Aufnahmeantrag";
    }
    doc.setFontSize(16);
    doc.text(title, leftMargin, yPosition);
    doc.setFontSize(11); // Use a smaller font for data

    // Setup page state
    let pageState = {
      y: yPosition + lineHeight * 2, // Start below title
      doc: doc,
      pageHeight: 280, // Near bottom of A4
      topMargin: 20, // Top margin for new pages
    };

    // 3. Call the recursive pretty printer
    prettyPrintJson(parsedJson, leftMargin, pageState, lineHeight, indentStep);
    const randomString = Math.random().toString(36).slice(2, 8);
    // 4. Save the file to the disk using Node's fs module
    const generatedFileFullPath =
      path.join(outputFilePath, randomString) + ".pdf";
    fs.writeFileSync(generatedFileFullPath, doc.output());
    console.log(`Successfully generated PDF at: ${generatedFileFullPath}`);
    return [true, generatedFileFullPath];
  } catch (error) {
    // Handle PDF generation errors
    console.error("PDF Generation Error:", error.message);
    return [false, error.message];
  }
}

// --- Example Usage ---
// You can replace this with your own JSON string
const sampleJsonString = `
{
    "5":"hi",
    "Name": "Doe",
    "Vorname": "John",
    "Geburtsdatum": "1977-04-30",
    "isStudent": "false",
    "courses": [
        { "title": "History 101", "credits": 3 },
        { "title": "Math 202", "credits": 4 }
    ],
    "address": {
        "street": "123 Main St",
        "city": "Anytown",
        "zipcode": "12345"
    },
    "longText": "This is a very long text string that will hopefully be wrapped correctly by the jsPDF library to fit within the page margins.",
    "Straße":"Hauptstraße 1",
    "PLZ":"09434",
    "Wohnort":"Hirschhorn",
    "Geschlecht":"M",
    "Staatsangehörigkeit":"Eritrea",
    "Telefon/Mobil":"04433321",
    "e-Mail":"bigMan@johnson.com",
    "Name Kreditinstitut":"Bank",
    "Kontoinhaber":"Me",
    "IBAN":"DE06 4306 0967 7912 5497 00",
    "Einzugsermächtigung":"ja",
    "Abteilung":"Eisschnelllauf"
}
`;

// Define the output file path
const outputFilePath =
  "/home/jacky_treehorn/gitRepos/mannheim-erc/functions/generatePdfFromJson/artefacts/";

// Call the function
out = generatePdfFromJson(sampleJsonString, outputFilePath);
console.log(out);
