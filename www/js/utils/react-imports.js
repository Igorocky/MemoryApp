'use strict';

const re = React.createElement;
const useState = React.useState
const useEffect = React.useEffect
const useMemo = React.useMemo
const useCallback = React.useCallback
const useRef = React.useRef
const useReducer = React.useReducer
const Fragment = React.Fragment

function reFactory(elemType) {
    return (props, ...children) => re(elemType, props, ...children)
}

const MaterialUI = window['MaterialUI']
const MuiColors = MaterialUI.colors
const ThemeProvider = MaterialUI.ThemeProvider;
const makeStyles = MaterialUI.makeStyles;
const CssBaseline = MaterialUI.CssBaseline;
const createMuiTheme = MaterialUI.createMuiTheme;

const DIRECTION = {row: "row", column: "column",}
const JUSTIFY = {flexStart: "flex-start", center: "center", flexEnd: "flex-end", spaceBetween: "space-between", spaceAround: "space-around",}
const ALIGN_ITEMS = {flexStart: "flex-start", center: "center", flexEnd: "flex-end", stretch: "stretch", spaceAround: "baseline",}

function gridFactory(direction, justify, alignItems) {
    return (props, childProps, ...children) => re(MaterialUI.Grid, {container:true, direction:direction,
            justify:justify, alignItems:alignItems, ...props},
        React.Children.map(children, child => {
            return re(MaterialUI.Grid, {item:true, ...childProps}, child)
        })
    )
}

function svgOnClick({nativeEvent, onClick, width, height, boundaries}) {
    if (onClick) {
        let target = nativeEvent.target
        while (hasValue(target) && target.nodeName != 'svg') {
            target = target.parentElement
        }
        if (target) {
            const svgBoundingClientRect = target.getBoundingClientRect()
            const clickViewScreenX = nativeEvent.clientX - svgBoundingClientRect.x
            const clickViewScreenY = nativeEvent.clientY - svgBoundingClientRect.y
            const H = height
            const W = width
            const h = boundaries.maxY - boundaries.minY
            const w = boundaries.maxX - boundaries.minX
            const pixelSize = H/W < h/w ? h/H : w/W
            const clickViewCenterX = -W/2 + clickViewScreenX
            const clickViewCenterY = -H/2 + clickViewScreenY
            const clickImageCenterX = clickViewCenterX*pixelSize
            const clickImageCenterY = clickViewCenterY*pixelSize
            const clickImageX = (boundaries.minX + boundaries.maxX)/2 + clickImageCenterX
            const clickImageY = (boundaries.minY + boundaries.maxY)/2 + clickImageCenterY
            onClick(clickImageX, clickImageY, nativeEvent)
        }
    }
}

