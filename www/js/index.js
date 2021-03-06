/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready

document.addEventListener('deviceready', onDeviceReady, false);

const ROOT_ELEM_ID = 'root-elem'

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    const initLog = createLogger(LOGGERS.init)

    initLog.info(() => 'Running cordova-' + window.cordova?.platformId + '@' + window.cordova?.version);
    initLog.info(() => 'PATHS: ' + JSON.stringify(window.cordova?.file,null,4))

    readStringFromFile({
        file: APP_CONFIG_FILE_NAME,
        onLoad: fileStr => APP_CONFIG = JSON.parse(fileStr),
        onFileDoesntExist: () => writeStringToFile({
            file: APP_CONFIG_FILE_NAME,
            string: JSON.stringify(APP_CONFIG,null,4),
            logger: initLog
        }),
        logger: initLog
    })

    openDb({logger: initLog})

    ReactDOM.render(
        re(ViewSelector),
        document.getElementById(ROOT_ELEM_ID)
    )
}

if (isInHtml()) {
    onDeviceReady()
}
