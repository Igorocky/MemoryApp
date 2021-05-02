"use strict";

const DebugTab = ({}) => {

    const inputDataTextFieldRef = useRef(null)

    const [openConfirmActionDialog, closeConfirmActionDialog, renderConfirmActionDialog] = useConfirmActionDialog()

    useEffect(() => {
        // doAction()
    }, [])

    function deleteAllData() {
        openConfirmActionDialog({
            confirmText: "Delete all the data?",
            onCancel: closeConfirmActionDialog,
            startActionBtnText: "Delete",
            startAction: ({updateInProgressText,onDone}) => {
                withTransaction({
                    isReadWrite:true,
                    action: transaction => {
                        transaction.objectStore(TAGS_STORE).clear().onsuccess = () => {
                            transaction.objectStore(NOTES_STORE).clear().onsuccess = () => {
                                onDone({
                                    actionDoneText: 'The data was deleted.',
                                    actionDoneBtnText: 'OK',
                                    onActionDoneBtnClick: closeConfirmActionDialog
                                })
                            }
                        }
                    }
                })
            },
        })
    }

    function generateTestData() {
        openConfirmActionDialog({
            confirmText: "Generate test data?",
            onCancel: closeConfirmActionDialog,
            startActionBtnText: "Generate",
            startAction: ({updateInProgressText,onDone}) => {
                generateRandomData({
                    numOfTags:100,
                    numOfNotes:1_000,
                    onProgress: msg => updateInProgressText(msg),
                    onSuccess: () => onDone({
                        actionDoneText: 'Data was generated',
                        actionDoneBtnText: 'OK',
                        onActionDoneBtnClick: closeConfirmActionDialog
                    }),
                    onError: msg => onDone({
                        actionDoneText: `There was and error during test data generation: ${msg}`,
                        actionDoneBtnText: 'OK',
                        onActionDoneBtnClick: closeConfirmActionDialog
                    })
                })
            },
        })
    }

    function restoreData() {
        openConfirmActionDialog({
            confirmText: "Restore data from string?",
            onCancel: closeConfirmActionDialog,
            startActionBtnText: "Restore",
            startAction: ({updateInProgressText,onDone}) => {
                restoreDatabaseFromString({
                    dbContentStr: inputDataTextFieldRef.current.value,
                    onProgress: msg => updateInProgressText(msg),
                    onSuccess: () => onDone({
                        actionDoneText: 'Data was restored',
                        actionDoneBtnText: 'OK',
                        onActionDoneBtnClick: closeConfirmActionDialog
                    })
                })
            },
        })
    }

    function doAction(inputText) {
        generateRandomData({numOfTags:100, numOfNotes:100_000})
        return
        inputText = '{\n' +
            '  "dbVersion": 1,\n' +
            '  "tags": [\n' +
            '    {\n' +
            '      "name": "1",\n' +
            '      "color": "1",\n' +
            '      "priority": "1",\n' +
            '      "id": 1\n' +
            '    },\n' +
            '    {\n' +
            '      "id": 2,\n' +
            '      "name": "2",\n' +
            '      "color": "green",\n' +
            '      "priority": ""\n' +
            '    }\n' +
            '  ]\n' +
            '}'
        console.log("inputText = " + inputText)
        restoreDatabaseFromString({
            dbContentStr:inputText,
            onDone: errMsg => console.log("Database restore completed: errMsg = " + errMsg)
        })
    }

    return RE.Container.col.top.left({}, {style: {marginBottom:'10px'}},
        RE.Button({variant:'contained', color:'primary', onClick: deleteAllData}, 'Delete all data'),
        RE.Button({variant:'contained', color:'primary', onClick: generateTestData}, 'Generate test data'),
        RE.Button({variant:'contained', color:'primary', onClick: restoreData}, 'Restore data from string'),
        RE.TextField(
            {
                variant: 'outlined', label: 'Input data', multiline: true, rowsMax: 100,
                style: {width: '400px'},
                inputRef:inputDataTextFieldRef
            }
        ),
        renderConfirmActionDialog()
    )
}