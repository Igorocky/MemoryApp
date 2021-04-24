'use strict';

let APP_CONFIG_FILE_NAME = 'application.config'

let APP_CONFIG = {
    logLevels: {
        [LOGGERS.fileReadWrite]: LOG_LEVELS.error.name,
        [LOGGERS.database]: LOG_LEVELS.error.name,
    },
    logSizeMax: 1000,
    logRecordsPerPage: 20,
    logToConsole: false
}