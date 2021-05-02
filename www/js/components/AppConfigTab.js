'use strict';

const AppConfigTab = ({}) => {

    const [openConfirmActionDialog, closeConfirmActionDialog, renderConfirmActionDialog] = useConfirmActionDialog()

    function doBackupData() {
        openConfirmActionDialog({
            confirmText: "Backup data?",
            onCancel: closeConfirmActionDialog,
            startActionBtnText: "Backup",
            startAction: ({updateInProgressText,onDone}) => backupDatabase({
                fileName: APP_CONFIG.dbBackupFileName,
                onProgress: msg => updateInProgressText(msg),
                onSuccess: msg => {
                    onDone({
                        actionDoneText: msg,
                        actionDoneBtnText: 'OK',
                        onActionDoneBtnClick: closeConfirmActionDialog
                    })
                },
                onError: msg => {
                    onDone({
                        actionDoneText: msg,
                        actionDoneBtnText: 'OK',
                        onActionDoneBtnClick: closeConfirmActionDialog
                    })
                }
            }),
        })
    }

    function doRestoreData() {
        openConfirmActionDialog({
            confirmText: "Restore data?",
            onCancel: closeConfirmActionDialog,
            startActionBtnText: "Restore",
            startAction: ({updateInProgressText,onDone}) => restoreDatabaseFromFile({
                fileName: APP_CONFIG.dbBackupFileName,
                onProgress: msg => updateInProgressText(msg),
                onSuccess: msg => {
                    onDone({
                        actionDoneText: 'Database was successfully restored.',
                        actionDoneBtnText: 'OK',
                        onActionDoneBtnClick: closeConfirmActionDialog
                    })
                },
                onError: msg => {
                    onDone({
                        actionDoneText: msg,
                        actionDoneBtnText: 'OK',
                        onActionDoneBtnClick: closeConfirmActionDialog
                    })
                }
            }),
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