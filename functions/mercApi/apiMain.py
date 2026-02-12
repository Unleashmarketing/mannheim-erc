#!/mnt/web412/c2/53/5128953/htdocs/pythonVirtualEnvs/webseite_2026/web2026/bin/python
# Put this file and stvSchnelllaufCreds.json into /mnt/web412/c2/53/5128953/htdocs/cgi-bin
import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import typing
from threading import Lock
from wsgiref.handlers import CGIHandler


tanListFileLock = Lock()
tanListAppLock = Lock()
tanListFileName = "tanList.json"
tanDictAppConfigKey = "TAN_DICT"
tanDictEmailKey = "tanDictEmailKey"
tanDictIndexKey = "tanDictIndexKey"
tanDictLargestIndexKey = "tanDictLargestIndex"
tanDictFormEnumKey = "tanDictFormEnumKey"
TAN_LIST_SIZE = 128
TAN_LIST_RENEWAL_RETAIN_SIZE = 16
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

def send_email_with_attachment(subject: str,
                               content: str,
                               from_field: str = "",
                               fileNameFilePathDict: typing.Optional[typing.Dict[str, typing.Union[str, bytes]]] = None,
                               deleteFiles: bool = True) -> bool:
    emailConfig = {}
    emailConfig["YOUR_STRATO_USER"] = None
    emailConfig["YOUR_STRATO_PASS"] = None
    if os.path.exists(os.path.join(os.path.dirname(__file__), "stvSchnelllaufCreds.json")):
        with open(os.path.join(os.path.dirname(__file__), "stvSchnelllaufCreds.json"), "r") as f:
            stvCreds = json.load(f)
            try:
                emailConfig["YOUR_STRATO_USER"] = stvCreds["user"]
                emailConfig["YOUR_STRATO_PASS"] = stvCreds["pass"]
            except Exception as e:
                print("Credentials file not readable", e)
    if emailConfig["YOUR_STRATO_USER"] is None or emailConfig["YOUR_STRATO_PASS"] is None:
        return False
    from email.message import EmailMessage
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = "stv.schnelllauf@merc-online.de"
    msg['To'] = "rastapopoulis@hotmail.com" # change this for deployment
    if isinstance(from_field, str) and "@" in from_field and from_field.count("@") == 1 and from_field != msg['From'] and from_field != msg['To']:
        msg['cc'] = from_field
    msg.set_content(content)

    try:
        if fileNameFilePathDict is not None:
            for filename, file_path in fileNameFilePathDict.items():
                file_data = file_path
                if isinstance(file_path, str):
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
        import smtplib
        # Port 465 requires SMTP_SSL
        with smtplib.SMTP_SSL("smtp.strato.de", 465) as server:
            server.login(emailConfig["YOUR_STRATO_USER"], emailConfig["YOUR_STRATO_PASS"])
            server.send_message(msg)
            
        print("Email sent successfully")
        if deleteFiles and fileNameFilePathDict is not None:
            for filename, file_path in fileNameFilePathDict.items():
                if isinstance(file_path, str) and os.path.exists(file_path) and os.path.isfile(file_path):
                    os.remove(file_path)
        return True
    except Exception as error:
        print(f"Error: {error}")
        return False

def _generateTanListHelper() -> typing.Dict[str, typing.Dict[str, typing.Union[int,str]]]:
    import secrets
    TAN_DICT = {}
    for _ind in range(TAN_LIST_SIZE):
        hash_hex = secrets.token_hex(nbytes=3)
        TAN_DICT[hash_hex] = {tanDictIndexKey:0, tanDictEmailKey:"", tanDictFormEnumKey: '-1'}
    TAN_DICT[tanDictLargestIndexKey] = 0
    return TAN_DICT

def _generateTanList(TAN_DICT: typing.Optional[typing.Dict[str, typing.Dict[str, typing.Union[int,str]]]] = None) -> typing.Tuple[typing.Dict[str, typing.Union[str, bool]], int]:
    with tanListFileLock:
        try:
            if os.path.exists(os.path.join(os.path.dirname(__file__), tanListFileName)):
                os.remove(os.path.join(os.path.dirname(__file__), tanListFileName))
            if TAN_DICT is None:
                TAN_DICT = _generateTanListHelper()
            with open(os.path.join(os.path.dirname(__file__), tanListFileName), "w") as f:
                json.dump(TAN_DICT, f, indent=4)
            out = send_email_with_attachment("Neue TAN-Liste wurde erstellt",
                                             "Siehe Anhang",
                                             fileNameFilePathDict = {tanListFileName: os.path.join(os.path.dirname(__file__), tanListFileName)},
                                             deleteFiles = False)
            if out:
                return jsonify({"success": out, "message": "TAN Liste generiert"}), 200
        except Exception as e:
            print(e)
            return jsonify({"success": False, "error": str(e)}), 500
        return jsonify({"success": False, "message": "Unbekannter Fehler"}), 500