const RE = {
    div: reFactory('div'),
    svg: ({width, height, boundaries, onClick, props}, ...children) => re('svg',
        {
            width,
            height,
            viewBox: `${boundaries.minX} ${boundaries.minY} ${boundaries.maxX - boundaries.minX} ${boundaries.maxY - boundaries.minY}`,
            onMouseDown: clickEvent => svgOnClick({nativeEvent: clickEvent.nativeEvent, onClick, width, height, boundaries}),
            onMouseUp: clickEvent => svgOnClick({nativeEvent: clickEvent.nativeEvent, onClick, width, height, boundaries}),
            ...(props?props:{})
        },
        children
    ),
    span: reFactory('span'),
    table: reFactory('table'),
    tbody: reFactory('tbody'),
    tr: reFactory('tr'),
    td: reFactory('td'),
    AppBar: reFactory(MaterialUI.AppBar),
    Button: reFactory(MaterialUI.Button),
    ButtonGroup: reFactory(MaterialUI.ButtonGroup),
    CircularProgress: reFactory(MaterialUI.CircularProgress),
    Checkbox: reFactory(MaterialUI.Checkbox),
    Dialog: reFactory(MaterialUI.Dialog),
    DialogContent: reFactory(MaterialUI.DialogContent),
    DialogActions: reFactory(MaterialUI.DialogActions),
    FormControlLabel: reFactory(MaterialUI.FormControlLabel),
    FormControl: reFactory(MaterialUI.FormControl),
    FormLabel: reFactory(MaterialUI.FormLabel),
    FormGroup: reFactory(MaterialUI.FormGroup),
    Grid: reFactory(MaterialUI.Grid),
    List: reFactory(MaterialUI.List),
    ListItem: reFactory(MaterialUI.ListItem),
    ListItemText: reFactory(MaterialUI.ListItemText),
    Modal: reFactory(MaterialUI.Modal),
    MenuItem: reFactory(MaterialUI.MenuItem),
    InputLabel: reFactory(MaterialUI.InputLabel),
    Paper: reFactory(MaterialUI.Paper),
    RadioGroup: reFactory(MaterialUI.RadioGroup),
    Radio : reFactory(MaterialUI.Radio),
    Slider: reFactory(MaterialUI.Slider),
    Select: reFactory(MaterialUI.Select),
    Typography: reFactory(MaterialUI.Typography),
    TextField: reFactory(MaterialUI.TextField),
    Toolbar: reFactory(MaterialUI.Toolbar),
    Tabs: reFactory(MaterialUI.Tabs),
    Tab: reFactory(MaterialUI.Tab),
    img: reFactory('img'),
    If: (condition, ...elems) => condition?re(Fragment,{},...elems):re(Fragment,{}),
    IfNot: (condition, ...elems) => !condition?re(Fragment,{},...elems):re(Fragment,{}),
    IfTrue: (condition, ...elems) => re(Fragment,{},...elems),
    Icon: reFactory(MaterialUI.Icon),
    Fragment: reFactory(React.Fragment),
    Container: {
        row: {
            left: {
                top: gridFactory(DIRECTION.row, JUSTIFY.flexStart, ALIGN_ITEMS.flexStart),
                center: gridFactory(DIRECTION.row, JUSTIFY.flexStart, ALIGN_ITEMS.center),
                bottom: gridFactory(DIRECTION.row, JUSTIFY.flexStart, ALIGN_ITEMS.flexEnd),
            },
            center: {
                top: gridFactory(DIRECTION.row, JUSTIFY.center, ALIGN_ITEMS.flexStart),
                center: gridFactory(DIRECTION.row, JUSTIFY.center, ALIGN_ITEMS.center),
            },
            right: {
                top: gridFactory(DIRECTION.row, JUSTIFY.flexEnd, ALIGN_ITEMS.flexStart),
                center: gridFactory(DIRECTION.row, JUSTIFY.flexEnd, ALIGN_ITEMS.center),
            },
        },
        col: {
            top: {
                left: gridFactory(DIRECTION.column, JUSTIFY.flexStart, ALIGN_ITEMS.flexStart),
                center: gridFactory(DIRECTION.column, JUSTIFY.flexStart, ALIGN_ITEMS.center),
                right: gridFactory(DIRECTION.column, JUSTIFY.flexStart, ALIGN_ITEMS.flexEnd),
            }
        }
    },
}

const SVG = {
    line: reFactory('line'),
    polyline: reFactory('polyline'),
    rect: reFactory('rect'),
    circle: reFactory('circle'),
    image: reFactory('image'),
    path: reFactory('path'),
    polygon: reFactory('polygon'),
    g: reFactory('g'),
    text: reFactory('text'),
}

function renderTabs({tabs,selectedTabKey,onTabSelected}) {
    return RE.Container.col.top.left({}, {style:{marginBottom:"5px"}},
        RE.Paper({square:true},
            RE.Tabs({value:selectedTabKey,
                    indicatorColor:"primary",
                    textColor:"primary",
                    onChange:(event,newTabKey)=>onTabSelected?.(newTabKey)
                },
                tabs.map(tabData => RE.Tab({
                    key:tabData.key,
                    label:tabData.label,
                    value:tabData.key,
                    disabled: hasValue(tabData.disabled) && tabData.disabled
                }))
            )
        ),
        tabs.find(tabData => tabData.key===selectedTabKey).render()
    )
}

function useConfirmActionDialog() {
    const [confirmActionDialogData, setConfirmActionDialogData] = useState(null)

    function renderConfirmActionDialog() {
        if (confirmActionDialogData) {
            return re(ConfirmActionDialog, confirmActionDialogData)
        } else {
            return null;
        }
    }

    function openConfirmActionDialog(dialogParams) {
        setConfirmActionDialogData(dialogParams)
    }

    function closeConfirmActionDialog() {
        setConfirmActionDialogData(null)
    }

    return [openConfirmActionDialog, closeConfirmActionDialog, renderConfirmActionDialog]
}