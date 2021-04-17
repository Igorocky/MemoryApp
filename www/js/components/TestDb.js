"use strict";

function TestDb({}) {

    const BACKUP_FILE = 'state-backup.json'

    const s = {
        RECORDS: 'RECORDS',
        CORDOVA_FILE: 'CORDOVA_FILE',
    }

    const [state, setState] = useState(() => createNewState({}))
    const newRecordTextFieldRef = useRef(null)

    const con = useConsole()

    function createNewState({prevState, params}) {
        function getParam(name,defValue) {
            const fromParams = params?.[name]
            if (fromParams !== undefined) {
                return fromParams
            }
            const fromPrevState = prevState?.[name]
            if (fromPrevState !== undefined) {
                return fromPrevState
            }
            return defValue
        }

        return createObj({
            [s.RECORDS]: [],
            [s.ERRORS]: [],
            [s.CORDOVA_FILE]: JSON.stringify(cordova.file),
        })
    }

    function addNewRecord() {
        const newRecordText = newRecordTextFieldRef.current.value
        if (hasValue(newRecordText) && newRecordText.trim() !== '') {
            setState(prev => prev.set(s.RECORDS, [newRecordText, ...prev[s.RECORDS]]))
            newRecordTextFieldRef.current.value=''
        }
    }

    function writeStringToFile({file,string}) {
        console.log({file,string})
        window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function (dirEntry) {
            con.info('#1')
            con.info(`externalDataDirectory: ${dirEntry}`)
            dirEntry.getFile(file, { create: true }, function (fileEntry) {
                con.info('#2')
                fileEntry.createWriter(function (fileWriter) {
                    con.info('#3')
                    fileWriter.onwriteend = function (e) {
                        con.info('#4')
                        con.info('Write completed.');
                    };

                    fileWriter.onerror = function (e) {
                        con.info('#5')
                        con.info('Write failed: ' + e.toString());
                    };

                    // Create a new Blob and write it to log.txt.
                    var blob = new Blob([string], { type: 'text/plain' });

                    fileWriter.write(blob);
                    con.info('#6')

                });
            });
        }, e => {
            con.error(e.message)
        });
    }

    function readStringFromFile({file, onLoad}) {
        console.log({file})
        window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory, function (dirEntry) {
            con.info('##1')
            con.info(`externalDataDirectory: ${dirEntry}`)
            dirEntry.getFile(file, { create: true }, function (fileEntry) {
                con.info('##2')
                fileEntry.file(function (file) {
                    const reader = new FileReader()

                    reader.onloadend = function() {
                        con.info("Successful file read: " + this.result);
                        con.info('##3')
                        onLoad(this.result)
                    };

                    reader.readAsText(file)

                }, e => {con.error('Error fileEntry.file: ' + e.message)});
            });
        }, e => {con.error('Error resolveLocalFileSystemURL: ' + e.message)});
    }

    function backup() {
        writeStringToFile({
            file: BACKUP_FILE,
            string: JSON.stringify(state[s.RECORDS])
        })
    }

    function restore() {
        readStringFromFile({
            file:BACKUP_FILE,
            onLoad: newStateStr => setState(prev => prev.set(s.RECORDS, JSON.parse(newStateStr)))
        })
    }

    return RE.Fragment({},
        RE.div({}, `data-dir: ${state[s.CORDOVA_FILE]?.replaceAll(',',', ')}`),
        con.renderConsole(),
        RE.table({},
            RE.tbody({},
                RE.tr({},
                    RE.td({},
                        RE.TextField(
                            {
                                inputRef:newRecordTextFieldRef,
                                variant: 'outlined', label: 'Add new record',
                                style: {width: 300},
                                size: 'small',
                                onKeyDown: event => {
                                    if (event.nativeEvent.keyCode == 13) {
                                        addNewRecord()
                                    }
                                }
                            }
                        )
                    ),
                    RE.td({},
                        RE.Button({onClick: addNewRecord}, 'Add')
                    )
                ),
                RE.tr({},
                    RE.td({},
                        RE.Button({onClick: backup}, 'backup')
                    ),
                    RE.td({},
                        RE.Button({onClick: restore}, 'restore')
                    )
                ),
                state[s.RECORDS].map(record =>
                    RE.tr({},
                        RE.td({}, record)
                    )
                ),
                state[s.ERRORS].map(record =>
                    RE.tr({},
                        RE.td({style:{color:'red'}}, record)
                    )
                )
            )
        )
    )
}