if not os.path.exists(os.path.join(os.path.dirname(__file__), tanListFileName)):
    with app.app_context():
        out = _generateTanList()
        print(out)

app.config[tanDictAppConfigKey] = {}
with tanListFileLock:
    with open(os.path.join(os.path.dirname(__file__), tanListFileName), "r") as f:
        app.config[tanDictAppConfigKey] = json.load(f)

@app.route('/api/generateNewTanList', methods=["GET"])
def generateTanList() -> typing.Tuple[typing.Dict[str, typing.Union[str, bool]],int]:
    if request.method != "GET":
        return jsonify({"success":False, "error": "request.method nicht vom Typ GET"}), 400
    return _generateTanListAndAssign()

@app.route('/api/submit', methods=['POST'])
def submit_form() -> typing.Tuple[typing.Dict[str, typing.Union[str, bool]],int]:
    try:
        if request.method != "POST":
            return jsonify({"success":False, "error": "request.method nicht vom Typ POST"}), 400
        file = request.form.get('attachment', None)
        fileAsBlob = request.files.get('attachment', None)
        subject = request.form.get("subject", "Unbekannt")
        content = request.form.get("message", "Leer")
        from_field = request.form.get("email", "stv.schnelllauf@merc-online.de")
        attachmentDict = None
        if file is not None and isinstance(file, str):
                filename = os.path.basename(file)
                attachmentDict = {filename: file}
        if fileAsBlob is not None:
            explicitFileName = request.form.get('attachmentName', None)
            if explicitFileName is None:
                return jsonify({"success": False, "error":"Param 'attachmentName' fehlt im Request"}), 400
            attachmentDict = {explicitFileName: fileAsBlob.read()}
        out = send_email_with_attachment(subject, content, from_field, attachmentDict)
        if out:
            return jsonify({"success": True, "message": "Nachricht gesendet"}), 200
    except Exception as e:
        print(e)
        return jsonify({"success":False, "error": str(e)}), 500
    return jsonify({"success":False, "error": "Unbekannt"}), 400

@app.route('/api/isTanValid', methods=["GET"])
def isTanValid() -> str:
    '''Return '0': TAN existiert nicht
       Return '1': TAN gueltig, nie genutzt
       Return '2': TAN gueltig mit angegebener Email
       Return '3': Request nicht vom Typ GET
       Return '4': app.config["TAN_DICT"] leer
       Return '5': TAN gueltig aber mit anderer Email
       Return '6': TAN gueltig aber falsche Formular'''
    if request.method != "GET":
        return '3'
    if app.config[tanDictAppConfigKey] == {}:
        return '4'
    tan = request.args.get('tan')
    email = request.args.get('email')
    formEnum = request.args.get('formEnum')
    if tan is not None:
        if tan not in app.config[tanDictAppConfigKey]:
            return '0'
        if app.config[tanDictAppConfigKey][tan][tanDictFormEnumKey] != '-1' and (formEnum is None or formEnum != app.config[tanDictAppConfigKey][tan][tanDictFormEnumKey]):
            return '6'
        if app.config[tanDictAppConfigKey][tan][tanDictEmailKey] == "":
            return '1'
        if email is not None and app.config[tanDictAppConfigKey][tan][tanDictEmailKey].lower() == email.lower().strip():
            return '2'
    return '5'

