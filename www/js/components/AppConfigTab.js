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

    return RE.Fragment({},
        RE.Container.col.top.left({}, {},
            RE.Container.row.left.center({}, {},
                RE.Button({onClick: doBackupData}, 'Backup data')
            ),
            JSON.stringify(APP_CONFIG, null, 4)
        ),
        renderConfirmActionDialog()
    )
}