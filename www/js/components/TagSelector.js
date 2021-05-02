"use strict";

const TagSelector = ({allTags, selectedTags, onTagSelected, onTagRemoved}) => {

    const [filterText, setFilterText] = useState('')

    function renderSelectedTags() {
        return RE.Fragment({style: {padding:'5px'}},
            selectedTags.map(tag => RE.Chip({
                variant:'outlined',
                color:'primary',
                size:'small',
                onDelete: () => onTagRemoved(tag),
                label: tag.name,
                style: {marginRight:'10px', marginBottom:'5px'}
            }))
        )
    }

    function renderTagFilter() {
        return RE.TextField(
            {
                variant: 'outlined',
                style: {width: 300},
                size: 'small',
                onChange: event => setFilterText(event.nativeEvent.target.value.trim().toLowerCase())
            }
        )
    }

    function renderFilteredTags() {
        const filteredTags = filterText.length == 0 ? allTags : allTags.filter(tag => tag.name.toLowerCase().indexOf(filterText) >= 0)
        if (filteredTags.length == 0) {
            return 'No tags match the search criteria'
        } else {
            return RE.div({style:{maxHeight:'250px', overflow:'auto'}},
                filteredTags.map(tag => RE.div(
                    {
                        key:tag.id,
                        style: {padding: '5px'}
                    },
                    RE.Chip({
                        variant:'outlined',
                        size:'small',
                        onClick: () => onTagSelected(tag),
                        label: tag.name,
                        style: {marginRight:'10px'}
                    })
                ))
            )
        }
    }

    return RE.Container.col.top.left({},{},
        renderSelectedTags(),
        renderTagFilter(),
        renderFilteredTags()
    )
}