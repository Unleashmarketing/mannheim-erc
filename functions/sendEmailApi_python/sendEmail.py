import smtplib
from email.message import EmailMessage
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import typing

app = Flask(__name__)
CORS(app)

app.config["YOUR_STRATO_USER"] = None
app.config["YOUR_STRATO_PASS"] = None
if os.path.exists(os.path.join(os.path.dirname(__file__), "stvSchnelllaufCreds.json")):
    with open(os.path.join(os.path.dirname(__file__), "stvSchnelllaufCreds.json"), "r") as f:
        stvCreds = json.load(f)
        try:
            app.config["YOUR_STRATO_USER"] = stvCreds["user"]
            app.config["YOUR_STRATO_PASS"] = stvCreds["pass"]
        except Exception as e:
            print("Credentials file not readable", e)

@app.route('/submit', methods=['POST'])
def submit_form():
    try:
        file = request.form.get('attachment', None)
        subject = request.form.get("subject", "Unknown")
        content = request.form.get("message", "Empty")
        from_field = request.form.get("email", "stv.schnelllauf@merc-online.de")
        filename = None
        if file is not None:
            filename = os.path.basename(file)
        out = send_email_with_attachment(subject, content, from_field, {filename: file})
        if out:
            return jsonify({"success": True, "message": "Nachricht gesendet"}), 200
    except Exception as e:
        print(e)
        return jsonify({"success":False, "error": str(e)}), 500
    return jsonify({"success":False, "error": "unknown"}), 404

def send_email_with_attachment(subject: str,
                               content: str,
                               from_field: str,
                               fileNameFilePathDict: typing.Optional[typing.Dict[str, str]] = None):
    if app.config["YOUR_STRATO_USER"] is None or app.config["YOUR_STRATO_PASS"] is None:
        return False
    
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = "stv.schnelllauf@merc-online.de"
    msg['To'] = "rastapopoulis@hotmail.com" # change this for deployment
    msg['cc'] = from_field
    msg.set_content(content)

    try:
        if fileNameFilePathDict is not None:
            for filename, file_path in fileNameFilePathDict.items():
                with open(file_path, 'rb') as f:
                    file_data = f.read()
                    msg.add_attachment(
                        file_data,
                        maintype='application',
                        subtype='octet-stream',
                        filename=filename
                    )
    except Exception as e:
        print(e)
        return False

    try:
        # Port 465 requires SMTP_SSL
        with smtplib.SMTP_SSL("smtp.strato.de", 465) as server:
            server.login(app.config["YOUR_STRATO_USER"], app.config["YOUR_STRATO_PASS"])
            server.send_message(msg)
            
        print("Email sent successfully")
        if file_path is not None:
            os.remove(file_path)
        return True
    except Exception as error:
        print(f"Error: {error}")
        return False

if __name__ == '__main__':
    app.run(debug=False)