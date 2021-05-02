'use strict';

const APP_LOG_EVENTS = []

function createLogger(loggerName) {
    const loggerLogLevelName = APP_CONFIG.logLevels[loggerName]??LOG_LEVELS.none.name
    const loggerLogLevelPriority = LOG_LEVELS[loggerLogLevelName].priority

    function createLogFunction(eventLogLevel) {
        return msgProvider => log({
            loggerName,
            loggerLogLevelPriority,
            eventLogLevelPriority:eventLogLevel.priority,
            eventLogLevelName:eventLogLevel.name,
            msgProvider
        })
    }

    return {
        error: createLogFunction(LOG_LEVELS.error),
        info: createLogFunction(LOG_LEVELS.info),
        debug: createLogFunction(LOG_LEVELS.debug),
        trace: createLogFunction(LOG_LEVELS.trace),
    }
}

function log({loggerName, loggerLogLevelPriority, eventLogLevelPriority, eventLogLevelName, msgProvider}) {
    if (loggerLogLevelPriority >= eventLogLevelPriority) {
        const logRecord = {
            time: new Date().getTime(),
            level: eventLogLevelName,
            logger: loggerName,
            msg: msgProvider()
        }
        APP_LOG_EVENTS.push(logRecord)
        if (APP_CONFIG.logToConsole) {
            console.log(logRecordToString(logRecord))
            if (eventLogLevelName === LOG_LEVELS.error.name) {
                console.trace()
            }
        }
        while (APP_LOG_EVENTS.length > APP_CONFIG.logSizeMax) {
            APP_LOG_EVENTS.shift()
        }
    }
}

function logRecordToString(logRec) {
    return `${new Date(logRec.time).toISOString()} ${logRec.level.toUpperCase()} [${logRec.logger}] ${logRec.msg}`
}

const commonLog = createLogger(LOGGERS.common)
const commonInfoLog = createLogger(LOGGERS.commonInfo)