@app.route('/api/assignEmailToTan', methods=["POST"])
def assignEmailToTan() -> typing.Tuple[typing.Dict[str, typing.Union[str, bool]],int]:
    try:
        if request.method != "POST":
            return jsonify({"success":False, "error": "request.method nicht vom Typ POST"}), 400
        if app.config[tanDictAppConfigKey] == {}:
            return jsonify({"success":False, "error": "TAN_DICT muss neu generiert werden"}), 503
        tan = request.form.get('tan')
        email = request.form.get('email')
        formEnum = request.form.get('formEnum')
        if tan is None:
            return jsonify({"success":False, "error": "Keine TAN Angabe"}), 400
        if email is None:
            return jsonify({"success":False, "error": "Keine e-mail Angabe"}), 400
        if formEnum is None:
            return jsonify({"success":False, "error": "Keine formEnum Angabe"}), 400
        email = email.strip()
        if tan in app.config[tanDictAppConfigKey] and app.config[tanDictAppConfigKey][tan][tanDictEmailKey] != "": 
            if app.config[tanDictAppConfigKey][tan][tanDictEmailKey].lower() != email.lower():
                return jsonify({"success":False, "error": "TAN schon an andere E-mail zugewiesen"}), 409
            return jsonify({"success":True, "message": "TAN schon an diese E-mail zugewiesen"}), 200
        listSizeReached = False
        if tan in app.config[tanDictAppConfigKey]:
            largestCurrentIndex = app.config[tanDictAppConfigKey][tanDictLargestIndexKey]
            with tanListAppLock:
                app.config[tanDictAppConfigKey][tan][tanDictEmailKey] = email
                app.config[tanDictAppConfigKey][tan][tanDictIndexKey] = largestCurrentIndex + 1
                app.config[tanDictAppConfigKey][tan][tanDictFormEnumKey] = formEnum
                app.config[tanDictAppConfigKey][tanDictLargestIndexKey] = largestCurrentIndex + 1
            if app.config[tanDictAppConfigKey][tanDictLargestIndexKey] >= TAN_LIST_SIZE:
                listSizeReached = True
            if not listSizeReached:
                if os.path.exists(os.path.join(os.path.dirname(__file__), tanListFileName)):
                    with tanListFileLock:
                        with open(os.path.join(os.path.dirname(__file__), tanListFileName), "w") as f:
                            json.dump(app.config[tanDictAppConfigKey], f, indent=4)
                            return jsonify({"success":True, "message": "TAN entwertet"}), 200
                else:
                    return jsonify({"success":False, "error": "TAN Liste konnte nicht gefunden werden"}), 404
        else:
            return jsonify({"success":False, "error": "TAN nicht vorhanden"}), 404
        if listSizeReached:
            _generateTanListAndAssign()
            return jsonify({"success":True, "message": "TAN entwertet"}), 200
    except Exception as e:
        return jsonify({"success":False, "error": str(e)}), 500
    return jsonify({"success":False, "message": "Bedingung nicht erfuellt"}), 412

def _generateTanListAndAssign() -> typing.Tuple[typing.Dict[str, typing.Union[str, bool]], int]:
    TAN_DICT = _generateTanListHelper()
    try:
        oldTanDict = {}
        largestIndex = 0
        if tanDictLargestIndexKey in app.config[tanDictAppConfigKey]:
            largestIndex = app.config[tanDictAppConfigKey][tanDictLargestIndexKey]
        for key, value in app.config[tanDictAppConfigKey].items():
            if key == tanDictLargestIndexKey or value[tanDictIndexKey] <= 0 or value[tanDictIndexKey] < largestIndex - TAN_LIST_RENEWAL_RETAIN_SIZE + 1:
                continue
            oldTanDict[key] = value
        for key in oldTanDict.keys():
            oldTanDict[key][tanDictIndexKey] -= largestIndex
        TAN_DICT.update(oldTanDict)
        out = _generateTanList(TAN_DICT)
        with tanListAppLock:
            app.config[tanDictAppConfigKey] = TAN_DICT
        return out
    except Exception as e:
        return jsonify({"success":False, "error": str(e)}), 500

@app.route('/api/getTanList', methods=["GET"])
def getTanList() -> typing.Tuple[typing.Dict[str, typing.Union[str, bool]], int]:
    if request.method != "GET":
        return jsonify({"success":False, "error": "request.method nicht vom Typ GET"}), 400
    if os.path.exists(os.path.join(os.path.dirname(__file__), tanListFileName)):
        out = send_email_with_attachment("TAN-Liste",
                                         "Siehe Anhang",
                                         fileNameFilePathDict = {tanListFileName: os.path.join(os.path.dirname(__file__), tanListFileName)},
                                         deleteFiles=False)
        if out:
            return jsonify({"success":True, "message": "TAN Liste per email versendet"}), 200
    return jsonify({"success":False, "message": "TAN Liste konnte per email nicht versendet werden"}), 500

if __name__ == '__main__':
    CGIHandler().run(app)
    # app.run(host='0.0.0.0', port=8888, debug=False)