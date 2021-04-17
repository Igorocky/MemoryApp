"use strict";

function Pagination({numOfPages,curPage,onChange}) {

    return RE.ButtonGroup({variant:'contained', size:'small'},
        RE.TextField(
            {
                variant: 'outlined', label: 'Version',
                style: {width: 80},
                size: 'small',
                onKeyDown: event => {
                    if (event.nativeEvent.keyCode == 13) {
                        const newPageStr = event.nativeEvent.target.value?.replaceAll(/\D/g,'')
                        if (newPageStr.length) {
                            onChange(parseInt(newPageStr))
                            event.nativeEvent.target.value = ''
                        }
                    }
                },
            }
        ),
        RE.Button({key:'<<',onClick: () => onChange(1), disabled: curPage == 1},
            '<<'
        ),
        RE.Button({key:'<',onClick: () => onChange(curPage-1), disabled: curPage == 1},
            '<'
        ),
        RE.Button({key:'>',onClick: () => onChange(curPage+1), disabled: curPage == numOfPages},
            '>'
        ),
        RE.Button({key:'>>',onClick: () => onChange(numOfPages), disabled: curPage == numOfPages},
            '>>'
        ),
        ints(Math.max(1,curPage-3),Math.min(numOfPages,curPage+3)).map(p => RE.Button(
            {
                key:`page-btn-${p}`,
                onClick: () => p==curPage?null:onChange(p)
            },
            p==curPage?(`[${p}]`):p
        )),
        (curPage+3 < numOfPages)?[
            RE.Button({key:'...',disabled: true},
                '...'
            ),
            RE.Button({key:'last-page',onClick: () => onChange(numOfPages)},
                numOfPages
            )
        ]:null,
    )
}
