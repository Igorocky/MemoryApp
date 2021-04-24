'use strict';

const AppConfigTab = ({}) => {

    const [openConfirmActionDialog, closeConfirmActionDialog, renderConfirmActionDialog] = useConfirmActionDialog()

    function doBackupData() {
        openConfirmActionDialog({
            pConfirmText: "Backup data?",
            pOnCancel: closeConfirmActionDialog,
            pStartActionBtnText: "Backup",
            pStartAction: ({onDone}) => backupDatabase({fileName: APP_CONFIG.dbBackupFileName, onDone}),
            pActionDoneText: "Backup created.",
            pActionDoneBtnText: "Ok",
            pOnActionDoneBtnClick: closeConfirmActionDialog
        })
    }

    function doRestoreData() {
        openConfirmActionDialog({
            pConfirmText: "Restore data?",
            pOnCancel: closeConfirmActionDialog,
            pStartActionBtnText: "Restore",
            pStartAction: ({onDone}) => restoreDatabase({
                fileName: APP_CONFIG.dbBackupFileName,
                onDone: errMsg => {
                    if (hasValue(errMsg)) {
                        closeConfirmActionDialog()
                        openConfirmActionDialog({
                            pConfirmText: "Data was restored with errors.",
                            pOnCancel: closeConfirmActionDialog,
                            pStartActionBtnText: "Ok",
                            pStartAction: closeConfirmActionDialog,
                            pActionDoneText: null,
                            pActionDoneBtnText: null,
                            pOnActionDoneBtnClick: null
                        })
                    } else {
                        onDone()
                    }
                }
            }),
            pActionDoneText: "Data was restored.",
            pActionDoneBtnText: "Ok",
            pOnActionDoneBtnClick: closeConfirmActionDialog
        })
    }

    return RE.Fragment({},
        RE.Container.col.top.left({}, {},
            RE.Container.row.left.center({}, {},
                RE.Button({onClick: doBackupData}, 'Backup data'),
                RE.Button({onClick: doRestoreData}, 'Restore data'),
            ),
            JSON.stringify(APP_CONFIG, null, 4)
        ),
        renderConfirmActionDialog()
    )
}