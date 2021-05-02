'use strict';

const ViewSelector = ({}) => {
    const [selectedView, setSelectedView] = useState(() => NotesView)
    const [showMoreControlButtons, setShowMoreControlButtons] = useState(false)

    function renderControlButtons() {

        const buttons = [[
            {iconName:"fast_rewind", onClick: () => setSelectedView(null)},
            {icon:RE.Icon({style:{transform: "scaleX(-1)"}}, "play_arrow"), onClick: () => setSelectedView(null)},
            {iconName:"play_arrow", onClick: () => setSelectedView(() => TagsView)},
            {iconName:"fast_forward", onClick: () => setSelectedView(null)},
            {iconName:"delete_forever", onClick: () => setSelectedView(null)},
            {iconName:"settings", onClick: () => setSelectedView(() => AppConfigView)},
            {iconName:"equalizer", onClick: () => setSelectedView(() => NotesView)},
            {iconName:"more_horiz", onClick: () => setShowMoreControlButtons(!showMoreControlButtons)},
        ]]
        if (showMoreControlButtons) {
            buttons.push([
                {iconName:"history", onClick: () => setSelectedView(null)},
                {iconName:"flip_to_back", onClick: () => setSelectedView(null)},
                {iconName:"record_voice_over", onClick: () => setSelectedView(null)},
            ])
        }

        return re(KeyPad, {
            componentKey: "controlButtons",
            keys: buttons,
            variant: "outlined",
        })
    }

    return RE.Fragment({},
        renderControlButtons(),
        selectedView ? re(selectedView, {}) : 'No view selected'
    )
}