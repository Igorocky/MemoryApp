"use strict";

const ConfirmActionDialog = ({pConfirmText, pOnCancel, pStartActionBtnText, pStartAction,
    pActionDoneText, pActionDoneBtnText, pOnActionDoneBtnClick}) => {
    const [actionIsInProgress, setActionIsInProgress] = useState(false)
    const [actionIsDone, setActionIsDone] = useState(false)

    function startAction() {
        setActionIsInProgress(true)
        pStartAction({onDone: () => {
                setActionIsInProgress(false)
                setActionIsDone(true)
        }})
    }

    function drawContent() {
        if (!actionIsDone) {
            return RE.Typography({}, pConfirmText)
        } else {
            return RE.Typography({}, pActionDoneText)
        }
    }

    function drawActionButtons() {
        if (!actionIsDone) {
            return RE.Fragment({},
                RE.Button({onClick: pOnCancel, disabled: actionIsInProgress}, "Cancel"),
                re(ButtonWithCircularProgress, {pButtonText: pStartActionBtnText, pStartAction: startAction})
            )
        } else {
            return RE.Button({onClick: pOnActionDoneBtnClick, color:"primary", variant:"contained"},
                pActionDoneBtnText
            )
        }
    }

    return RE.Dialog({open:true},
        RE.DialogContent({}, drawContent()),
        RE.DialogActions({}, drawActionButtons())
    )
}