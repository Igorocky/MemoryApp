'use strict';

function isInBrowserRun() {
    return window.cordova?.platformId === 'browser'
}

function isInHtml() {
    return window.cordova === undefined || window.cordova === null
}

function isInBrowser() {
    return isInHtml() || isInBrowserRun()
}

let APP_CONFIG_FILE_NAME = 'application.config'

let APP_CONFIG = {
    logLevels: {
        [LOGGERS.init]: LOG_LEVELS.trace.name,
        [LOGGERS.fileReadWrite]: LOG_LEVELS.error.name,
        [LOGGERS.database]: LOG_LEVELS.error.name,
        [LOGGERS.common]: LOG_LEVELS.info.name,
    },
    logSizeMax: 1000,
    logRecordsPerPage: 20,
    logToConsole: isInBrowser(),
    dbBackupFileName: 'MemoryApp-backup.json',
}