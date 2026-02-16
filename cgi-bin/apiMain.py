#!/mnt/web412/c2/53/5128953/htdocs/pythonVirtualEnvs/webseite_2026/web2026/bin/python

import cgitb
cgitb.enable()

try:
    import json
    import os
    from flask import Flask, request, jsonify
    from flask_cors import CORS
    import typing
    import time
    from wsgiref.handlers import CGIHandler

    LOCK_FILE = os.path.join(os.path.dirname(__file__), "tanList.json.lock")
    LOCK_FILE_WAIT_TIME = 5.0
    LOCK_FILE_ERROR_MSG = "Sperrdatei noch belegt!"
    tanListFileName = "tanList.json"
    tanListFullPath = os.path.join(os.path.dirname(__file__), tanListFileName)
    tanDictEmailKey = "tanDictEmailKey"
    tanDictIndexKey = "tanDictIndexKey"
    tanDictLargestIndexKey = "tanDictLargestIndex"
    tanDictFormEnumKey = "tanDictFormEnumKey"
    TAN_LIST_SIZE = 128
    TAN_LIST_RENEWAL_RETAIN_SIZE = 16
    app = Flask(__name__)
    CORS(app)

    def getLockFile() -> bool:
        waitTime = 0.0
        lockObtainedCleanly = True
        while os.path.exists(LOCK_FILE):
            time.sleep(0.1)
            waitTime += 0.1
            if waitTime >= LOCK_FILE_WAIT_TIME:
                lockObtainedCleanly = False
                break;
        return lockObtainedCleanly

    def send_email_with_attachment(subject: str,
                                   content: str,
                                   from_field: str = "",
                                   fileNameFilePathDict: typing.Optional[typing.Dict[str,
                                                                                     typing.Union[str, bytes]]] = None,
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
                except:
                    return False
        if emailConfig["YOUR_STRATO_USER"] is None or emailConfig["YOUR_STRATO_PASS"] is None:
            return False
        from email.message import EmailMessage
        msg = EmailMessage()
        msg['Subject'] = subject
        msg['To'] = "rastapopoulis@hotmail.com"  # change this for deployment
        msg['From'] = "stv.schnelllauf@merc-online.de"
        if isinstance(from_field, str) and "@" in from_field and from_field.count("@") == 1 and from_field != msg['From'] and from_field != msg['To']:
            msg['cc'] = from_field
            msg['Reply-To'] = from_field
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
        except:
            return False

        try:
            import smtplib
            # Port 465 requires SMTP_SSL
            with smtplib.SMTP_SSL("smtp.strato.de", 465) as server:
                server.login(emailConfig["YOUR_STRATO_USER"],
                             emailConfig["YOUR_STRATO_PASS"])
                server.send_message(msg)

            if deleteFiles and fileNameFilePathDict is not None:
                for filename, file_path in fileNameFilePathDict.items():
                    if isinstance(file_path, str) and os.path.exists(file_path) and os.path.isfile(file_path):
                        os.remove(file_path)
            return True
        except:
            return False

    def _generateTanListHelper() -> typing.Dict[str, typing.Dict[str, typing.Union[int, str]]]:
        import secrets
        TAN_DICT = {}
        for _ind in range(TAN_LIST_SIZE):
            hash_hex = secrets.token_hex(nbytes=3)
            TAN_DICT[hash_hex] = {tanDictIndexKey: 0,
                                  tanDictEmailKey: "", tanDictFormEnumKey: '-1'}
        TAN_DICT[tanDictLargestIndexKey] = 0
        return TAN_DICT

    def _generateTanList(TAN_DICT: typing.Optional[typing.Dict[str, typing.Dict[str, typing.Union[int, str]]]] = None) -> typing.Tuple[typing.Dict[str, typing.Union[str, bool]], int]:
        lockObtained = getLockFile()
        try:
            assert lockObtained, LOCK_FILE_ERROR_MSG
            with open(LOCK_FILE, 'w') as f:
                f.write("locked")
            if os.path.exists(tanListFullPath):
                os.remove(tanListFullPath)
            if TAN_DICT is None:
                TAN_DICT = _generateTanListHelper()
            with open(tanListFullPath, "w") as f:
                json.dump(TAN_DICT, f, indent=4)
            out = send_email_with_attachment("Neue TAN-Liste wurde erstellt",
                                             "Siehe Anhang",
                                             fileNameFilePathDict={
                                                 tanListFileName: tanListFullPath},
                                             deleteFiles=False)
            if out:
                return jsonify({"success": out, "message": "TAN Liste generiert"}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
        finally:
            if os.path.exists(LOCK_FILE):
                os.remove(LOCK_FILE)
        return jsonify({"success": False, "message": "Unbekannter Fehler"}), 500

    @app.route('/api/generateNewTanList', methods=["GET"])
    def generateTanList() -> typing.Tuple[typing.Dict[str, typing.Union[str, bool]], int]:
        return _generateTanListAndAssign()

    @app.route('/api/submit', methods=['POST', 'OPTIONS'])
    def submit_form() -> typing.Tuple[typing.Dict[str, typing.Union[str, bool]], int]:
        try:
            file = request.form.get('attachment', None)
            fileAsBlob = request.files.get('attachment', None)
            subject = request.form.get("subject", "Unbekannt")
            content = request.form.get("message", "Leer")
            from_field = request.form.get(
                "email", "stv.schnelllauf@merc-online.de")
            attachmentDict = None
            if file is not None and isinstance(file, str):
                filename = os.path.basename(file)
                attachmentDict = {filename: file}
            if fileAsBlob is not None:
                explicitFileName = request.form.get("attachmentName", None)
                if explicitFileName is None:
                    return jsonify({"success": False, "error": "Param 'attachmentName' fehlt im Request"}), 400
                attachmentDict = {explicitFileName: fileAsBlob.read()}
            out = send_email_with_attachment(
                subject, content, from_field, attachmentDict)
            if out:
                return jsonify({"success": True, "message": "Nachricht gesendet"}), 200
        except Exception as e:
            print(e)
            return jsonify({"success": False, "error": str(e)}), 500
        return jsonify({"success": False, "error": "Unbekannt"}), 400

    @app.route('/api/isTanValid', methods=["GET"])
    def isTanValid() -> str:
        '''Return '0': TAN existiert nicht
        Return '1': TAN gueltig, nie genutzt
        Return '2': TAN gueltig mit angegebener Email
        Return '3': TAN Datei nicht verfuegbar
        Return '4': _config leer
        Return '5': TAN gueltig aber mit anderer Email
        Return '6': TAN gueltig aber falsche Formular'''
        if not os.path.exists(tanListFullPath):
            return '3'
        lockObtained = getLockFile()
        try:
            assert lockObtained, LOCK_FILE_ERROR_MSG
            with open(LOCK_FILE, 'w') as f:
                f.write("locked")
            _config = {}
            with open(tanListFullPath, "r") as f:
                _config = json.load(f)
            if _config == {}:
                return '4'
            tan = request.args.get('tan')
            email = request.args.get('email')
            formEnum = request.args.get('formEnum')
            if tan is not None:
                if tan not in _config:
                    return '0'
                if _config[tan][tanDictFormEnumKey] != '-1' and (formEnum is None or formEnum != _config[tan][tanDictFormEnumKey]):
                    return '6'
                if _config[tan][tanDictEmailKey] == "":
                    return '1'
                if email is not None and _config[tan][tanDictEmailKey].lower() == email.lower().strip():
                    return '2'
            return '5'
        except Exception as e:
            return str(e)
        finally:
            if os.path.exists(LOCK_FILE):
                os.remove(LOCK_FILE)

    @app.route('/api/assignEmailToTan', methods=["POST", "OPTIONS"])
    def assignEmailToTan() -> typing.Tuple[typing.Dict[str, typing.Union[str, bool]], int]:
        if not os.path.exists(tanListFullPath):
            return jsonify({"success": False, "error": "TAN Liste existiert nicht"}), 503
        lockObtained = getLockFile()
        try:
            assert lockObtained, LOCK_FILE_ERROR_MSG
            with open(LOCK_FILE, 'w') as f:
                f.write("locked")
            _config = {}
            with open(tanListFullPath, "r") as f:
                _config = json.load(f)
            if _config == {}:
                return jsonify({"success": False, "error": "TAN_DICT muss neu generiert werden"}), 503
            tan = request.form.get('tan')
            email = request.form.get('email')
            formEnum = request.form.get('formEnum')
            if tan is None:
                return jsonify({"success": False, "error": "Keine TAN Angabe"}), 400
            if email is None:
                return jsonify({"success": False, "error": "Keine e-mail Angabe"}), 400
            if formEnum is None:
                return jsonify({"success": False, "error": "Keine formEnum Angabe"}), 400
            email = email.strip()
            if tan in _config and _config[tan][tanDictEmailKey] != "":
                if _config[tan][tanDictEmailKey].lower() != email.lower():
                    return jsonify({"success": False, "error": "TAN schon an andere E-mail zugewiesen"}), 409
                return jsonify({"success": True, "message": "TAN schon an diese E-mail zugewiesen"}), 200
            listSizeReached = False
            if tan in _config:
                largestCurrentIndex = _config[tanDictLargestIndexKey]
                _config[tan][tanDictEmailKey] = email
                _config[tan][tanDictIndexKey] = largestCurrentIndex + 1
                _config[tan][tanDictFormEnumKey] = formEnum
                _config[tanDictLargestIndexKey] = largestCurrentIndex + 1
                if _config[tanDictLargestIndexKey] >= TAN_LIST_SIZE:
                    listSizeReached = True
                if not listSizeReached:
                    if os.path.exists(tanListFullPath):
                        with open(tanListFullPath, "w") as f:
                            json.dump(_config, f, indent=4)
                            return jsonify({"success": True, "message": "TAN entwertet"}), 200
                    else:
                        return jsonify({"success": False, "error": "TAN Liste konnte nicht gefunden werden"}), 404
            else:
                return jsonify({"success": False, "error": "TAN nicht vorhanden"}), 404
            if listSizeReached:
                _generateTanListAndAssign()
                return jsonify({"success": True, "message": "TAN entwertet"}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
        finally:
            if os.path.exists(LOCK_FILE):
                os.remove(LOCK_FILE)
        return jsonify({"success": False, "message": "Bedingung nicht erfuellt"}), 412

    def _generateTanListAndAssign() -> typing.Tuple[typing.Dict[str, typing.Union[str, bool]], int]:
        lockObtained = getLockFile()
        try:
            assert lockObtained, LOCK_FILE_ERROR_MSG
            TAN_DICT = _generateTanListHelper()
            with open(LOCK_FILE, 'w') as f:
                f.write("locked")
            oldTanDict = {}
            largestIndex = 0
            if os.path.exists(tanListFullPath):
                _config = {}
                with open(tanListFullPath, "r") as f:
                    _config = json.load(f)
                if tanDictLargestIndexKey in _config:
                    largestIndex = _config[tanDictLargestIndexKey]
                for key, value in _config.items():
                    if key == tanDictLargestIndexKey or value[tanDictIndexKey] <= 0 or value[tanDictIndexKey] < largestIndex - TAN_LIST_RENEWAL_RETAIN_SIZE + 1:
                        continue
                    oldTanDict[key] = value
            for key in oldTanDict.keys():
                oldTanDict[key][tanDictIndexKey] -= largestIndex
            TAN_DICT.update(oldTanDict)
            if os.path.exists(LOCK_FILE):
                os.remove(LOCK_FILE)
            out = _generateTanList(TAN_DICT)
            return out
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
        finally:
            if os.path.exists(LOCK_FILE):
                os.remove(LOCK_FILE)

    @app.route('/api/getTanList', methods=["GET"])
    def getTanList() -> typing.Tuple[typing.Dict[str, typing.Union[str, bool]], int]:
        lockObtained = getLockFile()
        try:
            assert lockObtained, LOCK_FILE_ERROR_MSG
            with open(LOCK_FILE, 'w') as f:
                f.write("locked")
            if os.path.exists(tanListFullPath):
                out = send_email_with_attachment("TAN-Liste",
                                                 "Siehe Anhang",
                                                 fileNameFilePathDict={
                                                     tanListFileName: tanListFullPath},
                                                 deleteFiles=False)
                if out:
                    return jsonify({"success": True, "message": "TAN Liste per email versendet"}), 200
            return jsonify({"success": False, "message": "TAN Liste konnte per email nicht versendet werden"}), 500
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
        finally:
            if os.path.exists(LOCK_FILE):
                os.remove(LOCK_FILE)

    @app.route('/api/getRandomArithmeticQuestion', methods=["GET"])
    def getRandomArithmeticQuestion() -> str:
        import random
        result0 = random.randrange(16)
        result1 = random.randrange(16)
        return str(result0) + " + "+str(result1)
    
    @app.route('/api/checkRandomArithmeticAnswer', methods=["GET"])
    def checkRandomArithmeticAnswer() -> typing.Tuple[typing.Dict[str, typing.Union[str, bool]], int]:
        try:
            num0 = request.args.get('num0')
            assert num0 is not None, "'num0' is None"
            num0 = int(num0)
            assert num0 < 16, "num0 implausible"
            num1 = request.args.get('num1')
            assert num1 is not None, "'num1' is None"
            num1 = int(num1)
            assert num1 < 16, "num1 implausible"
            answer = request.args.get('answer')
            assert answer is not None, "'answer' is None"
            return jsonify({"success": num0+num1==int(answer), "message": "evaluated"}), 200
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500

    if __name__ == '__main__':
        CGIHandler().run(app)
except Exception as e:
    print("Content-Type: text/plain")
    print()
    print("PYTHON ERROR DETECTED:")
    print(str(e))
