'use strict';

const LOG_LEVELS = {
    none: {priority:0, name:'none'},
    error: {priority:1, name:'error'},
    info: {priority:2, name:'info'},
    debug: {priority:3, name:'debug'},
    trace: {priority:4, name:'trace'},
}

const LOGGERS = {
    init: 'init',
    fileReadWrite: 'file-rw',
    database: 'db',
    common: 'common',
    commonInfo: 'commonInfo',
}

