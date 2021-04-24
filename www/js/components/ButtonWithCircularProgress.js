const inButtonCircularProgressStyle = {
    color: MuiColors.green[500],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
}

const ButtonWithCircularProgress = ({pButtonText, pStartAction, variant}) => {
    const [actionIsInProgress, setActionIsInProgress] = useState(false)

    function doAction() {
        setActionIsInProgress(true)
        pStartAction({onDone: () => setActionIsInProgress(false)})
    }

    return RE.div({style:{position: 'relative'}},
        RE.Button({variant: variant?variant:"contained", disabled: actionIsInProgress, onClick: doAction}, pButtonText),
        RE.If(actionIsInProgress,
            RE.CircularProgress({size:24, style: inButtonCircularProgressStyle})
        )
    )
}