angular.module('CVGTool')

.controller('toolCtrl', ['$scope', '$rootScope', '$state', '$interval', '$mdDialog', 'toolSrvc', 'navSrvc', 'hotkeys', '$stateParams',
    function($scope, $rootScope, $state, $interval, $mdDialog, toolSrvc, navSrvc, hotkeys, $stateParams) {

        // Tool version
        $scope.toolVersion = navSrvc.getToolVersion();

        // ENABLE TOOLTIPS // NOTE: disabled because Jquery 3.5.1 has conflicts with function hasOwnProperty that tooltips use
        // $(function() {
        //     $('[data-toggle="tooltip"]').tooltip()
        // })
        
        function TimelineManager (frameFrom, frameTo) {
            // VARIABLES //
            var _this = this;
            _this.isPlaying = false;
            _this.frameJumpNumber = 1;
            _this.frameJumpNumberOptions = [{ id: 1, tag: "1" }, { id: 2, tag: "2" }, { id: 3, tag: "3" }, { id: 4, tag: "4" }, { id: 5, tag: "5" }, { id: 6, tag: "6" }, { id: 7, tag: "7" }, { id: 8, tag: "8" }, { id: 9, tag: "9" }, { id: 10, tag: "10" }, { id: 15, tag: "15" }, { id: 20, tag: "20" }];
        
            _this.promise;
            _this.slider = { // Options and values for the slider
                value: frameFrom,
                options: {
                    floor: frameFrom,
                    ceil: frameTo,
                    step: 1,
                    showTicks: true,
                    readOnly: false
                }
            }
            
            // FUNCTIONS //
            _this.setReadOnly = function() {
                _this.slider.options.readOnly = true;
            }
            
            _this.unsetReadOnly = function() {
                _this.slider.options.readOnly = false;
            }
            
            // Increases the frame of the timeline by 1
            _this.nextFrameAlwaysOne = function() {
                if ($scope.toolsManager.blockChanges) {
                    $scope.messagesManager.sendMessage("warning", "You can't change the frame while editing an object.");
                    return;
                };

                if (_this.slider.value + 1 > _this.slider.options.ceil) {
                    _this.slider.value = _this.slider.options.ceil;
                    _this.isPlaying = false; // If we are in the last frame, stop "playing"
                    $interval.cancel(_this.promise); // If we are in the last frame, stop the $interval
                } else {
                    _this.slider.value += 1;
                }
            }

            // Increases the frame of the timeline by frameJumpNumber
            _this.nextFrame = function() {
                if ($scope.toolsManager.blockChanges) {
                    $scope.messagesManager.sendMessage("warning", "You can't change the frame while editing an object.");
                    return;
                };

                if (_this.slider.value + _this.frameJumpNumber > _this.slider.options.ceil) {
                    _this.slider.value = _this.slider.options.ceil;
                    _this.isPlaying = false; // If we are in the last frame, stop "playing"
                    $interval.cancel(_this.promise); // If we are in the last frame, stop the $interval
                } else {
                    _this.slider.value += _this.frameJumpNumber;
                    $scope.optionsManager.replicateOptionChanged();
                }
            }

            // Decreases the frame of the timeline by 1
            _this.previousFrame = function() {
                if ($scope.toolsManager.blockChanges) {
                    $scope.messagesManager.sendMessage("warning", "You can't change the frame while editing an object.");
                    return;
                };

                if (_this.slider.value - _this.frameJumpNumber < _this.slider.options.floor) {
                    _this.slider.value = _this.slider.options.floor;
                } else {
                    _this.slider.value -= _this.frameJumpNumber;
                    $scope.optionsManager.replicateOptionChanged();
                }
            }  

            // Controls the play/Pause button
            _this.switchPlay = function() {
                if ($scope.toolsManager.blockChanges) {
                    $scope.messagesManager.sendMessage("warning", "You can't change the frame while editing an object.");
                    return;
                };
                
                _this.isPlaying = !_this.isPlaying;

                if (_this.isPlaying == true) {
                    _this.promise = $interval(_this.nextFrameAlwaysOne, 500);
                } else {
                    $interval.cancel(_this.promise);
                }
            }
        }

        function CamerasManager() {
            // VARIABLES //
            var _this = this;

            _this.camerasPanelOpened = false;
            _this.loadedCamerasNames = [];
            _this.loadedCameras = [];   
            /* Structure:
            *    loadedCameras:
            *        cameraX:
            *            arrayOfFrames: []
            *                  image: image
            */

           _this.numberOfCamerasToLoad = 0;
           _this.numberOfLoadedCameras = 0;

            // FUNCTIONS //
            // Opens and closes the cameras panel
            _this.toggleCamerasPanel = function() {
                if ($scope.toolsManager.blockChanges) {
                    $scope.messagesManager.sendMessage("warning", "You can't change the cameras while editing an object.");
                    return;
                };

                _this.camerasPanelOpened = !_this.camerasPanelOpened;

                var camerasPanel = document.getElementById("CamerasPanel");
                if (_this.camerasPanelOpened == false) {
                    camerasPanel.classList.remove("panel-cameras-visible");
                } else {
                    camerasPanel.classList.add("panel-cameras-visible");
                }
            }

            // Opens the dialog in charge of adding a new camera
            _this.addCamera = function() {
                $mdDialog.show({
                    templateUrl: '/static/views/dialogs/addNewCameraDialog.html',
                    controller: 'dialogAddNewCameraCtrl',
                    escapeToClose: false,
                    locals: {
                        loadedCameras: _this.loadedCamerasNames
                    }
                }).then(function(successData) {
                    $scope.loadingScreenManager.setLoadingScreen();
                    if ($scope.toolParameters.isPosetrack) {
                        successData = { videos: [successData.videos] }
                    }

                    // Set the variables to control the end
                    _this.numberOfCamerasToLoad = successData.videos.length;
                    _this.numberOfLoadedCameras = 0;

                    _this.createCameras(successData);
                    _this.fillCameras(successData);
                });
            }

              // Function that creates the camera objects
            _this.createCameras = function(cameraNames) {
                for (var i = 0; i < cameraNames.videos.length; i++) {
                    _this.loadedCameras.push({
                        filename: cameraNames.videos[i],
                        frames: [],
                    })
                    _this.loadedCamerasNames.push(cameraNames.videos[i])

                    // Store the name in the navBar struct
                    navSrvc.addLoadedCamera(cameraNames.videos[i]);

                    // If its the first camera, store also the maxFrame
                    if (navSrvc.isMaxFramePlaced() == false) {
                        navSrvc.setMaxFrame($scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, cameraNames.videos[i]);
                    }

                    // If its the first camera, store also the minFrame
                    if (navSrvc.isMinFramePlaced() == false) {
                        navSrvc.setMinFrame($scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, cameraNames.videos[i]);
                    }

                    // Call to obtain the frames to annotate (for AIK it does nothing)
                    $scope.commonManager.getVideoFramesToAnnotate(cameraNames.videos[i]);

                    // Push empty frame spaces
                    for (var j = 0; j < $scope.toolParameters.numberOfFrames; j++) {
                        _this.loadedCameras[i].frames.push({})
                    }
                }
            }

            // Fills the cameras as needed
            _this.fillCameras = function(cameraNames) {
                var callback = function(response) {
                    for (var i = 0; i < response.length; i++) {
                        var video = response[i].video;
                        var image = response[i].image;
                        var frame = response[i].frame;
                        
                        // First search for the camera in the loadedCameras panel
                        for (var j = 0; j < _this.loadedCameras.length; j++) {
                            if (_this.loadedCameras[j].filename.localeCompare(video) === 0) { // Find the camera
                                _this.loadedCameras[j].frames[frame - $scope.toolParameters.frameFrom] = {
                                    number: frame,
                                    image: image,
                                }
                            }
                        }

                        // In case we couldn't find the camera in the loadedCameras panel, we seach for it in the canvases
                        for (var j = 0; j < $scope.canvasesManager.numberOfCanvases; j++) {
                            if ($scope.canvasesManager.canvases[j].hasActiveCamera()) {
                                if ($scope.canvasesManager.canvases[j].activeCamera.filename.localeCompare(video) === 0) {
                                    $scope.canvasesManager.canvases[j].activeCamera.frames[frame - $scope.toolParameters.frameFrom] = {
                                        number: frame,
                                        image: image,
                                    }
                                    $scope.canvasesManager.canvases[j].createImage(frame - $scope.toolParameters.frameFrom);
                                }
                            }
                        }
                    }

                    _this.numberOfLoadedCameras++;
                    
                    // After all frames have loaded, call retrieve objects in PT
                    if ($scope.toolParameters.isPosetrack) {
                        $scope.canvasesManager.moveToCanvas(_this.loadedCameras[0], 1);
                        $scope.loadingScreenManager.closeLoadingScreen();
                        $scope.commonManager.retrieveObjects();
                                              
                    } else { // If we are not in PT and we are finished, we can dismiss de dialog
                        if (_this.numberOfLoadedCameras >= _this.numberOfCamerasToLoad) {
                            // Set redraw to draw the selected object
                            $scope.loadingScreenManager.closeLoadingScreen();
                            
                            $scope.canvasesManager.redrawCanvases();
                        }
                    }
                };

                for (var i = 0; i < cameraNames.videos.length; i++) {
                    toolSrvc.getFrames(cameraNames.videos[i], $scope.toolParameters.frameFrom, $scope.toolParameters.frameTo, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, callback, $scope.messagesManager.sendMessage);
                }
            }
            
        }

        function ToolParametersManager(stateParams) {
            var _this = this;

            // VARIABLES //
            _this.frameFrom = stateParams.obj.from;
            _this.frameTo = stateParams.obj.to;
            _this.numberOfFrames = _this.frameTo - _this.frameFrom;
            _this.maxVideoFrame = 0;
            _this.frameList = [];
            _this.fromTaskHome = stateParams.obj.fromTaskHome;
            _this.showObjectTypeAlert = false;
            if (!_this.fromTaskHome) _this.showObjectTypeAlert = true;
            _this.activeDataset = navSrvc.getActiveDataset(); // Get the active dataset information
            _this.isPosetrack = navSrvc.isPosetrack();
            _this.user = navSrvc.getUser();
            _this.interpolationRange = 20;

            // FUNCTIONS //
            // Convert the interval of frames in a list of friends
            _this.getListOfFrameNumbers = function() {
                var frames = [];
                for (var i = _this.frameFrom; i <= _this.frameTo; i++) {
                    frames.push(i);
                }
                _this.frameList = frames;
            }
            
            // Gets the maximum frame of the video
            _this.setMaxVideoFrame = function(frame) {
                _this.maxVideoFrame = frame;
            }

            // Closes the alert to select an object type again
            _this.closeObjectTypeAlert = function() {
                _this.showObjectTypeAlert = false;
            }

            // Check where do we come from to load pre-loaded cameras if needed
            _this.checkWhereAreWeComingFrom = function() {
                if (!_this.fromTaskHome) {
                    // Add the previous options
                    $scope.optionsManager.options = $stateParams.obj.options;

                    // Load cameras
                    var camerasToLoad = { videos: [] };
                    var canvasCameras = $stateParams.obj.canvasCameras;
                    var originalRange = $stateParams.obj.originalRange;
                
                    // First create the array with all the camera names
                    for (var i = 0; i < $stateParams.obj.loadedCameras.length; i++) {
                        if ($stateParams.obj.loadedCameras[i].localeCompare("") != 0) { // If there is a camera there
                            camerasToLoad.videos.push($stateParams.obj.loadedCameras[i]);
                        }
                    }

                    for (var i = 0; i < $scope.canvasesManager.canvases.length; i++) {
                        if (canvasCameras[i].localeCompare("") != 0) { // If there is a camera there
                            camerasToLoad.videos.push(canvasCameras[i]);
                        }
                    }

                    // Reset sessionData of the cameras
                    navSrvc.resetSessionData();

                    // Update the navbar options in case we advance again
                    $scope.optionsManager.optionChanged();  

                    // Create the cameras
                    $scope.camerasManager.createCameras(camerasToLoad);

                    // Fill the ranges again
                    navSrvc.setFrameStart(_this.frameFrom);
                    navSrvc.setFrameEnd(_this.frameTo);
                    navSrvc.setFrameRange(originalRange);

                    // // Place the selected type
                    // if ($stateParams.obj.selectedType !== undefined && $stateParams.obj.selectedType.localeCompare("") !== 0 && !$scope.toolParameters.fromTaskHome) {
                    //     $scope.objectManager.selectedType = $scope.objectManager.objectTypes[$stateParams.obj.selectedType];
                    //     //$scope.objectManager.changeSelectedType($stateParams.obj.selectedType);
                    // } 

                    if (!_this.isPosetrack) {   // If its posetrack we dont need to do this since the createCamera will place it automatically
                        // Place cameras in canvases if needed
                        for (var i = 0; i < $scope.canvasesManager.canvases.length; i++) {
                            if (canvasCameras[i].localeCompare("") != 0) { // If there is a camera there
                                for (var j = 0; j < $scope.camerasManager.loadedCameras.length; j++) {
                                    if (canvasCameras[i].localeCompare($scope.camerasManager.loadedCameras[j].filename) == 0) {
                                        $scope.canvasesManager.moveToCanvas($scope.camerasManager.loadedCameras[j], i + 1);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    
                    $scope.camerasManager.numberOfLoadedCameras = 0;
                    $scope.camerasManager.numberOfCamerasToLoad = camerasToLoad.videos.length;

                    // Fill all cameras
                    $scope.camerasManager.fillCameras(camerasToLoad);
                } else {
                    if (_this.isPosetrack) $scope.camerasManager.addCamera();
                }
            }
        }

        function LoadingScreenManager() {
            var _this = this;
            // VARIABLES //
            _this.loading = false;
            _this.loadingCounter = 0;

            // FUNCTIONS //
            // Sets the loading screen
            _this.setLoadingScreen = function() {
                _this.loading = true;
                _this.loadingCounter++;
            }

            // Unsets the loading screen
            _this.closeLoadingScreen = function() {
                _this.loadingCounter--;
                if (_this.loadingCounter <= 0) _this.loading = false;
            }
        }

        function MessagesManager() {
            var _this = this;

            // FUNCTIONS //
            _this.sendMessage = function(type, msg) {
                $rootScope.$broadcast('sendMsg', { 'type': type, 'msg': msg });
            };
        }

        function CanvasesManager() {
            var _this = this;

            // VARIABLES // 
            _this.numberOfCanvases = 4;
            _this.tempCameraStorage = [null, null, null, null];
            _this.canvases = [];
            _this.canvasesColors = ["#FF2D26", "#5673E8", "#A66BFF", "#51FF2D"];
            _this.canvasMouseOver = 0;

            // FUNCTIONS //
            // Moves the video "video" to the canvas specified by "number"
            _this.moveToCanvas = function(video, number) {
                _this.canvases[number - 1].setCamera(video); // Set the camera
                _this.redrawCanvases();
    
                // Updatethe navBar struct
                navSrvc.setCanvasCamera(video.filename, number);
    
                // When the video is set in a canvas, remove it from the array of loadedCameras
                for (var i = 0; i < $scope.camerasManager.loadedCameras.length; i++) {
                    if ($scope.camerasManager.loadedCameras[i].filename.localeCompare(video.filename) == 0) {
                        $scope.camerasManager.loadedCameras.splice(i, 1);
                        break;
                    }
                }
            }

            _this.removeCameraFromCanvas = function(number) {
                _this.canvases[number -1].removeCamera();
            }

            // Auxiliar function to swith between number of canvases
            _this.cleanCanvasContainerElement = function() {
                var canvasContainer = document.getElementById("canvas-container");
                while (canvasContainer.firstChild) {
                    canvasContainer.removeChild(canvasContainer.firstChild);
                }
            }

            // Function to set the new canvas distribution reconstructing HTML
            _this.setCanvasDistribution = function(numCanvases) {
                var canvasContainer = document.getElementById("canvas-container");
                switch (numCanvases) {
                    case 1:
                        var row = document.createElement("div");
                        row.classList.add('row');
                        row.setAttribute('style', 'height: 100%');
                        var colOffset1 = document.createElement("div");
                        var colOffset2 = document.createElement("div");
                        colOffset1.classList.add("col-md-1");
                        colOffset2.classList.add("col-md-1");
                        colOffset1.setAttribute('style', 'height: 100%');
                        colOffset2.setAttribute('style', 'height: 100%');
                        var col = document.createElement("div");
                        col.classList.add("col-md-10");
                        col.setAttribute('style', 'height: 100%');
                        var canvasE1 = document.createElement("canvas");
                        canvasE1.classList.add("playable-canvas");
                        canvasE1.setAttribute("id", "canvas1");
                        canvasE1.setAttribute("style", "border:1px solid" + _this.canvasesColors[0] + ";");
                        col.appendChild(canvasE1);
                        row.appendChild(colOffset1);
                        row.appendChild(col);
                        row.appendChild(colOffset2);
                        canvasContainer.appendChild(row)
                        break;
                    case 2:
                        var row1 = document.createElement("div");
                        row1.classList.add('row');
                        row1.setAttribute('style', 'height: 50%');
                        var row2 = document.createElement("div");
                        row2.classList.add('row');
                        row2.setAttribute('style', 'height: 50%');
                        var colOffset1 = document.createElement("div");
                        var colOffset2 = document.createElement("div");
                        colOffset1.classList.add("col-md-3");
                        colOffset2.classList.add("col-md-3");
                        colOffset1.setAttribute('style', 'height: 100%');
                        colOffset2.setAttribute('style', 'height: 100%');
                        var colOffset3 = document.createElement("div");
                        var colOffset4 = document.createElement("div");
                        colOffset3.classList.add("col-md-3");
                        colOffset4.classList.add("col-md-3");
                        colOffset3.setAttribute('style', 'height: 100%');
                        colOffset4.setAttribute('style', 'height: 100%');
                        var col1 = document.createElement("div");
                        col1.classList.add("col-md-6");
                        col1.setAttribute('style', 'height: 100%');
                        var col2 = document.createElement("div");
                        col2.classList.add("col-md-6");
                        col2.setAttribute('style', 'height: 100%');
                        var canvasE1 = document.createElement("canvas");
                        canvasE1.classList.add("playable-canvas");
                        canvasE1.setAttribute("id", "canvas1");
                        canvasE1.setAttribute("style", "border:1px solid" + _this.canvasesColors[0] + ";");
                        var canvasE2 = document.createElement("canvas");
                        canvasE2.classList.add("playable-canvas");
                        canvasE2.setAttribute("id", "canvas2");
                        canvasE2.setAttribute("style", "border:1px solid" + _this.canvasesColors[1] + ";");
                        col1.appendChild(canvasE1);
                        col2.appendChild(canvasE2);
                        row1.appendChild(colOffset1);
                        row1.appendChild(col1);
                        row1.appendChild(colOffset2);
                        row2.appendChild(colOffset3);
                        row2.appendChild(col2);
                        row2.appendChild(colOffset4);
                        canvasContainer.appendChild(row1)
                        canvasContainer.appendChild(row2)
                        break;
                    case 3:
                        var row1 = document.createElement("div");
                        row1.classList.add('row');
                        row1.setAttribute('style', 'height: 50%');
                        var row2 = document.createElement("div");
                        row2.classList.add('row');
                        row2.setAttribute('style', 'height: 50%');
                        var colOffset1 = document.createElement("div");
                        var colOffset2 = document.createElement("div");
                        colOffset1.classList.add("col-md-3");
                        colOffset2.classList.add("col-md-3");
                        colOffset1.setAttribute('style', 'height: 100%');
                        colOffset2.setAttribute('style', 'height: 100%');
                        var col1 = document.createElement("div");
                        col1.classList.add("col-md-6");
                        col1.setAttribute('style', 'height: 100%');
                        var col2 = document.createElement("div");
                        col2.classList.add("col-md-6");
                        col2.setAttribute('style', 'height: 100%');
                        var col3 = document.createElement("div");
                        col3.classList.add("col-md-6");
                        col3.setAttribute('style', 'height: 100%');
                        var canvasE1 = document.createElement("canvas");
                        canvasE1.classList.add("playable-canvas");
                        canvasE1.setAttribute("id", "canvas1");
                        canvasE1.setAttribute("style", "border:1px solid" + _this.canvasesColors[0] + ";");
                        var canvasE2 = document.createElement("canvas");
                        canvasE2.classList.add("playable-canvas");
                        canvasE2.setAttribute("id", "canvas2");
                        canvasE2.setAttribute("style", "border:1px solid" + _this.canvasesColors[1] + ";");
                        var canvasE3 = document.createElement("canvas");
                        canvasE3.classList.add("playable-canvas");
                        canvasE3.setAttribute("id", "canvas3");
                        canvasE3.setAttribute("style", "border:1px solid" + _this.canvasesColors[2] + ";");
                        col1.appendChild(canvasE1);
                        col2.appendChild(canvasE2);
                        col3.appendChild(canvasE3);
                        row1.appendChild(col1);
                        row1.appendChild(col2);
                        row2.appendChild(colOffset1);
                        row2.appendChild(col3);
                        row2.appendChild(colOffset2);
                        canvasContainer.appendChild(row1)
                        canvasContainer.appendChild(row2)
                        break;
                    case 4:
                        var row1 = document.createElement("div");
                        row1.classList.add('row');
                        row1.setAttribute('style', 'height: 50%');
                        var row2 = document.createElement("div");
                        row2.classList.add('row');
                        row2.setAttribute('style', 'height: 50%');
                        var col1 = document.createElement("div");
                        col1.classList.add("col-md-6");
                        col1.setAttribute('style', 'height: 100%');
                        var col2 = document.createElement("div");
                        col2.classList.add("col-md-6");
                        col2.setAttribute('style', 'height: 100%');
                        var col3 = document.createElement("div");
                        col3.classList.add("col-md-6");
                        col3.setAttribute('style', 'height: 100%');
                        var col4 = document.createElement("div");
                        col4.classList.add("col-md-6");
                        col4.setAttribute('style', 'height: 100%');
                        var canvasE1 = document.createElement("canvas");
                        canvasE1.classList.add("playable-canvas");
                        canvasE1.setAttribute("id", "canvas1");
                        canvasE1.setAttribute("style", "border:1px solid" + _this.canvasesColors[0] + ";");
                        var canvasE2 = document.createElement("canvas");
                        canvasE2.classList.add("playable-canvas");
                        canvasE2.setAttribute("id", "canvas2");
                        canvasE2.setAttribute("style", "border:1px solid" + _this.canvasesColors[1] + ";");
                        var canvasE3 = document.createElement("canvas");
                        canvasE3.classList.add("playable-canvas");
                        canvasE3.setAttribute("id", "canvas3");
                        canvasE3.setAttribute("style", "border:1px solid" + _this.canvasesColors[2] + ";");
                        var canvasE4 = document.createElement("canvas");
                        canvasE4.classList.add("playable-canvas");
                        canvasE4.setAttribute("id", "canvas4");
                        canvasE4.setAttribute("style", "border:1px solid" + _this.canvasesColors[3] + ";");
                        col1.appendChild(canvasE1);
                        col2.appendChild(canvasE2);
                        col3.appendChild(canvasE3);
                        col4.appendChild(canvasE4);
                        row1.appendChild(col1);
                        row1.appendChild(col2);
                        row2.appendChild(col3);
                        row2.appendChild(col4);
                        canvasContainer.appendChild(row1)
                        canvasContainer.appendChild(row2)
                        break;
                }
            }

            _this.atLeastOneCameraPlaced = function() {
                for (var i = 0; i < _this.numberOfCanvases; i++) {
                    if (_this.canvases[i].hasActiveCamera()) return true;
                }

                return false;
            }

            // Changes the number of canvases two show in the tool
            _this.switchNumberOfCanvases = function(newNumber) {
                if (_this.numberOfCanvases == newNumber) return; // If no change, exit

                // Save all active cameras
                for (var i = 0; i < _this.numberOfCanvases; i++) {
                    if (_this.canvases[i].hasActiveCamera()) {
                        _this.tempCameraStorage[i] = _this.canvases[i].getActiveCamera();
                    }
                }

                // Clear the whole html element
                _this.cleanCanvasContainerElement();

                // Create the whole html element again
                _this.setCanvasDistribution(newNumber);

                // Update number of canvases
                _this.numberOfCanvases = newNumber;

                // Get the canvas objects again
                _this.initializeCanvases();

                // Put the cameras in the canvas where they were
                for (var i = 0; i < _this.numberOfCanvases; i++) {
                    if (_this.tempCameraStorage[i] !== null) {
                        _this.moveToCanvas(_this.tempCameraStorage[i], i + 1);
                        _this.tempCameraStorage[i] = null;
                    }
                }
                // Send the cameras without a canvas to the camera array
                for (var i = _this.numberOfCanvases; i < _this.tempCameraStorage.length; i++) {
                    if (_this.tempCameraStorage[i] !== null) {
                        $scope.camerasManager.loadedCameras.push(_this.tempCameraStorage[i]);
                        _this.tempCameraStorage[i] = null;
                    }
                }
            }

            // Initializator of canvases
            _this.initializeCanvases = function() {
                _this.canvases = []
                if (_this.numberOfCanvases >= 1) {
                    var canvas1 = document.getElementById('canvas1');
                    _this.canvases.push(new CanvasObject(canvas1, 1))
                }
                if (_this.numberOfCanvases >= 2) {
                    var canvas2 = document.getElementById('canvas2');
                    _this.canvases.push(new CanvasObject(canvas2, 2))
                }
                if (_this.numberOfCanvases >= 3) {
                    var canvas3 = document.getElementById('canvas3');
                    _this.canvases.push(new CanvasObject(canvas3, 3))
                }
                if (_this.numberOfCanvases >= 4) {
                    var canvas4 = document.getElementById('canvas4');
                    _this.canvases.push(new CanvasObject(canvas4, 4))
                }
                if ($scope.toolParameters.isPosetrack) { // If poseTrack type, only one canvas.
                    _this.switchNumberOfCanvases(1); // Change to 1 canvas
                }
            }

            // Resets all epilines to null
            _this.resetEpilines = function() {
                for (var i = 0; i < _this.canvases.length; i++) {
                    _this.canvases[i].resetEpilines();
                } 
            }

            // Sets the epiline in the correct canvas
            _this.setEpiline = function(epilinePoints, index1, index2) {
                _this.canvases[index2].setEpiline(epilinePoints.el1, epilinePoints.el2, _this.canvasesColors[index1], index1);
            }

            // Redraws all canvases
            _this.redrawCanvases = function() {
                for (var i = 0; i < _this.canvases.length; i++) {
                    _this.canvases[i].setRedraw();
                }
            }

            _this.setCanvasMouseOver = function(index) {
                _this.canvasMouseOver = index;
            }

            _this.refreshProjectionOfCanvases = function() {
                if ($scope.toolParameters.isPosetrack) {
                    if ($scope.canvasesManager.canvases[0].hasActiveCamera()) {
                        $scope.canvasesManager.canvases[0].updateObjects();
                    }
                } else {
                    for (var i = 0; i < $scope.canvasesManager.canvases.length; i++) {
                        if ($scope.canvasesManager.canvases[i].hasActiveCamera()) {
                            $scope.canvasesManager.canvases[i].projectObjects();
                        }
                    }
                }
            }

            _this.refreshProjectionOfCanvas = function(number) {
                if ($scope.canvasesManager.canvases[number].hasActiveCamera()){
                    $scope.canvasesManager.canvases[number].projectObjects();
                }
            }

            _this.refreshCanvasPointByUID = function(objectUID, objectType, frame) {
                if ($scope.objectManager.selectedObject != null) $scope.objectManager.selectedObject = $scope.objectManager.selectedType.objects[objectUID.toString()];

                $scope.canvasesManager.canvases[0].update2DObject(objectUID, objectType, frame, $scope.objectManager.objectTypes[objectType.toString()].objects[objectUID.toString()].frames[frame - $scope.toolParameters.frameFrom].keypoints);
                if ($scope.keypointEditor.editorActive) $scope.keypointEditor.openEditor($scope.objectManager.selectedObject, $scope.timelineManager.slider.value);
            }

            _this.refreshProjectionOfCanvasesByUID = function(objectUID, objectType, frameFrom, frameTo) {

                if ($scope.objectManager.selectedObject != null) $scope.objectManager.selectedObject = $scope.objectManager.selectedType.objects[objectUID.toString()];
                
                for (var i = 0; i < $scope.canvasesManager.canvases.length; i++) {
                    if ($scope.canvasesManager.canvases[i].hasActiveCamera()) {
                        $scope.canvasesManager.canvases[i].projectObject(objectUID, objectType, frameFrom, frameTo);
                    }
                }

                if ($scope.keypointEditor.editorActive) $scope.keypointEditor.openEditor($scope.objectManager.selectedObject, $scope.timelineManager.slider.value);
        
            }

            _this.projectKeypointEditorData = function(frame) {
                if ($scope.toolParameters.isPosetrack) {
                    $scope.canvasesManager.canvases[0].projectKeypointEditorData(frame);
                } else {
                    for (var i = 0; i < $scope.canvasesManager.canvases.length; i++) {
                        if ($scope.canvasesManager.canvases[i].hasActiveCamera()) {
                            $scope.canvasesManager.canvases[i].projectKeypointEditorData(frame);
                        }
                    }
                }
            }
        }

        function ObjectManager() {
            var _this = this;

            // VARIABLES //
            _this.objectTypes = {};
            _this.selectedType = {};
            _this.staticTypes = [];   // Boxes for AIK, ingore regions for PT
            _this.dynamicTypes = [];
            _this.selectedObject = null;

            // FUNCTIONS //
            // Resets the object Manager object
            _this.resetObjectManager = function() {
                _this.objectTypes = {};
                _this.selectedType = {};
                _this.staticTypes = [];
                _this.dynamicTypes = []; 
                _this.selectedObject = null;
            }

            // Function that returns true if the type is static, false if its dynamic
            _this.isStaticType = function(type) {
                return _this.staticTypes.includes(type);
            }

            // Function called everytime the selector type changes
            _this.changeSelectedType = function(type) {
                $scope.keypointEditor.closeEditor();
                
                _this.selectedType = _this.objectTypes[type];
            
                $scope.canvasesManager.refreshProjectionOfCanvases();

                $scope.actionManager.initializeActions();
                      
                $scope.canvasesManager.redrawCanvases();
                
                if (type.localeCompare("poseAIK")==0) $scope.commonManager.getPoseAIKLimbsLengthForAll();

                navSrvc.setSelectedType(type);  // Update selected type in session
            };

            // Creates a new object
            _this.createNewObject = function() {
                var callback = function(newUID, type) {
                    // Add the new object to the object Manager
                    _this.objectTypes[type.toString()].objects[newUID.toString()] = {
                        uid: newUID,
                        type: type,
                        labels: [""],
                        frames: []
                    }

                    // Fill the frames array with an empty array for each frame
                    for (var j = 0; j <= $scope.toolParameters.numberOfFrames; j++) {
                        _this.objectTypes[type.toString()].objects[newUID.toString()].frames.push({
                            frame: $scope.toolParameters.frameFrom + j,
                            annotationsExist: false,
                            keypoints: [],
                            actions: []
                        })
                    }

                    // Update the selected type in the object manager
                    _this.selectedType = _this.objectTypes[type.toString()];

                    // Refresh the projection of canvases
                    $scope.canvasesManager.refreshProjectionOfCanvases();
                }
                toolSrvc.createNewObject(navSrvc.getUser().name, $scope.toolParameters.activeDataset.name,
                    $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name,
                    _this.selectedType.type, $scope.timelineManager.slider.value, callback,
                    $scope.messagesManager.sendMessage);
            }

            // Returns "complete" if the whole object is annotated, "incomplete" if the object is not completely annotated or "empty" is the object is not annotated at all
            _this.annotationsState = function(objectUID, type, frame) {
                // If the type is poseAIK use the auxiliar method instead
                if (type.localeCompare("poseAIK") == 0) return _this.poseAIKAnnotationsState(objectUID, type, frame);

                if (type.localeCompare("boxAIK") == 0) return _this.boxAIKAnnotationsState(objectUID, type, frame);

                if (type.localeCompare("cylinderAIK") == 0) return _this.cylinderAIKAnnotationsState(objectUID, type, frame);

                if (type.localeCompare("person") == 0) return _this.personAnnotationsState(objectUID, type, frame);
                
                var existAnnotation = _this.objectTypes[type.toString()].objects[objectUID.toString()].frames[frame - $scope.toolParameters.frameFrom].annotationsExist.slice();
                var count = 0;
                for (var i = 0; i < existAnnotation.length; i++) {
                    if (existAnnotation[i]) count++;
                }

                if (count == 0) return 0;      // No annotation
                if (count == existAnnotation.length) return 1;    // All annotations
                return -1;                     // Some annotated, but not all
            }

            // Auxiliar function to take care of the state of the cylinders, for AIK. (Takes into account only the main points)
            _this.cylinderAIKAnnotationsState = function(objectUID, type, frame) {
                var mainIndices = [0, 1];  
                var existAnnotation = _this.objectTypes[type.toString()].objects[objectUID.toString()].frames[frame - $scope.toolParameters.frameFrom].annotationsExist;

                var count = 0;
                for (var i=0; i<mainIndices.length; i++) {
                    if (existAnnotation[mainIndices[i]]) count++;
                }

                if (count == 0) return 0;
                if (count == 2) return 1;
                return -1;  
            }

            // Auxiliar function to take care of the state of the boxes, for AIK. (Takes into account only the main points)
            _this.personAnnotationsState = function(objectUID, type, frame) {
                var existAnnotation = _this.objectTypes[type.toString()].objects[objectUID.toString()].frames[frame - $scope.toolParameters.frameFrom].annotationsExist;
                var keypoints = _this.objectTypes[type.toString()].objects[objectUID.toString()].frames[frame - $scope.toolParameters.frameFrom].keypoints.slice();
                var visibilities = _this.objectTypes[type.toString()].objects[objectUID.toString()].frames[frame - $scope.toolParameters.frameFrom].visibility.slice();
            
                var count = 0;
                for (var i=0; i< keypoints.length; i++) {
                    if (existAnnotation[i]) {
                        if (keypoints[i][0] < 0 && keypoints[i][1] < 0 && visibilities[i] == 0) {}
                        else count++;        
                    }
                }

                if (count == 0) return 0;
                if (count == keypoints.length) return 1;
                return -1;

            }

            // Auxiliar function to take care of the state of the boxes, for AIK. (Takes into account only the main points)
            _this.boxAIKAnnotationsState = function(objectUID, type, frame) {
                var mainIndices = [0, 1, 6];  
                var existAnnotation = _this.objectTypes[type.toString()].objects[objectUID.toString()].frames[frame - $scope.toolParameters.frameFrom].annotationsExist;

                var count = 0;
                for (var i=0; i<mainIndices.length; i++) {
                    if (existAnnotation[mainIndices[i]]) count++;
                }

                if (count == 0) return 0;
                if (count == 3) return 1;
                return -1;
            }

            _this.isTypeSelected = function(type) {
                if (!_this.selectedType.type) return false;
                if (_this.selectedType.type.localeCompare(type) === 0) return true;
                return false;
            }

            // Auxiliar function to take care of the state of the poses, for AIK. (Takes into account optional joints)
            _this.poseAIKAnnotationsState = function(objectUID, type, frame) {
                var existAnnotation = _this.objectTypes[type.toString()].objects[objectUID.toString()].frames[frame - $scope.toolParameters.frameFrom].annotationsExist;

                var count = 0;
                for (var i = 0; i <= 13; i++) {
                    if (existAnnotation[i]) count++;
                }

                if (count == 0) return 0;      // No annotation
                if (count == 14) return 1;    // All annotations
                return -1;                     // Some annotated, but not all
            }

            // Returns true if there is an annotation for the specific object for a specific label
            _this.hasAnnotationForLabel = function(objectUID, type, frame, labelIndex) {
                var existAnnotation = _this.objectTypes[type.toString()].objects[objectUID.toString()].frames[frame - $scope.toolParameters.frameFrom].annotationsExist;
                if (existAnnotation[labelIndex] === true) return true;
                else return false;
            }

            _this.hasAnnotation = function(objectUID, type, frame) {
                var state = _this.annotationsState(objectUID, type, frame);
                if (state !== 0) return true;
                return false;
            }

            _this.prepareKeypointsForFrontend = function(keypoints) {
                let prepared = JSON.parse(JSON.stringify(keypoints));
                for (let i=0; i< keypoints.length; i++) {
                    for (let j=0; j < keypoints[i].length; j++) {
                        prepared[i][j] = keypoints[i][j] / 2.0
                    }    
                }
                return prepared;
            }

            _this.prepareKeypointForFrontend = function(keypoint) {
                let prepared = keypoint.slice()
                for (let i=0; i< keypoint.length; i++) {
                    prepared[i] = keypoint[i] / 2.0
                }
                return prepared;
            }

            _this.prepareKeypointsForBackend = function(keypoints) {
                let prepared = JSON.parse(JSON.stringify(keypoints));
                for (let i=0; i< keypoints.length; i++) {
                    for (let j=0; j < keypoints[i].length; j++) {
                        prepared[i][j] = keypoints[i][j] * 2.0
                    }
                }
                return prepared;
            }

            _this.prepareKeypointForBackend = function(keypoint) {
                let prepared = keypoint.slice()
                for (let i=0; i< keypoint.length; i++) {
                    prepared[i] = keypoint[i] * 2.0
                }
                return prepared;
            }
        }

        function ActionManager() {
            var _this = this;

            // VARIABLES //
            _this.activitiesList = [];
            _this.actionsList = {};
            _this.actionsForVisualization = {};
            _this.selectedObject = null;
            _this.actionCreationData = {
                selectedType: null,
                startFrame: $scope.timelineManager.frameFrom,
                endFrame: $scope.timelineManager.frameTo
            }
    
            // FUNCTIONS //
            // Clears te data stored to create a new action
            _this.clearActionCreationData = function() {
                _this.actionCreationData.startFrame = $scope.timelineManager.frameFrom;
                _this.actionCreationData.endFrame = $scope.timelineManager.frameTo;
            }

            // Update activities list
            _this.getActivitiesList = function() {
                var callback = function(activitiesList) {
                    $scope.actionManager.activitiesList = activitiesList.activities;
                }
                toolSrvc.getActivitiesList($scope.toolParameters.activeDataset.type, callback, $scope.messagesManager.sendMessage);
            }

            // Fetch all actions of an Object from database
            _this.getActionsListByUID = function(uid) {
                var callback = function(actionsList, uid) {
                    _this.actionsList[uid] = actionsList;
                    _this.fillActionsForVisualization(uid, actionsList);
                }

                toolSrvc.getActionsByUID($scope.toolParameters.user.name, uid,
                    $scope.toolParameters.frameFrom, $scope.toolParameters.frameTo, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, callback, $scope.messagesManager.sendMessage)
            }

            _this.fillActionsForVisualization = function(uid, actionsList) {
                frameArray = []
                for (var i=0; i <= $scope.toolParameters.numberOfFrames; i++) {
                    frameArray.push([]);
                }
                _this.actionsForVisualization[uid] = angular.copy(frameArray);
                
                for (action in actionsList) {
                    var startFrame = actionsList[action].startFrame - $scope.toolParameters.frameFrom;
                    var endFrame = actionsList[action].endFrame - $scope.toolParameters.frameFrom;
                    var actionName = actionsList[action].name;
                    
                    if (startFrame < 0) startFrame = 0;
                    if (endFrame >= frameArray.length) endFrame = frameArray.length -1;

                    for (var i = startFrame; i <= endFrame; i++) {
                        _this.actionsForVisualization[uid][i].push(actionName);
                    }
                }
            }

            _this.setActionFrameFrom = function(frame) {
                _this.actionCreationData.startFrame = frame;
            }

            _this.setActionFrameTo = function(frame) {
                _this.actionCreationData.endFrame = frame;
            }

            _this.initializeActions = function() {
                var frameArray = []
                
                for (var i=0; i <= $scope.toolParameters.numberOfFrames; i++) {
                    frameArray.push([]);
                }
                // Initialize structure
                for (obj in $scope.objectManager.selectedType.objects) {
                    _this.actionsList[obj] = {}
                    _this.actionsForVisualization[obj] = angular.copy(frameArray);
                }

                // Fill the objects actions
                for (obj in _this.actionsList) {
                    _this.getActionsListByUID(obj);
                }
            }

            // Create a new action
            _this.createNewAction = function() {
                if (_this.actionCreationData.selectedType == null) {
                    $scope.messagesManager.sendMessage("warning", "Select an activity first.")
                } else if (_this.actionCreationData.startFrame > _this.actionCreationData.endFrame || _this.actionCreationData.startFrame < $scope.timelineManager.frameFrom || _this.actionCreationData.endFrame > $scope.timelineManager.frameTo ) {
                    $scope.messagesManager.sendMessage("warning", "Check starting and ending frames.")
                } else {
                    var callbackSuccess = function(data) {
                        $scope.messagesManager.sendMessage("success", "Action created!");
                        _this.getActionsListByUID(_this.selectedObject.uid)
                        $scope.canvasesManager.redrawCanvases();
                        _this.clearActionCreationData();
                    }

                    var callbackError = function() {
                        $scope.messagesManager.sendMessage("danger", "Action creation went wrong!. (Maybe the action already exists in that range)");
                    }

                    toolSrvc.createAction($scope.toolParameters.user.name, _this.actionCreationData.startFrame, _this.actionCreationData.endFrame, _this.actionCreationData.selectedType,
                        _this.selectedObject.uid, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, callbackSuccess, callbackError);
                }
            }

            // Remove an existent action
            _this.removeAction = function(action) {
                if (action.startFrame == null || action.endFrame == null) {
                    _this.actionsList[_this.selectedObject.uid].pop();
                } else {
                    var callback = function() {
                        $scope.messagesManager.sendMessage("success", "Action deleted!");
                        _this.getActionsListByUID(_this.selectedObject.uid);
                        $scope.canvasesManager.redrawCanvases();
                    }
                    toolSrvc.removeAction(action.name, action.user, action.objectUID, action.startFrame, action.endFrame, action.dataset, $scope.toolParameters.activeDataset.type,
                        callback, $scope.messagesManager.sendMessage)
                }
            };
        }

        function AIKManager() {
            var _this = this;

            // Executes the whole AIK initialization process
            _this.initialize = function() {
                $scope.loadingScreenManager.setLoadingScreen();
                _this.retrieveAvailableObjectTypes();
            }

            // STEP1: Retrieve all available object types
            _this.retrieveAvailableObjectTypes = function() {
                var callback = function(obj) {
                    $scope.objectManager.resetObjectManager();
                    for (var i = 0; i < obj.length; i++) {
                        $scope.objectManager.objectTypes[obj[i].type] = {
                            type: obj[i].type,
                            datasetType: obj[i].datasetType,
                            numKeypoints: obj[i].numKeypoints,
                            labels: obj[i].labels,
                            skeleton: obj[i].skeleton,
                            objects: {}
                        }
                        
                        // Set the type in the dynamic or static category
                        if (obj[i].type.localeCompare("boxAIK") == 0 || obj[i].type.localeCompare("cylinderAIK") == 0) {
                            $scope.objectManager.staticTypes.push(obj[i].type);
                        } else {
                            $scope.objectManager.dynamicTypes.push(obj[i].type)
                        }
                    }
                    
                    _this.retrieveObjects();
                }
                toolSrvc.retrieveAvailableObjectTypes($scope.toolParameters.activeDataset.type, callback, $scope.messagesManager.sendMessage);
            }

            // STEP2: Retrieve all available objects
            _this.retrieveObjects = function() {
                var callback = function(objects) {
                    if (objects.length <= 0) {
                        $scope.loadingScreenManager.closeLoadingScreen();
                        return
                    };
                   
                    for (obj in objects) {
                        var object = objects[obj].object;
                        var existsInit = [];

                        for (var j = 0; j < $scope.objectManager.objectTypes[object.type.toString()].labels.length; j++) {
                            existsInit.push(false);
                        }
                        
                        $scope.objectManager.objectTypes[object.type.toString()].objects[object.uid.toString()] = {
                            uid: object.uid,
                            type: object.type,
                            labels: [""],
                            frames: []
                        }

                        // If we have poses we need to store the limb lengths too
                        if (object.type.localeCompare("poseAIK") == 0) {
                            $scope.objectManager.objectTypes[object.type.toString()].objects[object.uid.toString()].limbLengths = {
                                upperArm: -1,
                                lowerArm: -1,
                                upperLeg: -1,
                                lowerLeg: -1
                            }
                        }
                        
                        // Fill the frames array with an empty array for each frame
                        for (var j = 0; j <= $scope.toolParameters.numberOfFrames; j++) {
                            $scope.objectManager.objectTypes[object.type.toString()].objects[object.uid.toString()].frames.push({
                                frame: $scope.toolParameters.frameFrom + j,
                                annotationsExist: existsInit.slice(),
                                keypoints: []
                            })
                        }
                        
                    }
                    _this.retrieveAnnotations();
                }

                toolSrvc.retrieveObjects($scope.toolParameters.activeDataset, $scope.toolParameters.activeDataset.name, $scope.toolParameters.user.name, callback, $scope.messagesManager.sendMessage);
            }

            // STEP3: Retrieve all available annotations
            _this.retrieveAnnotations = function() {
                var callback = function(annotations) {
                    if (annotations.length == 0) { // Check if we received something
                        $scope.loadingScreenManager.closeLoadingScreen();
                        $scope.canvasesManager.refreshProjectionOfCanvases();
                        return;
                    }; 
                    for (var j = 0; j < annotations.length; j++) {
                        var annotation = annotations[j];
                        
                        for (var i = 0; i < annotation.objects.length; i++) {
                           $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                            .objects[annotation.objects[i].uid.toString()].frames[annotation.frame - $scope.toolParameters.frameFrom].keypoints =
                            annotation.objects[i].keypoints.slice();
                            $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                                .objects[annotation.objects[i].uid.toString()].frames[annotation.frame - $scope.toolParameters.frameFrom].frame = annotation.frame;
                            $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                                .objects[annotation.objects[i].uid.toString()].labels = annotation.objects[i].labels ? annotation.objects[i].labels.slice() : [""];
                            for (var k = 0; k < annotation.objects[i].keypoints.length; k++) {
                                if (annotation.objects[i].keypoints[k].length != 0) {
                                    $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                                        .objects[annotation.objects[i].uid.toString()].frames[annotation.frame - $scope.toolParameters.frameFrom].annotationsExist[k] = true;
                                };
                            }         
                        }
                    }
                    
                    $scope.loadingScreenManager.closeLoadingScreen();
                    if (!$scope.toolParameters.fromTaskHome) {
                      $scope.toolParameters.checkWhereAreWeComingFrom();  
                    } else $scope.canvasesManager.refreshProjectionOfCanvases();
                }

                toolSrvc.getAnnotationsByFrameRange($scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.frameFrom, $scope.toolParameters.frameTo,
                    $scope.toolParameters.activeDataset.name, $scope.toolParameters.user.name, callback, $scope.messagesManager.sendMessage);
            }

            // Retrieves the annotations for a given UID, objectType and range of frames
            _this.retrieveAnnotation = function(objectUID, objectType, frameArray) {
                var callback = function(annotations) {
                    if (annotations.length <= 0) {
                        $scope.loadingScreenManager.closeLoadingScreen();
                        return;
                    }
   
                    for(var j= 0; j< annotations.length; j++) {
                        var frame = annotations[j].frame;
                        var objects = annotations[j].objects;
                        for (var i=0; i< objects.length; i++) {
                            $scope.objectManager.objectTypes[objects[i].type.toString()].objects[objects[i].uid.toString()].frames[frame - $scope.toolParameters.frameFrom].keypoints = objects[i].keypoints.slice();
                            $scope.objectManager.objectTypes[objects[i].type.toString()]
                                .objects[objects[i].uid.toString()].labels = objects[i].labels ? objects[i].labels.slice() : [""];
                            for (var k = 0; k < objects[i].keypoints.length; k++) {
                                if (objects[i].keypoints[k] != 0) {
                                    $scope.objectManager.objectTypes[objects[i].type.toString()]
                                        .objects[objects[i].uid.toString()].frames[frame - $scope.toolParameters.frameFrom].annotationsExist[k] = true;
                                } 
                            }
                        }
                    }

                    $scope.canvasesManager.refreshProjectionOfCanvasesByUID(objectUID, objectType, frameArray[0], frameArray[frameArray.length - 1]);

                    $scope.loadingScreenManager.closeLoadingScreen();
                }

                $scope.loadingScreenManager.setLoadingScreen();
                // Reset that object exist counter to false
                var existsInit = [];
                for (var j = 0; j < $scope.objectManager.objectTypes[objectType.toString()].labels.length; j++) {
                    existsInit.push(false);
                }
                for (var i = 0; i < frameArray.length; i++) {
                    var frame = frameArray[i];
                    $scope.objectManager.objectTypes[objectType.toString()].objects[objectUID.toString()].frames[frame - $scope.toolParameters.frameFrom].annotationsExist = existsInit.slice();
                }

                if (frameArray.length === 1) {   // If there is only one frame
                    toolSrvc.getAnnotationOfFrameByUID($scope.toolParameters.user.name,
                        $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type,
                        $scope.toolParameters.activeDataset.name, objectUID, objectType ,frameArray[0], frameArray[0],
                        callback, $scope.messagesManager.sendMessage);
                } else {
                    toolSrvc.getAnnotationOfFrameByUID($scope.toolParameters.user.name,
                        $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type,
                        $scope.toolParameters.activeDataset.name, objectUID, objectType ,frameArray[0],
                        frameArray[frameArray.length - 1],
                        callback, $scope.messagesManager.sendMessage);
                }
            }

            // This is here because PT has it, but it does nothing for AIK
            _this.getVideoFramesToAnnotate = function(video) {}
            
            _this.getPoseAIKLimbsLengthForAll = function() {
                var objects = $scope.objectManager.objectTypes["poseAIK"].objects;
                
                for (obj in objects) {
                    _this.getPoseAIKLimbsLengthForUID(objects[obj].uid);
                }

            }

            _this.getPoseAIKLimbsLengthForUID = function(uid) {
                var callbackSuccess = function(msg, uid) {
                    var limbs = [msg.upperArmLength, msg.lowerArmLength, msg.upperLegLength, msg.lowerLegLength]
                    $scope.objectManager.objectTypes["poseAIK"].objects[uid.toString()].limbLengths = {
                        upperArm: limbs[0],
                        lowerArm: limbs[1],
                        upperLeg: limbs[2],
                        lowerLeg: limbs[3]
                    };
                }
                toolSrvc.getPoseAIKLimbsLength($scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, $scope.objectManager.selectedType.type, uid, callbackSuccess, $scope.messagesManager.sendMessage);
            }

            _this.updatePoseAIKLimbsLengthForUID = function(limbs) {
                for(var i=0; i<limbs.length; i++) {
                    if (limbs[i] == 0) {
                        $scope.messagesManager.sendMessage("danger", "Limb length can't be 0!");
                        return;
                    }
                }
                toolSrvc.updatePoseAIKLimbsLength($scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, $scope.objectManager.selectedObject.type, $scope.objectManager.selectedObject.uid, limbs, $scope.messagesManager.sendMessage, $scope.messagesManager.sendMessage);
            }

            _this.forcePoseAIKLimbLength = function(startLabels, endLabels, limbLength) {
                var callbackSuccess = function(uid, type, frame) {
                    $scope.messagesManager.sendMessage("success", "Limb length forced!");
                    _this.retrieveAnnotation(uid, type, [frame]);   // Retrieve the new annotated object
                }

                if (limbLength <= 0) {
                    $scope.messagesManager.sendMessage("danger", "Limb length must be greater than 0!");
                    return;
                } else {
                    toolSrvc.forcePoseAIKLimbLength($scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, $scope.toolParameters.user.name,$scope.objectManager.selectedObject.type, $scope.objectManager.selectedObject.uid, $scope.timelineManager.slider.value, startLabels, endLabels, limbLength, callbackSuccess, $scope.messagesManager.sendMessage)
                }
            }

            _this.forcePoseAIKLimbLengthsForRange = function(object) {
                var callbackSuccess = function(uid, objectType, startFrame, endFrame) {
                    $scope.messagesManager.sendMessage("success", "Limb length forced for the whole range!");
                    frameArray = []
                    for (var i=startFrame; i <= endFrame; i++) {
                        frameArray.push(i)
                    }
                    _this.retrieveAnnotation(uid, objectType, frameArray);
                }
                

                toolSrvc.forcePoseAIKLimbLengthForRange($scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, $scope.toolParameters.user.name, object.type, object.uid, $scope.toolParameters.frameFrom, $scope.toolParameters.frameTo, callbackSuccess, $scope.messagesManager.sendMessage)
            }

            // Interpolate in AIK
            _this.interpolate = function (objectUID, objectType, frameTo) {
                var callbackSuccess = function(objectUID, objectType, framesFrom, frameTo) {
                    // First remove -1 values from the frame array
                    var framesFromFiltered = framesFrom.filter(function(value, index, arr) {
                        return value >= 0;
                    })

                    // Get the min used frame
                    var minFrame = Math.min(...framesFromFiltered);

                    var frameArray = [];
                    for (var i = minFrame; i <= frameTo; i++) frameArray.push(i);
                    _this.retrieveAnnotation(objectUID, objectType, frameArray);
                }

                if (frameTo == $scope.toolParameters.frameFrom) return; // Nothing to interpolate

                // Create structure for the object to interpolate
                var framesFrom = []
                for (var i=0; i<$scope.objectManager.selectedType.labels.length; i++) {
                    framesFrom.push(-1);
                }

                // For each label find a possible frame to interpolate
                for (var i=0; i<framesFrom.length; i++) {
                    for (var j= frameTo - 1; j>=Math.max($scope.toolParameters.frameFrom, frameTo - $scope.toolParameters.interpolationRange); j--) {
                        if ($scope.objectManager.hasAnnotationForLabel(objectUID, objectType, j, i)) {
                            framesFrom[i] = j;
                            break;
                        }
                    }
                }

                // Check if there is something to interpolate
                var doit = false;   
                for (var i=0; i < framesFrom.length; i++) {
                    if (framesFrom[i] != -1) {
                        doit = true;
                        break;
                    }
                }

                if (doit) {
                    toolSrvc.interpolate($scope.toolParameters.user.name, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, framesFrom, frameTo, objectUID, objectType, objectUID, callbackSuccess, $scope.messagesManager.sendMessage);
                } else {
                    _this.retrieveAnnotation(objectUID, objectType, [frameTo])
                }
            }

            _this.autoCompleteWholeAnnotation = function() {
                var callbackSuccess = function(objectUID, objectType, framesFrom, frameTo) {
                    // First remove -1 values from the frame array
                    var framesFromFiltered = framesFrom.filter(function(value, index, arr) {
                        return value >= 0;
                    })

                    // Get the min used frame
                    var minFrame = Math.min(...framesFromFiltered);

                    var frameArray = [];
                    for (var i = minFrame; i <= frameTo; i++) frameArray.push(i);
                    _this.retrieveAnnotation(objectUID, objectType, frameArray);
                }

                var objectUID = $scope.objectManager.selectedObject.uid;
                var objectType = $scope.objectManager.selectedType.type;
                var frameTo = $scope.timelineManager.slider.value;

                // Create structure for the object to interpolate
                var framesFrom = []
                for (var i=0; i<$scope.objectManager.selectedType.labels.length; i++) {
                    framesFrom.push(-1);
                }
                
                var frameFound = -1;
                // Find the closest previous annotated frame

                
                for (var j= frameTo; j>=Math.max($scope.toolParameters.frameFrom, frameTo - $scope.toolParameters.interpolationRange); j--) {
                    if ($scope.objectManager.hasAnnotation(objectUID, objectType, j)) {
                        frameFound = j;
                        break;
                    }
                }
                
                if (frameFound == -1) {
                    $scope.messagesManager.sendMessage("alert", "No frame available for replicating was found!")
                    return
                } 

                // Set found frame to all labels
                for (var i=0; i< framesFrom.length; i++) {
                    framesFrom[i] = frameFound; 
                }
                
                toolSrvc.autoComplete($scope.toolParameters.user.name, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, framesFrom, frameTo, objectUID,objectType, objectUID, callbackSuccess, $scope.messagesManager.sendMessage);
            }

            // Autocompletes the annotation from previous annotations
            _this.autoCompleteEachTag = function() {
                var callbackSuccess = function(objectUID, objectType, framesFrom, frameTo) {
                    // First remove -1 values from the frame array
                    var framesFromFiltered = framesFrom.filter(function(value, index, arr) {
                        return value >= 0;
                    })

                    // Get the min used frame
                    var minFrame = Math.min(...framesFromFiltered);

                    var frameArray = [];
                    for (var i = minFrame; i <= frameTo; i++) frameArray.push(i);
                    _this.retrieveAnnotation(objectUID, objectType, frameArray);
                }

                var objectUID = $scope.objectManager.selectedObject.uid;
                var objectType = $scope.objectManager.selectedType.type;
                var frameTo = $scope.timelineManager.slider.value;

                // Create structure for the object to interpolate
                var framesFrom = []
                for (var i=0; i<$scope.objectManager.selectedType.labels.length; i++) {
                    framesFrom.push(-1);
                }

                // For each label find a possible frame to autocomplete
                for (var i=0; i<framesFrom.length; i++) {
                    for (var j= frameTo; j>=Math.max($scope.toolParameters.frameFrom, frameTo - $scope.toolParameters.interpolationRange); j--) {
                        if ($scope.objectManager.hasAnnotationForLabel(objectUID, objectType, j, i)) {
                            framesFrom[i] = j;
                            break;
                        }
                    }
                }

                if (framesFrom.length === 0) return; // Nothing found to autocomplete

                toolSrvc.autoComplete($scope.toolParameters.user.name, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, framesFrom, frameTo, objectUID,objectType, objectUID, callbackSuccess, $scope.messagesManager.sendMessage);
            }
            
            // Extends the box object to the ground, so that the 4 floor points have (z=0)
            _this.extendBoxToGround = function(objectUID, objectType, frame) {
                var callbackSuccess = function(uid, type, frame) {
                    _this.retrieveAnnotation(uid, type, [frame]);

                    if ($scope.optionsManager.replicateOptions.replicateToTheMaxFrame) {
                        _this.replicateStaticObject(uid, type, frame, $scope.toolParameters.maxVideoFrame);
                    } 
                }                
                toolSrvc.extendBoxToGround($scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, $scope.toolParameters.user.name, objectType, objectUID, frame, callbackSuccess, $scope.messagesManager.sendMessage)
            }

            // Replicates the current annotation to all posterior frames in the active range
            _this.replicate = function(uid, type, frame) {
                var callbackSuccess = function(objectUID, objectType, startFrame, endFrame) {
                    var frameArray = [];
                    for (var i = startFrame; i <= endFrame; i++) frameArray.push(i);
                    _this.retrieveAnnotation(objectUID, objectType, frameArray);
                }

                toolSrvc.replicate($scope.toolParameters.user.name, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, frame, $scope.toolParameters.frameTo, uid, type,
                    callbackSuccess, $scope.messagesManager.sendMessage);
            }

            _this.replicateStaticObject = function(uid, type, frame, frameTo) {
                var callbackSuccess = function(objectUID, objectType, startFrame, endFrame) {
                    var frameArray = [];
                    if (endFrame > $scope.toolParameters.frameTo) endFrame = $scope.toolParameters.frameTo;
                    for (var i = startFrame; i <= $scope.toolParameters.frameTo; i++) frameArray.push(i);
                    _this.retrieveAnnotation(objectUID, objectType, frameArray);
                }
                toolSrvc.replicateStaticObject($scope.toolParameters.user.name, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, frame, frameTo, $scope.toolParameters.maxVideoFrame ,uid, type,
                    callbackSuccess, $scope.messagesManager.sendMessage);
            }

            // Updates the annotation being edited
            _this.updateAnnotation = function() {
                var callbackSuccess = function(uid, type, frame) {
                    $scope.toolsManager.switchSubTool("");
                    $scope.canvasesManager.resetEpilines();
                    $scope.messagesManager.sendMessage("success", "Annotation updated!");
                    _this.retrieveAnnotation(uid, type, [frame]);   // Retrieve the new annotated object

                    if ($scope.objectManager.isStaticType(type)) {
                        if ($scope.optionsManager.replicateOptions.replicateToTheMaxFrame) {
                            _this.replicateStaticObject(uid, type, frame, $scope.toolParameters.maxVideoFrame);
                        } 
                    } else {
                        if ($scope.optionsManager.options.autoInterpolate) {
                            _this.interpolate(uid, type, frame);
                        }
                    }
                }

                var pointStructure = {
                    points: [[],[],[],[]],
                    cameras: ["", "", "", ""]
                }

                var objects = {
                    uid: $scope.objectManager.selectedObject.uid,
                    type: $scope.objectManager.selectedObject.type,
                    labels: $scope.keypointEditor.keypointEditorData.annotationLabels.slice(),
                    keypoints: []
                }

                // Append as many keypoints structures as labels the object has
                for (var i = 0; i < $scope.keypointEditor.keypointEditorData.realLabels.length; i++) {
                    objects.keypoints.push(JSON.parse(JSON.stringify(pointStructure)));
                }

            
                // For each canvas and for each label, fill the data
                for (var i = 0; i < $scope.keypointEditor.keypointEditorData.shapes.length; i++) {
                    if ($scope.keypointEditor.keypointEditorData.shapes[i] !== null){
                        var points = $scope.keypointEditor.keypointEditorData.shapes[i].points;
                        var cameraPoints = $scope.keypointEditor.keypointEditorData.shapes[i].cameraPoints;

                        for (var j = 0; j < $scope.keypointEditor.keypointEditorData.realLabels.length; j++) {
                            if (points[j] !== null) {
                                objects.keypoints[j].points[i] =  $scope.objectManager.prepareKeypointForBackend(cameraPoints[j]);
                                objects.keypoints[j].cameras[i] = $scope.canvasesManager.canvases[i].activeCamera.filename;
                            }
                        }
                    }
                }

                // Check if the object is valid
                for (var i = 0; i < objects.keypoints.length; i++) {
                    var count = 0;

                    for (var j = 0; j < objects.keypoints[i].points.length; j++) {
                        if (objects.keypoints[i].points[j].length > 0) {
                            count++;
                        }
                    }
                    if (count < 2 && count != 0) {
                        $scope.messagesManager.sendMessage("warning", "The label '" + $scope.keypointEditor.keypointEditorData.realLabels[i] + "' needs to have 0 or at least 2 points placed.");
                        return;
                    }
                }

                // If we get here, update the object
                toolSrvc.updateAnnotation($scope.toolParameters.user.name, $scope.toolParameters.activeDataset, $scope.toolParameters.activeDataset.name, $scope.timelineManager.slider.value, objects, callbackSuccess, $scope.messagesManager.sendMessage);

            }

            // Opens the dialog for batch-deleting points
            _this.openBatchDelete = function(object) {
                $mdDialog.show({
                    templateUrl: '/static/views/dialogs/batchDeleteDialog.html',
                    controller: 'batchDeleteCtrl',
                    escapeToClose: false,
                    locals: {
                        toolSrvc: toolSrvc,
                        object: object,
                        objectType: $scope.objectManager.selectedType,
                        minFrame: $scope.toolParameters.frameFrom,
                        maxFrame: $scope.toolParameters.frameTo,
                        dataset: $scope.toolParameters.activeDataset,
                        scene: $scope.toolParameters.activeDataset.name, 
                        username: $scope.toolParameters.user.name
                    }
                }).then(function(data) { // When finished, update the frames
                    if (data.msg.localeCompare("success") == 0) {
                        $scope.messagesManager.sendMessage("success", "Annotations deleted!")
                        var frameArray = [];
                        for (let i = data.deleteFrom; i <= data.deleteTo; i++) {
                            frameArray.push(i);
                        }

                        _this.retrieveAnnotation(data.object.uid, data.object.type, frameArray);
                        
                    } else if (data.msg.localeCompare("error") == 0) {
                        $scope.messagesManager.sendMessage("warning", "Something went wrong")
                    }
                }) 
            }

            // Transfer object
            _this.openTransferObject = function(object) {
                $mdDialog.show({
                    templateUrl: '/static/views/dialogs/transferObjectDialog.html',
                    controller: 'transferObjectCtrl',
                    escapeToClose: false,
                    locals: {
                        toolSrvc: toolSrvc,
                        object: object,
                        objectType: $scope.objectManager.selectedType,
                        objects: $scope.objectManager.selectedType.objects,
                        minFrame: $scope.toolParameters.frameFrom,
                        maxFrame: $scope.toolParameters.frameTo,
                        dataset: $scope.toolParameters.activeDataset,
                        scene: $scope.toolParameters.activeDataset.name,
                        username: $scope.toolParameters.user.name
                    }
                }).then(function(data) { // When finished, update the frames
                    if (data.msg.localeCompare("success") === 0) {
                        $scope.messagesManager.sendMessage("success", data.successMsg)
                        var frameArray = [];
                        for (let i = data.deleteFrom; i <= data.deleteTo; i++) {
                            frameArray.push(i);
                        }

                        _this.retrieveAnnotation(data.object.uid, data.object.type, frameArray);
                        _this.retrieveAnnotation(data.newObjectUid, data.object.type, frameArray);

                    } else if (data.msg.localeCompare("error") === 0) {
                        $scope.messagesManager.sendMessage("warning", data.errorMsg)
                    }
                })
            }

            // Deletes the actual object in the actual frame
            _this.deleteAnnotation = function() {
                var successFunction = function() {
                    $scope.messagesManager.sendMessage("success", "Annotation deleted!")
                    let object = $scope.objectManager.selectedObject;
                    _this.retrieveAnnotation(object.uid, object.type, [$scope.timelineManager.slider.value]);
                }
                toolSrvc.batchDeleteAnnotations($scope.toolParameters.activeDataset.name,
                    $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name,
                    $scope.timelineManager.slider.value, $scope.timelineManager.slider.value,
                    $scope.toolParameters.user.name, $scope.objectManager.selectedObject.uid,
                    $scope.objectManager.selectedObject.type, successFunction, $scope.messagesManager.sendMessage);
            }
        }

        function PTManager() {
            var _this = this;

            _this.videoFramesToAnnotate = []

            _this.resizedVideos=["007467","014335","002786","015537","008884","013924","024817","024788","015306","014663","021139","000048","003730","014235",
                                 "020868","012746","007536","000866","013523","013519","009993","014334","002839","016442","024722","023416","013952","017184",
                                 "018651","008835","016501","013908","002357","013560","008880","022948","015822","014665","020928","020573","007876","016461",
                                 "016464","024606","000220","017132","024478","020487","022661","004334","023500","010177","014076","024608","017165","015763",
                                 "012788","016706","013790","014873","012732","020924","000385","015893","014342","018647","008796","013741","024699","008820",
                                 "017563","012002","022912","008976","014288","024646","008731","005847","009288","013045","012022","024171","000352","017169",
                                 "009495","024636","020872","024629","011329","009499","024180","020942","000502","009599","017161","023219","009447","009538",
                                 "014506","016330","012056","000985","023699","024570","016170","022669","009533","023422","016254","020008","020385","022874",
                                 "000271","005173","005231","000096","016496","020512","010608","023813","012268","016465","013197","000223","022124","005728",
                                 "015528","008834","014265","022957","024344","022910","001491","024704","008833","014054","014553","018650","001153","014200",
                                 "010111","009043","007875","000017","007389","016571","009558","000520","000029","001687","013965","015283","014375","015314",
                                 "022683","009654","002258","007380","012790","015406","015293","017594","016172","001152","017180","018146","013948","011999",
                                 "008812","012954","013795","015773","022663","007855","014266","013252","010008","001341","012155","017021","021133","015025",
                                 "018993","022432","013967","014551","008877","013526","010197","008912","012218","014322","014764","013201","023493","017102",
                                 "017127","015311","024131","024110","002260","000275","000015","008664","014055","014178","000026","012507","022682","014402",
                                 "012020","004325","008660","000023","010009","018390","001243","000027","013564","013512","021524","017176","014231","016215",
                                 "017635","015882","008842","021073","008616","024553","008968","017050","014081","014695","023772","023882","016595","017155",
                                 "013003","009286","024169","016166","024712","020182","017121","024805","010007","009505","015891","024631","023716","023501",
                                 "010003","023977","014794","005389","013182","013268","015309","009012","002234","014747","009054","013515","013517","009559",
                                 "016861","024630","024457","009617","015260","016932","016199","024477","014272","015883","020547","009922","010321","010157",
                                 "021094","012859","014073","012392","015277","016883","014129","023853","014345","015765","023454","015926","008972","008906",
                                 "012023","009055","000098","008806","015405","014199","005841","023812","016433","010330","014751","008732","009938","015307",
                                 "014557","021096","005759","001502","016560","014057","017261","021864","010014","009487","023805","024220","008752","020443",
                                 "007413","009488","011993","013140","023706","024117","000043","012981","010847","014511","014183","024649","014193","014480",
                                 "014354","005174","016637","021115","024641","015251","013958","009614","008743","017197","012789","009432","016565","010114",
                                 "023505","009994","014280","002787","007519","024213","023471","016413","022094","009220","001151","016171","016440","010863",
                                 "002229","011989","023502","008838","017186","024627","007607","015772","014791","008882","013271","023694","020900","014122",
                                 "021077","005232","013254","008962","009485","015892","012765","017191","024225","021078","023024","015821","023771","022873",
                                 "001503","018652","002264","008662","020382","007387","015265","013780","014323","010010","012722","014662","008795","023469",
                                 "000436","001888","024102","009597","013957","016164","023938","018653","006852","024226","023988","024009","020096","013825",
                                 "015899","005061","015290","015305","014321","017097","023955","014071","014121","014363","023926","023818","009718","022670",
                                 "024480","012182","024638","015619","009445","023715","015760","014763","007381","024216","009594","023472","015125","007534",
                                 "012984","014390","016636","024585","015889","002254","013337","023738","020853","016211","017129","012910","008830","023865",
                                 "023484","007392","013670","013527","020007","016432","010774","024459","005732","018679","014507","012053","009598","012783",
                                 "023488","022071","000010","004836","024018","008730","022642","018097","009655","010164","000760","013522","024793","000799",
                                 "024218","023695","014064","008969","013787","023492","010869","018153","024479","023170","009504","017133","009534","012766",
                                 "024073","022671","016313","009506","016314","014367","013743","000285","001278","024098","018096","009003","023739","012047",
                                 "008803","013557","017405","022099","016228","014286","016545","013820","011349","024633","013763","015269","009411","023776",
                                 "012921","019949","010715","014762","023775","022672","013206","014694","008725","024074","015124","013046","024172","004891",
                                 "015875","009628","000002","016255","023473","012911","008817","015832","013816","020669","024642","003727","013272","020837",
                                 "015275","014698","023413","018844","000728","010160","021871","009491","016535","000028","023693","010166","015366","021626",
                                 "008819","012596","024588","014344","024145","012985","008744","024433","013549","022911","023503","011280","017258","024893",
                                 "014680","014403","014901","018594","016198","016530","015828","020258","014267","013821","013671","024317","022701","011557",
                                 "024211","014715","021072","017054","020456","020090","024217","015778","018392","023638","015356","008837","014195","014505",
                                 "023495","014082","009398","017181","013006","009613","007861","003498","010140","020256","013202","011520","013749","014039",
                                 "013742","010773","013627","013520","008918","008773","024147","014268","010013","009727","015130","017051","022666","015949",
                                 "009500","024635","022664","016418","000003","005819","020011","022665","015895","023708","002255","020898","010864","016668",
                                 "004833","014283","000474","004902","002905","020896","024210","014128","016165","000022","022908","023414","015177","014723",
                                 "016563","015764","008872","008801","024192","022668","022676","014278","002893","010317","015890","020006","008875","008808",
                                 "014550","016163","014343","009536","002843","014072","010198","016882","020488","016417","023774","010862","008885","013550",
                                 "012920","024632","008961","016243","009446","016411","010288","021068","024626","023476","002906","024190","009555","014052",
                                 "007851","013518","012273","009421","023360","024179","023932","012834","014523","003943","006538","014140","024907","011648",
                                 "004687","001001","007684","014384","024575","018903","015374","023752","023963","016204","009470","004524","017446","002276",
                                 "024165","001588","014293","023653","024159","024200","018898","023934","009475","018090","009471","005067","015946","020880",
                                 "024577","008760","000901","015944","007938","017437","023744","002835","003124","002375","015860","016662","005592","024158",
                                 "004707","021083","005066","014611","009607","004621","015239","017448","023390","004622","002214","008827","016236","016180",
                                 "020031","000522","002376","001969","009478","024621","013534","015372","018092","023933","002374","001022","007934","001735",
                                 "002373","003420","001007","022688","024007","003742","003418","007496","001486","016239","002371","019583","010516","014531",
                                 "016423","003417","023931","009039","014520","009479","023754","009531","005833","015302","001962","002277","009532","009473",
                                 "009266","015753","023749","004712","015933","015301","018061","018896","020910","023962","009883","015498","002364","014102",
                                 "005068","006537","003419","015907","006540","022842","012968","017450","024157","022430","007128","023748","024593","024154",
                                 "022691","024199","000583","015241","007950","023717","003747","010992"]

            // Executes the whole PT initialization process
            _this.initialize = function() {
                $scope.loadingScreenManager.setLoadingScreen();
                _this.retrieveAvailableObjectTypes();
                $scope.toolParameters.checkWhereAreWeComingFrom();
            };

            // STEP1: Retrieve all object types, thats the only initialization step
            _this.retrieveAvailableObjectTypes = function() {
                var callback = function(obj) {
                    $scope.objectManager.resetObjectManager();
                    for (var i = 0; i < obj.length; i++) {
                        // Fix the labels if the type is person
                        if (obj[i].type.localeCompare("person") === 0) {
                            obj[i].labels = _this.fixPersonLabels(obj[i].labels);
                        }

                        $scope.objectManager.objectTypes[obj[i].type] = {
                            type: obj[i].type,
                            datasetType: obj[i].datasetType,
                            numKeypoints: obj[i].numKeypoints,
                            labels: obj[i].labels,
                            skeleton: obj[i].skeleton,
                            objects: {}
                        }

                        // Set the type in the dynamic or static category
                        if (obj[i].type.localeCompare("ignore_region") == 0) {
                            $scope.objectManager.staticTypes.push(obj[i].type);
                            $scope.objectManager.objectTypes[obj[i].type].labels = [""] // No fixed labels
                        } else {
                            $scope.objectManager.dynamicTypes.push(obj[i].type)
                        }
                    }
                    $scope.loadingScreenManager.closeLoadingScreen();
                }

                toolSrvc.retrieveAvailableObjectTypes($scope.toolParameters.activeDataset.type, callback, $scope.messagesManager.sendMessage);
            }

            // Function that removes the two ear labels from posetrack person
            _this.fixPersonLabels = function(labels){
                if (labels.length == 15) return labels.slice();
                // Remove index 3 and 4
                var returnLabels = labels.slice();
                returnLabels.splice(3,2);
                return returnLabels;
            }

            // Function that restores the two ear labels from posetrack person
            _this.restorePersonLabels = function(labels) {
                // Insert the two labels in their correct position
                var returnLabels = labels.slice();
                returnLabels.splice(3,0, "left_ear", "right_ear");
                return returnLabels;
            }

            // Function that removes the two ear keypoints from posetrack person
            _this.fixPersonKeypoints = function(keypoints) {
                if (keypoints.length == 15) return JSON.parse(JSON.stringify(keypoints));
                // First remove the points from the ears
                var returnKeypoints = JSON.parse(JSON.stringify(keypoints));
                returnKeypoints.splice(3,2);

                var finalReturnKeypoints = [];

                for (var i = 0; i < returnKeypoints.length; i++) {
                    if (returnKeypoints[i].length == 0) {
                        finalReturnKeypoints.push([-1, -1, 0]);
                    } else if (returnKeypoints[i].length == 2) {
                        finalReturnKeypoints.push([returnKeypoints[i][0], returnKeypoints[i][1], 0]);
                    } else if (returnKeypoints[i].length == 3) {
                        if (returnKeypoints[i][2] === null) {
                            finalReturnKeypoints.push([returnKeypoints[i][0], returnKeypoints[i][1], 0]);
                        } else {
                            finalReturnKeypoints.push(returnKeypoints[i]); 
                        }            
                    }
                }

                // Check third coordinates to remove them
                return finalReturnKeypoints;
            }

            // Function that restores the two person labels from posetrack person
            _this.restorePersonKeypoints = function(keypoints) {
                if (keypoints.length == 17) return keypoints;

                var returnKeypoints = JSON.parse(JSON.stringify(keypoints));
                returnKeypoints.splice(3,0, [-1, -1, 0], [-1, -1, 0]);
                return returnKeypoints;
            }

            // Function that returns the list of frames to annotate
            _this.getVideoFramesToAnnotate = function(video) {
                if(navSrvc.getActiveDataset().name.includes('posetrack_intro')){
                    _this.videoFramesToAnnotate = [];
                } else{
                    let callback = function(frames) {
                        _this.videoFramesToAnnotate = frames;
                    }
                    toolSrvc.getVideoFramesToAnnotate(video, callback, $scope.messagesManager.sendMessage);
                }
            }

            // Checks if frame has to be annotated
            _this.isFrameAnnotable = function(frame, object) {
                if (object === null) return false;
                
                if(navSrvc.getActiveDataset().name.includes('posetrack_intro')){
                    return true
                }
                if(!_this.videoFramesToAnnotate.includes(frame)) {
                    return false
                } else {
                    // Check if we have BBox
                    if ($scope.objectManager.hasAnnotation(object.uid, "bbox", frame)) {
                        return true
                    } else return false
                }
            }

            // Gets the labels for the current ignore region in the current frame
            _this.getIgnoreRegionLabels = function(frame) {
                var keypoints = $scope.objectManager.selectedObject.frames[frame - $scope.toolParameters.frameFrom].keypoints;
                var labels = [];

                for (var i=0; i<keypoints.length; i++) {
                    labels.push(i);
                }
                return labels;
            }

            // Retrieve objects
            _this.retrieveObjects = function() {
                var callback = function(objects) {
                    if (objects.length <= 0) return;
                                        
                    for (let obj in objects) {
                        let object = objects[obj].object;
                        
                        var existsInit = [];
                        if (!$scope.objectManager.isStaticType(object.type)) {
                            for (var j = 0; j < $scope.objectManager.objectTypes[object.type.toString()].labels.length; j++) {
                                existsInit.push(false);
                            }
                        } 

                        $scope.objectManager.objectTypes[object.type.toString()].objects[object.track_id.toString()] = {
                            uid: object.track_id,
                            person_id: object.person_id,
                            type: object.type,
                            labels: [""],
                            frames: []
                        };
    
                        // Fill the frames array with an empty array for each frame
                        for (var j = 0; j <= $scope.toolParameters.numberOfFrames; j++) {
                            $scope.objectManager.objectTypes[object.type.toString()].objects[object.track_id.toString()].frames.push({
                                frame: $scope.toolParameters.frameFrom + j,
                                annotationsExist: existsInit.slice(),
                                visibility: [],
                                keypoints: []
                            })
                        }
                    }
                    for (let obj in objects) {
                        let object = objects[obj].object;
                        if (object.frame >= $scope.toolParameters.frameFrom && object.frame <= $scope.toolParameters.frameTo) {
                            $scope.objectManager.objectTypes[object.type.toString()].objects[object.track_id.toString()]
                                .frames[object.frame - $scope.toolParameters.frameFrom].original_uid = object.uid;
                        }
                    }
                    _this.retrieveAnnotations();
                }

                $scope.loadingScreenManager.setLoadingScreen();

                if ($scope.camerasManager.loadedCameras.length > 0) {
                    toolSrvc.retrieveObjects($scope.toolParameters.activeDataset, $scope.camerasManager.loadedCameras[0].filename, $scope.toolParameters.user.name, callback, $scope.messagesManager.sendMessage);
                } else {
                    toolSrvc.retrieveObjects($scope.toolParameters.activeDataset, $scope.canvasesManager.canvases[0].getActiveCamera().filename, $scope.toolParameters.user.name, callback, $scope.messagesManager.sendMessage);
                }
            };

            // Retrieve annotations
            _this.retrieveAnnotations = function() {
                var callback = function(annotations) {
                    if (annotations.length === 0) {  // Check if we received something
                        $scope.loadingScreenManager.closeLoadingScreen();
                        $scope.canvasesManager.refreshProjectionOfCanvases();
                        return;
                    }
        
                    for (let j = 0; j < annotations.length; j++) {
                        let annotation = annotations[j];
                        for (let i = 0; i < annotation.objects.length; i++) {
                            // If the object is of type "person", fix the keypoint structure to ignore ears
                            if (annotation.objects[i].type.toString().localeCompare("person") === 0) {
                                var keypoints = _this.fixPersonKeypoints(annotation.objects[i].keypoints.slice());
                                var coordinates = []
                                var visibilities = []

                                
                                // Separate coordinates from visibility
                                for (var k=0; k< keypoints.length; k++){
                                    coordinates.push([keypoints[k][0], keypoints[k][1]]);
                                    visibilities.push(keypoints[k][2]);
                                }
                                
                                // Post process the out-of-image points
                                for (var k=0; k< coordinates.length; k++){
                                    if (JSON.stringify(coordinates[k]) === JSON.stringify([0,0])) {
                                        coordinates[k] = [-1,-1].slice();
                                        visibilities[k] = 0;
                                    }
                                }

                                annotation.objects[i].keypoints = coordinates.slice();

                                // Set the visibility directly
                                $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                                .objects[annotation.objects[i].track_id.toString()].frames[annotation.frame - $scope.toolParameters.frameFrom].visibility = visibilities.slice();  
                            }
                            // In any case, store in that frame the keypoints, the frame number and the actions
                            if (_this.resizedVideos.includes($scope.canvasesManager.canvases[0].getActiveCamera().filename)) {
                                $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                                .objects[annotation.objects[i].track_id.toString()].frames[annotation.frame - $scope.toolParameters.frameFrom].keypoints =
                                $scope.objectManager.prepareKeypointsForFrontend(annotation.objects[i].keypoints.slice());
                            } else {
                                $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                                .objects[annotation.objects[i].track_id.toString()].frames[annotation.frame - $scope.toolParameters.frameFrom].keypoints =
                                annotation.objects[i].keypoints.slice();
                            }
                            $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                                .objects[annotation.objects[i].track_id.toString()].labels = annotation.objects[i].labels ? annotation.objects[i].labels.slice() : [""];
                            
                            $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                                .objects[annotation.objects[i].track_id.toString()].frames[annotation.frame - $scope.toolParameters.frameFrom].frame =
                                annotation.frame;
                            
                            for (var k = 0; k < annotation.objects[i].keypoints.length; k++) {
                                if (annotation.objects[i].keypoints[k].length !== 0) {
                                    $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                                        .objects[annotation.objects[i].track_id.toString()].frames[annotation.frame - $scope.toolParameters.frameFrom].annotationsExist[k] = true;
                                } 
                            }
                              
                        }
                    }
                    $scope.loadingScreenManager.closeLoadingScreen();
                    $scope.canvasesManager.refreshProjectionOfCanvases();
                };

                if ($scope.camerasManager.loadedCameras.length > 0) {
                    toolSrvc.getAnnotationsByFrameRange($scope.camerasManager.loadedCameras[0].filename, $scope.toolParameters.activeDataset.type, $scope.toolParameters.frameFrom, $scope.toolParameters.frameTo,
                        $scope.toolParameters.activeDataset.name, $scope.toolParameters.user.name, callback, $scope.messagesManager.sendMessage);
                } else {
                    toolSrvc.getAnnotationsByFrameRange($scope.canvasesManager.canvases[0].getActiveCamera().filename, $scope.toolParameters.activeDataset.type, $scope.toolParameters.frameFrom, $scope.toolParameters.frameTo,
                        $scope.toolParameters.activeDataset.name, $scope.toolParameters.user.name, callback, $scope.messagesManager.sendMessage);
                }
            };

            // Retrieve annotation by UID, objectType and range of frames
            _this.retrieveAnnotation = function(objectUID, objectType, frameArray) {
                var callback = function(annotations) { // Check if we received something
                    if (annotations.length <= 0) {
                        $scope.loadingScreenManager.closeLoadingScreen();
                        return;
                    }
                    for (let k = 0; k < annotations.length; k++) {
						let frame = annotations[k].frame;
						let objects = annotations[k].objects;
						for (let i= 0; i< objects.length; i++) {
							// If the object is of type "person", fix the keypoint structure to ignore ears
							if (objects[i].type.toString().localeCompare("person") === 0) {
                                var keypoints = _this.fixPersonKeypoints(objects[i].keypoints.slice());
                                var coordinates = []
                                var visibilities = []

                                // Separate coordinates from visibility
                                for (var j=0; j< keypoints.length; j++){
                                    coordinates.push([keypoints[j][0], keypoints[j][1]]);
                                    visibilities.push(keypoints[j][2]);
                                }

                                // Post process the out-of-image points
                                for (var j=0; j< coordinates.length; j++){
                                    if (JSON.stringify(coordinates[j]) === JSON.stringify([0,0])) {
                                        coordinates[j] = [-1,-1].slice();
                                        visibilities[j] = 0;
                                    }
                                }

                                objects[i].keypoints = coordinates.slice();

                                // Set the visibility directly
                                $scope.objectManager.objectTypes[objects[i].type.toString()].objects[objects[i].track_id.toString()].frames[frame - $scope.toolParameters.frameFrom].visibility = visibilities.slice();
							}
							if (_this.resizedVideos.includes($scope.canvasesManager.canvases[0].getActiveCamera().filename)) {
								$scope.objectManager.objectTypes[objects[i].type.toString()].objects[objects[i].track_id.toString()].frames[frame - $scope.toolParameters.frameFrom].keypoints = $scope.objectManager.prepareKeypointsForFrontend(objects[i].keypoints);
							} else {
								$scope.objectManager.objectTypes[objects[i].type.toString()].objects[objects[i].track_id.toString()].frames[frame - $scope.toolParameters.frameFrom].keypoints = objects[i].keypoints;
                            }
                            $scope.objectManager.objectTypes[objects[i].type.toString()]
                                .objects[objects[i].track_id.toString()].labels = objects[i].labels ? objects[i].labels.slice() : [""];
							$scope.objectManager.objectTypes[objects[i].type.toString()].objects[objects[i].track_id.toString()].frames[frame - $scope.toolParameters.frameFrom].original_uid = objects[i].uid;

							for (var j = 0; j < objects[i].keypoints.length; j++) {
                                if (objects[i].keypoints[j].length !== 0) {
                                    $scope.objectManager.objectTypes[objects[i].type.toString()]
                                        .objects[objects[i].track_id.toString()].frames[frame - $scope.toolParameters.frameFrom].annotationsExist[j] = true;
                                }
                            }
                            $scope.canvasesManager.refreshCanvasPointByUID(objects[i].track_id, objects[i].type, frame);
						}
                    }
                    $scope.loadingScreenManager.closeLoadingScreen();
                };
                
                $scope.loadingScreenManager.setLoadingScreen();
                // Reset that object exist counter to false
                var existsInit = [];
                for (var j = 0; j < $scope.objectManager.objectTypes[objectType.toString()].labels.length; j++) {
                    existsInit.push(false);
                }
                for (let i = 0; i < frameArray.length; i++) {
                    var frame = frameArray[i];
                    $scope.objectManager.objectTypes[objectType.toString()].objects[objectUID.toString()]
                        .frames[frame - $scope.toolParameters.frameFrom].annotationsExist = existsInit.slice();
                }
                if (frameArray.length === 1) {   // If there is only one frame
                    toolSrvc.getAnnotationOfFrameByUID($scope.toolParameters.user.name,
                        $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type,
                        $scope.canvasesManager.canvases[0].getActiveCamera().filename,
                        objectUID, objectType ,frameArray[0], frameArray[0],
                        callback, $scope.messagesManager.sendMessage, $scope.objectManager.selectedObject.uid);
                } else {
                    toolSrvc.getAnnotationOfFrameByUID($scope.toolParameters.user.name,
                        $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type,
                        $scope.canvasesManager.canvases[0].getActiveCamera().filename,
                        objectUID, objectType ,frameArray[0], frameArray[frameArray.length - 1],
                        callback, $scope.messagesManager.sendMessage, objectUID);
                }
            };

            // Interpolate
            _this.interpolate = function (objectUID, objectType, frameTo) {
                let callbackSuccess = function(_objectUID, objectType, frameFrom, frameTo) {
                    let frameArray = [];
                    for (let i = frameFrom; i <= frameTo; i++) frameArray.push(i);
                    _this.retrieveAnnotation(objectUID, objectType, frameArray);
                };

                if (frameTo === $scope.toolParameters.frameFrom) return; // Nothing to interpolate

                let frameFrom = null;
                // Find the frame to interpolate to
                for (var i = frameTo - 1; i >= Math.max($scope.toolParameters.frameFrom, frameTo - $scope.toolParameters.interpolationRange); i--) {
                    if ($scope.objectManager.annotationsState(objectUID, objectType, i) !== 0) {    // Found frame to interpolate to
                        frameFrom = i;
                        break;
                    }
                }

                if (frameFrom === null || frameFrom + 1 === frameTo) return; // Nothing found to interpolate to
                toolSrvc.interpolate($scope.toolParameters.user.name, $scope.toolParameters.activeDataset.name,
                    $scope.toolParameters.activeDataset.type, $scope.canvasesManager.canvases[0].activeCamera.filename,
                    [frameFrom], frameTo,
                    $scope.objectManager.selectedObject.frames[frameTo - $scope.toolParameters.frameFrom].original_uid,
                    objectType,
                    $scope.objectManager.selectedObject.frames[frameFrom - $scope.toolParameters.frameFrom].original_uid,
                    callbackSuccess, $scope.messagesManager.sendMessage,
                    $scope.objectManager.selectedObject.uid);
            };

            // For ignore regions, adds a new point at the end of the region
            _this.addNewTag = function(uid, type, frame) {
                // Add the empty point in the objectManager points
                $scope.objectManager.objectTypes[type.toString()].objects[uid.toString()].frames[frame - $scope.toolParameters.frameFrom].keypoints.push([]);

                // Re-select the object
                $scope.objectManager.selectedObject = $scope.objectManager.objectTypes[type.toString()].objects[uid.toString()];
                
                // Call project2D again in the canvas
                $scope.canvasesManager.refreshProjectionOfCanvases();

                // Reopen editor
                $scope.keypointEditor.openEditor($scope.objectManager.selectedObject, frame);
            }

            // Creates a new person generating new UIDs in the database
            _this.createPerson = function() {
                let callbackSuccess = function() {
                    $scope.loadingScreenManager.closeLoadingScreen();
                    _this.retrieveObjects();
                };
                $scope.loadingScreenManager.setLoadingScreen();
                toolSrvc.createPersonPT($scope.canvasesManager.canvases[0].activeCamera.filename,
                    $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type,
                    callbackSuccess, $scope.messagesManager.sendMessage)
            };


            // Creates a new person generating new UIDs in the database
            _this.createIgnoreRegion = function() {
                let callbackSuccess = function() {
                    $scope.loadingScreenManager.closeLoadingScreen();
                    _this.retrieveObjects();
                };
                $scope.loadingScreenManager.setLoadingScreen();
                let ignore_regions = $scope.objectManager.objectTypes["ignore_region"].objects;
                let minIRTrackID = 100
                for (let ir in ignore_regions) {
                    let irr = parseInt(ir, 10);
                    minIRTrackID = irr < minIRTrackID ? irr : minIRTrackID
                }
                if (minIRTrackID > 60) {
                    toolSrvc.createIgnoreRegion($scope.canvasesManager.canvases[0].activeCamera.filename,
                        $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type,
                        minIRTrackID,
                        callbackSuccess, $scope.messagesManager.sendMessage)
                } else {
                    $scope.sendMessage('Warning', "No space for more Ignore Regions");
                    $scope.loadingScreenManager.closeLoadingScreen();
                }

            };


            // Replicates the current annotation to all posterior frames in the active range
            _this.replicate = function(uid, type, frame) {
                let callbackSuccess = function(objectUID, objectType, startFrame, endFrame) {
                    let frameArray = [];
                    for (let i = startFrame; i <= endFrame; i++) frameArray.push(i);
                    _this.retrieveAnnotation(objectUID, objectType, frameArray);
                }
                let track_id = $scope.objectManager.selectedObject.uid;
                let objectType = $scope.objectManager.selectedType.type;
                let start_frame = $scope.timelineManager.slider.value;
                let end_frame = -1
                // Find the closest complete annotation in forward range
                for (let j = start_frame + 1; j < $scope.toolParameters.frameTo; j++) {
                    if ($scope.objectManager.objectTypes[objectType].objects[track_id].frames[j - $scope.toolParameters.frameFrom].keypoints.length > 0) {
                        end_frame = j;
                        break;
                    }
                }
                // If there is a future frame in range, check if it fits
                if (end_frame !== -1) {
                    // If it doesn't have the same number of keypoints as the next annotated object, show warning
                    if ($scope.objectManager.objectTypes[objectType].objects[track_id]
                            .frames[end_frame - $scope.toolParameters.frameFrom].keypoints.length ===
                        $scope.objectManager.selectedObject.frames[frame - $scope.toolParameters.frameFrom].keypoints.length)
                    {
                        toolSrvc.replicate($scope.toolParameters.user.name, $scope.toolParameters.activeDataset.name,
                            $scope.toolParameters.activeDataset.type, $scope.canvasesManager.canvases[0].activeCamera.filename,
                            frame, $scope.toolParameters.frameTo, uid, type,
                            callbackSuccess, $scope.messagesManager.sendMessage, uid);
                    }
                    else {
                        $mdDialog.show({
                            templateUrl: '/static/views/dialogs/confirmReplicateDialog.html',
                            controller: 'confirmReplicateCtrl',
                            escapeToClose: false,
                            locals: {
                                uid: uid,
                                type: type,
                                frame: frame
                            }
                        }).then(function(data) { // When finished, update the frames
                            if (data.msg.localeCompare("success") === 0)
                            {
                                toolSrvc.replicate($scope.toolParameters.user.name, $scope.toolParameters.activeDataset.name,
                                    $scope.toolParameters.activeDataset.type, $scope.canvasesManager.canvases[0].activeCamera.filename,
                                    frame, $scope.toolParameters.frameTo, uid, type,
                                    callbackSuccess, $scope.messagesManager.sendMessage, uid);
                            }
                            else if (data.msg.localeCompare("error") === 0) {
                                $scope.messagesManager.sendMessage("warning", "Something went wrong")
                            }
                        })
                    }
                } else { // If there isn't any in range, replicate away
                    toolSrvc.replicate($scope.toolParameters.user.name, $scope.toolParameters.activeDataset.name,
                        $scope.toolParameters.activeDataset.type, $scope.canvasesManager.canvases[0].activeCamera.filename,
                        frame, $scope.toolParameters.frameTo, uid, type,
                        callbackSuccess, $scope.messagesManager.sendMessage, uid);
                }

            }

            // Finds the closest complete object in the forward range and replicates it backwards up to the selected frame.
            _this.replicate_backwards = function() {
                let callbackSuccess = function(objectUID, objectType, startFrame, endFrame) {
                    let frameArray = [];
                    for (let i = startFrame; i <= endFrame; i++) frameArray.push(i);
                    _this.retrieveAnnotation(objectUID, objectType, frameArray);
                }
                let track_id = $scope.objectManager.selectedObject.uid;
                let objectType = $scope.objectManager.selectedType.type;
                let start_frame = $scope.timelineManager.slider.value;
                let end_frame = -1
                // Find the closest complete annotation in forward range
                for (let j = start_frame + 1; j < $scope.toolParameters.frameTo; j++) {
                    if ($scope.objectManager.objectTypes[objectType].objects[track_id].frames[j - $scope.toolParameters.frameFrom].keypoints.length > 0) {
                        end_frame = j;
                        break;
                    }
                }
                // If found, replicate that annotation backwards until the selected frame.
                if (end_frame !== -1) {
                    toolSrvc.replicate($scope.toolParameters.user.name, $scope.toolParameters.activeDataset.name,
                        $scope.toolParameters.activeDataset.type, $scope.canvasesManager.canvases[0].activeCamera.filename,
                        start_frame, end_frame, track_id, objectType,
                        callbackSuccess, $scope.messagesManager.sendMessage, track_id, false);
                } else {
                    $scope.messagesManager.sendMessage("danger", "Error: No complete objects in range.")
                }

            }
        
            // Updates the annotation being edited
            _this.updateAnnotation = function() {
                var callbackSuccess = function(uid, type, frame) {
                    $scope.toolsManager.switchSubTool("");
                    $scope.messagesManager.sendMessage("success", "Annotation updated!");
                    _this.retrieveAnnotation(uid, type, [frame]);

                    if ($scope.objectManager.isStaticType(type)) {
                        if ($scope.optionsManager.options.autoReplicate) _this.replicate(uid, type, frame);
                    } else {
                        if ($scope.optionsManager.options.autoInterpolate) _this.interpolate(uid, type, frame);
                    }
                }

                let object = {
                    uid: $scope.objectManager.selectedObject.original_uid,
                    type: $scope.objectManager.selectedObject.type,
                    track_id: $scope.objectManager.selectedObject.uid,
                    person_id: $scope.objectManager.selectedObject.person_id,
                    label: $scope.keypointEditor.keypointEditorData.annotationLabels.slice(),
                    keypoints: []
                }

                let shape = $scope.keypointEditor.keypointEditorData.shapes[0];

                object.keypoints = shape.cameraPoints;

                if (_this.resizedVideos.includes($scope.canvasesManager.canvases[0].getActiveCamera().filename)) {
                    // DEEP Copy!!!!
                    let keypointsCopy = JSON.parse(JSON.stringify(object.keypoints));
                    object.keypoints = $scope.objectManager.prepareKeypointsForBackend(keypointsCopy);
                }

                if (object.type.localeCompare("person") === 0) {
                    for (let j=0; j< object.keypoints.length; j++){
                        if (object.keypoints[j].length === 0) {
                            object.keypoints[j] = [-1,-1,0]
                        }
                    }

                    let visibilities = JSON.parse(JSON.stringify(shape.visibilities));
                    
                    // Add the visibility values again
                    for (let i=0; i<object.keypoints.length; i++){
                        if (object.keypoints[i].length == 2) {
                            object.keypoints[i].push(visibilities[i]);
                        }   
                    }

                    object.keypoints = _this.restorePersonKeypoints(object.keypoints);
                } 
                toolSrvc.updateAnnotation($scope.toolParameters.user.name, $scope.toolParameters.activeDataset,
                    $scope.canvasesManager.canvases[0].activeCamera.filename, $scope.timelineManager.slider.value,
                    object, callbackSuccess, $scope.messagesManager.sendMessage);
            };

            _this.callbackChangePersonID = function(msg, new_person_id) {
                _this.retrieveObjects();
                $scope.objectManager.selectedObject.person_id = new_person_id;
                $scope.messagesManager.sendMessage('success', msg);
            }

            // Opens the dialog for changing person ID
            _this.openChangePersonID = function(object) {
                $mdDialog.show({
                    templateUrl: '/static/views/dialogs/changePersonIDDialog.html',
                    controller: 'changePersonIDCtrl',
                    escapeToClose: false,
                    locals: {
                        toolSrvc: toolSrvc,
                        object: object,
                        dataset: $scope.toolParameters.activeDataset,
                        scene: $scope.canvasesManager.canvases[0].activeCamera.filename,
                        username: $scope.toolParameters.user.name
                    }
                }).then(function(data) { // When finished, update the frames
                    if (data.msg.localeCompare("success") === 0) {
                        toolSrvc.updatePersonID($scope.canvasesManager.canvases[0].activeCamera.filename,
                            $scope.toolParameters.activeDataset.name,
                            $scope.toolParameters.activeDataset.type,
                            object.uid, data.new_person_id, $scope.toolParameters.user.name,
                            _this.callbackChangePersonID,
                            $scope.messagesManager.sendMessage);
                        _this.retrieveObjects();
                    } else if (data.msg.localeCompare("error") === 0) {
                        $scope.messagesManager.sendMessage("warning", "Something went wrong")
                    }
                })
            }

            _this.callbackChangeTrackID = function(msg, new_track_id) {
                _this.retrieveObjects();
                //$scope.objectManager.selectedObject.uid = new_track_id;
                $scope.messagesManager.sendMessage('success', msg);
            }

            _this.openBatchChangeTrackID = function(object) {
                if (object.type === "ignore_region" ||
                    object.type === "bbox_head" ||
                    object.type === "bbox" ||
                    object.type === "person" ) {
                    $mdDialog.show({
                        templateUrl: '/static/views/dialogs/batchChangeTrackIDDialog.html',
                        controller: 'batchChangeTrackIDCtrl',
                        escapeToClose: false,
                        locals: {
                            toolSrvc: toolSrvc,
                            object: object,
                            dataset: $scope.toolParameters.activeDataset,
                            scene: $scope.canvasesManager.canvases[0].activeCamera.filename,
                            username: $scope.toolParameters.user.name,
                            ignoreRegions: $scope.objectManager.objectTypes["ignore_region"].objects,
                            bbox_heads: $scope.objectManager.objectTypes["bbox_head"].objects,
                            bboxes: $scope.objectManager.objectTypes["bbox"].objects,
                            persons: $scope.objectManager.objectTypes["person"].objects,
                            frame: $scope.timelineManager.slider.value - $scope.toolParameters.frameFrom,
                            min_frame: $scope.toolParameters.frameFrom,
                            max_frame: $scope.toolParameters.frameTo
                        }
                    }).then(function(data) { // When finished, update the object in the frame
                        if (data.msg.localeCompare("success") === 0) {
                            toolSrvc.updateTrackID($scope.canvasesManager.canvases[0].activeCamera.filename,
                                $scope.toolParameters.activeDataset.name,
                                $scope.toolParameters.activeDataset.type,
                                object.uid, data.new_track_id, $scope.toolParameters.user.name,
                                object.type, data.frame_start, data.frame_end,
                                _this.callbackChangeTrackID,
                                $scope.messagesManager.sendMessage);
                            // _this.retrieveObjects();
                        } else if (data.msg.localeCompare("error") === 0) {
                            $scope.messagesManager.sendMessage("warning", "Something went wrong")
                        }
                    })
                } else {
                    $scope.messagesManager.sendMessage("warning", "Action not available for this object type.")
                }
            }

            _this.openChangeTrackID = function(object) {
                if (object.type === "ignore_region" ||
                    object.type === "bbox_head" ||
                    object.type === "person" ) {
                    $mdDialog.show({
                        templateUrl: '/static/views/dialogs/changeTrackIDDialog.html',
                        controller: 'changeTrackIDCtrl',
                        escapeToClose: false,
                        locals: {
                            toolSrvc: toolSrvc,
                            object: object,
                            dataset: $scope.toolParameters.activeDataset,
                            scene: $scope.canvasesManager.canvases[0].activeCamera.filename,
                            username: $scope.toolParameters.user.name,
                            ignoreRegions: $scope.objectManager.objectTypes["ignore_region"].objects,
                            bbox_heads: $scope.objectManager.objectTypes["bbox_head"].objects,
                            persons: $scope.objectManager.objectTypes["person"].objects,
                            frame: $scope.timelineManager.slider.value - $scope.toolParameters.frameFrom
                        }
                    }).then(function(data) { // When finished, update the object in the frame
                        if (data.msg.localeCompare("success") === 0) {
                            toolSrvc.updateTrackID($scope.canvasesManager.canvases[0].activeCamera.filename,
                                $scope.toolParameters.activeDataset.name,
                                $scope.toolParameters.activeDataset.type,
                                object.uid, data.new_track_id, $scope.toolParameters.user.name,
                                object.type,
                                $scope.timelineManager.slider.value,
                                $scope.timelineManager.slider.value,
                                _this.callbackChangeTrackID,
                                $scope.messagesManager.sendMessage);
                            // _this.retrieveObjects();
                        } else if (data.msg.localeCompare("error") === 0) {
                            $scope.messagesManager.sendMessage("warning", "Something went wrong")
                        }
                    })
                } else {
                    $scope.messagesManager.sendMessage("warning", "Action not available for this object type.")
                }
            }

            // Opens the dialog for batch-deleting points
            _this.openBatchDelete = function(object) {
                $mdDialog.show({
                    templateUrl: '/static/views/dialogs/batchDeleteDialog.html',
                    controller: 'batchDeleteCtrl',
                    escapeToClose: false,
                    locals: {
                        toolSrvc: toolSrvc,
                        object: object,
                        objectType: $scope.objectManager.selectedType,
                        minFrame: $scope.toolParameters.frameFrom,
                        maxFrame: $scope.toolParameters.frameTo,
                        dataset: $scope.toolParameters.activeDataset,
                        scene: $scope.canvasesManager.canvases[0].activeCamera.filename, 
                        username: $scope.toolParameters.user.name
                    }
                }).then(function(data) { // When finished, update the frames
                    if (data.msg.localeCompare("success") === 0) {
                        $scope.messagesManager.sendMessage("success", "Annotations deleted!")
                        var frameArray = [];
                        for (let i = data.deleteFrom; i <= data.deleteTo; i++) {
                            frameArray.push(i);
                        }

                        _this.retrieveAnnotation(data.object.uid, data.object.type, frameArray);
                        
                    } else if (data.msg.localeCompare("error") === 0) {
                        $scope.messagesManager.sendMessage("warning", "Something went wrong")
                    }
                }) 
            }

            // Transfer object
            _this.openTransferObject = function(object) {
                
            }

            // Deletes the actual object in the actual frame
            _this.deleteAnnotation = function() {
                var successFunction = function() {
                    $scope.messagesManager.sendMessage("success", "Annotation deleted!")
                    let object = $scope.objectManager.selectedObject;
                    _this.retrieveAnnotation(object.uid, object.type, [$scope.timelineManager.slider.value]);
                }
                toolSrvc.batchDeleteAnnotations($scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.canvasesManager.canvases[0].activeCamera.filename, $scope.timelineManager.slider.value, $scope.timelineManager.slider.value, $scope.toolParameters.user.name, $scope.objectManager.selectedObject.uid, $scope.objectManager.selectedObject.type, successFunction, $scope.messagesManager.sendMessage);
            }
        }

        function ToolsManager () {
            var _this = this;

            _this.blockChanges = false;

            _this.tool = "";
            _this.subTool = "";


            // Switches the value of the secondary tool
            _this.switchSubTool = function(sT) {
                var toolToChange = sT;
                if (_this.subTool.localeCompare(sT) === 0) {
                    toolToChange = '';
                }
                _this.subTool = toolToChange;

                if (_this.subTool.localeCompare("") === 0) {
                    _this.blockChanges = false;
                    $scope.timelineManager.unsetReadOnly();
                } else {
                    _this.blockChanges = true;
                    $scope.timelineManager.setReadOnly();
                }
            };


            // Switches the value of the principal tool
            _this.switchTool = function(newTool) {
                _this.tool = newTool
                _this.subTool = '';
            }
        }

        function MugshotsManager () {
            var _this = this;

            _this.mugshots = [];

            // Function that retrieves mugshots of the selected UID
            _this.getMugshots = function(uid) {
                var callback = function(mugshots) {
                    for (var i = 0; i < mugshots.length; i++) {
                        var imageData = mugshots[i].image.slice(2, mugshots[i].image.length - 1); // Process the image
                        var stringImage = "data:image/jpeg;base64," + imageData;
    
                        _this.mugshots.push({ 'image': stringImage });
                    }
                };

                _this.mugshots = [];
                if ($scope.toolParameters.isPosetrack) {
                    toolSrvc.getMugshots($scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.canvasesManager.canvases[0].activeCamera.filename, $scope.toolParameters.user.name, uid, callback);
                } else {
                    toolSrvc.getMugshots($scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, $scope.toolParameters.user.name, uid, callback);
                }
            }
        }

        function ActionsEditor () {
            var _this = this;

            _this.active = false;
            _this.minimized = false;

            // Opens the panel to edit actions
            _this.open = function() {
                _this.active = true;
            }

            // Closes the panel to edit actions
            _this.close = function() {
                _this.active = false;
                $scope.actionManager.selectedObject = null;
            }

            // Opens/closes the editor of actions
            _this.toggleActive = function() {
                _this.active = !_this.active;
            }
            
            // Minimize/Maximize the editor
            _this.minimizeMaximize = function() {
                _this.minimized = !_this.minimized;
            }

            _this.setActualFrameFrom = function() {
                $scope.actionManager.setActionFrameFrom($scope.timelineManager.slider.value);
            }

            _this.setActualFrameTo = function() {
                $scope.actionManager.setActionFrameTo($scope.timelineManager.slider.value);
            }

        }

        function KeypointEditor () {
            var _this = this;

            _this.active = false;
            _this.editorActive = false;

            _this.minimized = false;
            _this.editorMinimized = false;

            _this.selectedLabel = 0;

            _this.keypointEditorData = {};

            _this.poseAIKLimbs = {
                upperArm: -1,
                lowerArm: -1,
                upperLeg: -1,
                lowerLeg: -1
            }

            _this.moveWholeShape = false;

            // Opens the panel to edit keypoints 
            _this.openEditor = function(object, frame) {
                $scope.toolParameters.setMaxVideoFrame(navSrvc.getMaxFrame());
                _this.editorActive = true;
                $scope.objectManager.selectedObject = object;
                $scope.timelineManager.slider.value = frame;

                if ($scope.toolParameters.isPosetrack) $scope.mugshotsManager.getMugshots(object.uid);
                else if (object.type.localeCompare("poseAIK") == 0) _this.poseAIKLimbs = $scope.objectManager.selectedObject.limbLengths;
                                
                _this.keypointEditorData = {
                    searchUID: null,
                    shapes: [].slice(),
                    labels: (object.type.localeCompare("ignore_region") == 0) ?  $scope.commonManager.getIgnoreRegionLabels(frame).slice() : $scope.objectManager.selectedType.labels.slice(),
                    realLabels: (object.type.localeCompare("ignore_region") == 0) ?  $scope.commonManager.getIgnoreRegionLabels(frame).slice() : $scope.objectManager.selectedType.labels.slice(),
                    creationType: "point",
                    editorMode: $scope.objectManager.isStaticType(object.type) ? "static" : "dynamic",
                    annotationLabels: object.labels.length > 0 ? object.labels.slice() : [""],
                    indexBeingEdited: null,
                    modified: false
                }

                // Just for AIK and poseAIK add * to the optional labels
                if ($scope.objectManager.isTypeSelected("poseAIK")) {
                    var secondaryIndices = [14,15,16,17,18,19,20,21,22,23];
                    for (var i=0; i < secondaryIndices.length; i++) {
                        var index = secondaryIndices[i];
                        _this.keypointEditorData.labels[index] = _this.keypointEditorData.labels[index] + " (*)"; 
                    }
                }

                // In case of the object being of type box
                if ($scope.objectManager.isTypeSelected("bbox") || $scope.objectManager.isTypeSelected("bbox_head")) {
                    _this.keypointEditorData.labels = ["box"];
                    _this.keypointEditorData.creationType = "box";
                }

                // Check the dataset type
                if ($scope.toolParameters.isPosetrack) {
                    // Add original UID to selected object. Create it if it doesn't exist.
                    if ($scope.objectManager.selectedObject.frames[frame - $scope.toolParameters.frameFrom].original_uid === undefined) {
                        // NOTE: This should NEVER happen!!
                        // $scope.objectManager.selectedObject.frames[frame - $scope.toolParameters.frameFrom].original_uid = $scope.commonManager.generateNewOriginalUid(object.uid, frame);
                    }
                    $scope.objectManager.selectedObject.original_uid = $scope.objectManager.selectedObject.frames[frame - $scope.toolParameters.frameFrom].original_uid;

                    _this.keypointEditorData.shapes = [null];
                    _this.keypointEditorData.searchUID = $scope.objectManager.selectedObject.uid;


                } else {
                    _this.keypointEditorData.shapes = [null,null,null,null];
                    _this.keypointEditorData.searchUID = $scope.objectManager.selectedObject.uid;
                    
                }

                $scope.canvasesManager.projectKeypointEditorData(frame);

            }

            _this.startEditingSelectedLabel = function(index, toolType) {
                _this.selectedLabel = index;
                if (toolType.localeCompare('') === 0) {
                    $scope.toolsManager.switchSubTool("");
                    _this.keypointEditorData.indexBeingEdited = null;
                    $scope.canvasesManager.redrawCanvases();
                } else {
                    if ($scope.toolsManager.subTool.localeCompare(toolType) !== 0) $scope.toolsManager.switchSubTool(toolType);
                    
                    _this.keypointEditorData.indexBeingEdited = index;
                    if (!$scope.toolParameters.isPosetrack) $scope.canvasesManager.resetEpilines();
               
                    // Remove that point from the
                    _this.removeEditorDataPoint(index);               
                }  
            }


            _this.removeEditorDataPoint = function(index) {
                for (var i = 0; i < _this.keypointEditorData.shapes.length; i++) {
                    if (_this.keypointEditorData.shapes[i] !== null) {
                        _this.keypointEditorData.shapes[i].removePoint(index);
                    }
                }
                
                $scope.canvasesManager.redrawCanvases();
            }

            _this.removeEditorDataBox = function() {
                for (var i = 0; i < _this.keypointEditorData.points.length; i++) {
                    _this.removeEditorDataPoint(i);
                }
            }

            _this.nextLabel = function() {
                if (_this.selectedLabel + 1 > _this.keypointEditorData.labels.length - 1) {
                    _this.selectedLabel = _this.keypointEditorData.labels.length - 1;
                } else {
                    _this.selectedLabel++;
                    // Reset the edition
                    if (_this.keypointEditorData.indexBeingEdited !== null) {
                        $scope.toolsManager.switchSubTool("");
                    }
                }
                $scope.canvasesManager.redrawCanvases();
            }

            _this.previousLabel = function() {
                if (_this.selectedLabel - 1 < 0) {
                    _this.selectedLabel = 0;
                } else {
                    _this.selectedLabel--;
                    // Reset the edition
                    if (_this.keypointEditorData.indexBeingEdited !== null) {
                        $scope.toolsManager.switchSubTool("");
                    }
                }
                $scope.canvasesManager.redrawCanvases();
            }

            _this.selectLabel = function(labelIndex) {
                if (_this.selectedLabel == labelIndex){
                    return
                } else {
                    _this.selectedLabel = labelIndex;
                    // Reset the edition
                    if (_this.keypointEditorData.indexBeingEdited !== null) {
                        $scope.toolsManager.switchSubTool("");
                    }
                }
                $scope.canvasesManager.redrawCanvases();
            }
            
            // Only works in PT
            _this.changeVisibility = function(index) {
                if (_this.keypointEditorData.shapes[0].visibilities[index] == 0) {
                    _this.keypointEditorData.shapes[0].visibilities[index] = 1;
                } else {
                    _this.keypointEditorData.shapes[0].visibilities[index] = 0;
                }
                $scope.canvasesManager.redrawCanvases();
            }

            // Update the stored pose AIK limb values with the actual ones
            _this.updatePoseAIKLimbs = function() {
                var limbs = [_this.poseAIKLimbs.upperArm, _this.poseAIKLimbs.lowerArm, _this.poseAIKLimbs.upperLeg, _this.poseAIKLimbs.lowerLeg]
                $scope.commonManager.updatePoseAIKLimbsLengthForUID(limbs);
            }

            _this.forceAllLimbLengthsInRange = function(object) {
                $scope.commonManager.forcePoseAIKLimbLengthsForRange(object);
            }

            _this.forceLimbLength = function(number) {
                var startLabels = [];
                var endLabels = [];
                var limbLength = -1;
                
                switch(number) {
                    case 0:
                        // Upper arm
                        startLabels = [2,5];
                        endLabels = [3,6];
                        limbLength = _this.poseAIKLimbs.upperArm;
                        break;
                    case 1:
                        // Lower arm
                        startLabels = [3,6];
                        endLabels = [4,7];
                        limbLength = _this.poseAIKLimbs.lowerArm;
                        break;
                    case 2:
                        // Upper leg
                        startLabels = [8,11];
                        endLabels = [9,12];
                        limbLength = _this.poseAIKLimbs.upperLeg;
                        break;
                    case 3:
                        // Lower leg
                        startLabels = [9,12];
                        endLabels = [10,13];
                        limbLength = _this.poseAIKLimbs.lowerLeg;
                        break;
                    default:
                      $scope.messagesManager.sendMessage('danger', 'Force limb length error!');
                      return;
                  }

                  if (limbLength == -1) {
                    $scope.messagesManager.sendMessage('danger', 'Limb length has incorrect value!');
                    return;
                  }

                  $scope.commonManager.forcePoseAIKLimbLength(startLabels, endLabels, limbLength);
            }

            _this.extendBoxToGround = function() {
                $scope.commonManager.extendBoxToGround($scope.objectManager.selectedObject.uid, $scope.objectManager.selectedObject.type, $scope.timelineManager.slider.value)
            }

            _this.setMoveWholeShape = function() {
                _this.moveWholeShape = true;
            }

            _this.unsetMoveWholeShape = function() {
                _this.moveWholeShape = false;
            }

            _this.addNewTag = function() {
                $scope.commonManager.addNewTag($scope.objectManager.selectedObject.uid, $scope.objectManager.selectedType.type, $scope.timelineManager.slider.value);
            }

            // Calls the interpolate method from the current DatasetManager
            _this.callInterpolate = function() {
                $scope.commonManager.interpolate($scope.objectManager.selectedObject.uid, $scope.objectManager.selectedObject.type, $scope.timelineManager.slider.value)
            }

            // Closes the panel to edit keypoints
            _this.closeEditor = function() {
                _this.editorActive = false;
                $scope.toolsManager.switchTool("");
                $scope.toolsManager.switchSubTool("");
                $scope.objectManager.selectedObject = null; // De-select the selected object when closing the panel
                $scope.canvasesManager.redrawCanvases();
            }

            _this.toggleActive = function() {
                _this.active = !_this.active;
                if (!_this.active) {
                    $scope.toolsManager.switchTool("");
                } 
            }

            // Minimize/maximize the keypoint editor tab
            _this.minimizeMaximize = function() {
                _this.minimized = !_this.minimized;
            }

            // Maximize/maximize the keypoint editor tab
            _this.minimizeMaximizeEditor = function() {
                _this.editorMinimized = !_this.editorMinimized;
            }

            // Bridge function to open the object transfer dialog
            _this.openTransferObject = function(object){
                $scope.commonManager.openTransferObject(object);
            }

            // Calculates the needed epilines of the points being placed
            _this.getEpilines = function() {
                var callbackSuccess = function(epilinePoints, cam1Index, cam2Index) {
                    $scope.canvasesManager.setEpiline(epilinePoints, cam1Index, cam2Index)
                }
                // Reset existing epilines
                $scope.canvasesManager.resetEpilines();

                // For each point
                for (var i = 0; i < _this.keypointEditorData.shapes.length; i++) {
                    if (_this.keypointEditorData.shapes[i] !== null) {
                        if (_this.keypointEditorData.shapes[i].points[_this.keypointEditorData.indexBeingEdited] !== null) {
                            var point = _this.keypointEditorData.shapes[i].cameraPoints[_this.keypointEditorData.indexBeingEdited];
                            var cameraName = $scope.canvasesManager.canvases[i].activeCamera.filename;

                             // For each camera
                            for (var j = 0; j < $scope.canvasesManager.canvases.length; j++) {
                                if ($scope.canvasesManager.canvases[j].hasActiveCamera() && $scope.canvasesManager.canvases[j].activeCamera.filename.localeCompare(cameraName) !== 0) {
                                    var cameraToProject = $scope.canvasesManager.canvases[j].activeCamera.filename;
                                    toolSrvc.getEpiline($scope.timelineManager.slider.value, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.objectManager.prepareKeypointForBackend(point), cameraName, cameraToProject, i, j, _this.keypointEditorData.indexBeingEdited, callbackSuccess, $scope.messagesManager.sendMessage);
                                }
                            }
                        }
                    }
                }
            }
        }    
       
        //// OBJECTS ////
        function Epiline (projectedPoint1, projectedPoint2, color) {
            var _this = this;

            _this.pp1 = projectedPoint1;
            _this.pp2 = projectedPoint2;
            _this.color = color;

            // Draws the epiline in the given context (canvas)
            _this.draw = function(context) {
                context.beginPath();
                context.moveTo(_this.pp1[0], _this.pp1[1]);
                context.lineTo(_this.pp2[0], _this.pp2[1]);
                context.strokeStyle = _this.color;
                context.lineWidth = 3;
                context.stroke();
                context.closePath();
            }
        }

        function PoseAIK(uid, projectedPoints, cameraPoints, labels, skeleton) {
            var _this = this;
            _this.labels = labels;
            _this.abbreviatedLabels = [];
            _this.uid = uid;
            _this.points = [];
            _this.cameraPoints = [];
            _this.skeleton = skeleton;
            
            _this.rightSide = [2,3,4,8,9,10,14,16,21,22,23];
            _this.leftSide = [5,6,7,11,12,13,15,17,18,19,20];

            _this.secondaryJoints = [14,15,16,17,18,19,20,21,22,23];

            _this.limbsToShowLengthConnections = {
                "2": [3,5,8],
                "3": [2,4],
                "4": [3],
                "5": [2,6,11],
                "6": [5,7],
                "7": [6],
                "8": [2,9,11],
                "9": [9,10],
                "10": [9],
                "11": [5,8,12],
                "12": [11,13],
                "13": [12]
            }

            // CONSTRUCT
            if (projectedPoints.length === 0) {
                for (var i = 0; i < _this.labels.length; i++) {
                    _this.points.push(null);
                    _this.cameraPoints.push([]);
                }
            } else {
                for (var i = 0; i < _this.labels.length; i++) {
                    if (projectedPoints[i].length !== 0) {
                        _this.points.push(new Point(projectedPoints[i]));
                    } else _this.points.push(null);
                }
                _this.cameraPoints = cameraPoints; 
            }

            _this.abbreviatedLabels = ["No", "Ne", "ShR", "ElR", "HaR", "ShL", "ElL", "HaL", "HiR", "KnR", "FoR", "HiL", "KnL",
            "FoL", "EyR", "EyL", "EaR", "EaL", "STL", "LTL", "HeL", "STR", "LTR", "HeR"];

            // FUNCTIONS
            _this.draw = function(context, color) {
                var lightColor = $scope.colorManager.updateColorLight(color);
                var darkColor = $scope.colorManager.updateColorDark(color);
                
                // Draw the points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        if (_this.secondaryJoints.includes(i) && !$scope.optionsManager.options.showSecondaryPoseJoints) break;
                        
                        if (_this.leftSide.includes(i)) _this.points[i].draw(context, lightColor);
                        else if (_this.rightSide.includes(i)) _this.points[i].draw(context, darkColor);
                        else _this.points[i].draw(context, color); 
                    }
                }

                // Then draw all the edges
                _this.drawEdges(context, color);

                // Lastly draw the selected point, to be on top of the rest
                if (_this.points[$scope.keypointEditor.selectedLabel] !== null) {
                    _this.points[$scope.keypointEditor.selectedLabel].draw(context, "#FF8F3D");
                    if ($scope.optionsManager.options.drawLimbLengths && Object.prototype.hasOwnProperty(_this.limbsToShowLengthConnections, $scope.keypointEditor.selectedLabel.toString())) {
                        _this.drawEdgesWithLengths(context, $scope.keypointEditor.selectedLabel, _this.limbsToShowLengthConnections[$scope.keypointEditor.selectedLabel.toString()])
                    }
                }
            }

            _this.drawEdges = function(context, color) {
                for (var i = 0; i < _this.skeleton.length; i++) {
                    if ((_this.secondaryJoints.includes(_this.skeleton[i][0]) || _this.secondaryJoints.includes(_this.skeleton[i][1])) && !$scope.optionsManager.options.showSecondaryPoseJoints) break;
                    
                    _this.drawEdge(context, color, _this.points[_this.skeleton[i][0]], _this.points[_this.skeleton[i][1]]);
                }
            }

            _this.drawEdgesWithLengths = function(context, index, indices) {
                var point3D_1 = $scope.objectManager.selectedObject.frames[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom].keypoints[index];
                var point2D_1 = _this.points[index];

                for (var i=0; i < indices.length; i++) {
                    if (_this.points[indices[i]] !== null) {
                        var point3D_2 = $scope.objectManager.selectedObject.frames[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom].keypoints[indices[i]];
                        var point2D_2 = _this.points[indices[i]];
                        var distance = _this.getDistance3D(point3D_1, point3D_2)
                        var position = [(point2D_1.center[0] + point2D_2.center[0]) / 2.0, (point2D_1.center[1] + point2D_2.center[1]) / 2.0]

                        _this.drawEdge(context, "#FF8F3D", point2D_1, point2D_2)
                        _this.drawLength(context, position, distance);
                    }
                }
            }

            _this.drawLength = function(context, position, length) {
                context.beginPath();
                context.font = $scope.optionsManager.options.fontSize.toString() + "px sans-serif";
                context.strokeStyle = "black";
                context.lineWidth = 3;
                context.strokeText(length.toFixed(2), position[0], position[1]);
                context.fillStyle = "white";
                context.fillText(length.toFixed(2), position[0], position[1]);
                context.fill();
                context.closePath();
            }

            _this.getDistance3D = function(p1, p2) {
                var a = (p2[0] - p1[0])
                var b = (p2[1] - p1[1])
                var c = (p2[2] - p1[2])
                return Math.sqrt((a*a) + (b*b) + (c*c))
            }

            _this.drawEdge = function(context, color, point1, point2) {
                if (point1 === null || point2 === null) return;

                context.beginPath();
                context.moveTo(point1.center[0], point1.center[1]);
                context.lineTo(point2.center[0], point2.center[1]);
                context.strokeStyle = color;
                context.lineWidth = 2;
                context.stroke();
                context.closePath();
            }

            _this.drawWithUID = function(context, color) {
                var lightColor = $scope.colorManager.updateColorLight(color);
                var darkColor = $scope.colorManager.updateColorDark(color);

                // Draw all the points but the nose
                for (var i = 1; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        if (_this.secondaryJoints.includes(i) && !$scope.optionsManager.options.showSecondaryPoseJoints) break;

                        if (_this.leftSide.includes(i)) _this.points[i].draw(context, lightColor);
                        else if (_this.rightSide.includes(i)) _this.points[i].draw(context, darkColor);
                        else _this.points[i].draw(context, color);   
                    }
                }

                // Then draw all the edges
                _this.drawEdges(context, color);

                // Nose always goes on top of everything
                if (_this.points[0] !== null) _this.points[0].drawWithText(context, color, _this.uid);
            }

            _this.drawWithLabel = function(context, color) {
                var lightColor = $scope.colorManager.updateColorLight(color);
                var darkColor = $scope.colorManager.updateColorDark(color);

                var labelsToUse = (($scope.optionsManager.options.abbreviateLabels) ? _this.abbreviatedLabels : _this.labels);

                // Draw all the edges
                _this.drawEdges(context, color);
                
                // Draw the points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        if (_this.secondaryJoints.includes(i) && !$scope.optionsManager.options.showSecondaryPoseJoints) break;
                        
                        if (_this.leftSide.includes(i)) _this.points[i].drawWithText(context, lightColor, labelsToUse[i]);
                        else if (_this.rightSide.includes(i)) _this.points[i].drawWithText(context, darkColor,labelsToUse[i]);
                        else _this.points[i].drawWithText(context, color, labelsToUse[i]);    
                    }
                }

                // Lastly draw the selected point, to be on top of the rest
                if (_this.points[$scope.keypointEditor.selectedLabel] !== null){
                    _this.points[$scope.keypointEditor.selectedLabel].drawWithText(context, "#FF8F3D", labelsToUse[$scope.keypointEditor.selectedLabel]);
                    if ($scope.optionsManager.options.drawLimbLengths && Object.prototype.hasOwnProperty(_this.limbsToShowLengthConnections, $scope.keypointEditor.selectedLabel.toString())) {
                        _this.drawEdgesWithLengths(context, $scope.keypointEditor.selectedLabel, _this.limbsToShowLengthConnections[$scope.keypointEditor.selectedLabel.toString()])
                    }
                }          
            }

            _this.drawObjectActions = function(context, color) {
                if (_this.points[0] === null) return;
                // Get actions for current frame
                var actions = angular.copy($scope.actionManager.actionsForVisualization[_this.uid][$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom]);

                if (actions.length > 0) _this.drawActions(context, color, actions);
            }

            _this.drawActions = function(context, color, actions) {
                // First get width and height of the bounding rectangle
                context.beginPath();
                context.font = $scope.optionsManager.options.fontSize.toString() + "px sans-serif";
                var maxWidth = context.measureText(actions[0]).width;
                for (var i=0; i < actions.length; i++) {
                    var currentWidth = context.measureText(actions[i]).width;
                    if (currentWidth > maxWidth) maxWidth = currentWidth;
                }

                var maxHeight = actions.length * $scope.optionsManager.options.fontSize;

                context.closePath();
                context.beginPath();
                context.fillStyle = color;
                context.fillRect(_this.points[0].center[0] - maxWidth / 2.0, _this.points[0].center[1] + $scope.optionsManager.options.pointSize / 2.0, maxWidth, maxHeight);
                context.closePath();
                context.beginPath();
                context.font = $scope.optionsManager.options.fontSize.toString() + "px sans-serif";
                context.textAlign = "start";
                context.textBaseline = "top";
                context.strokeStyle = "black";
                context.lineWidth = 2;
                context.fillStyle = "white";
                var offsetY = 0.5;
                for(var i=0; i<actions.length; i++) {
                    context.strokeText(actions[i].toString(), _this.points[0].center[0] - maxWidth / 2.0, _this.points[0].center[1] + $scope.optionsManager.options.pointSize / 2.0 + offsetY);
                    context.fillText(actions[i].toString(), _this.points[0].center[0] - maxWidth / 2.0, _this.points[0].center[1] + $scope.optionsManager.options.pointSize / 2.0 + offsetY);
                    offsetY += $scope.optionsManager.options.fontSize;
                }
                context.closePath();
            }

            _this.isInside = function(x,y) {
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        if (_this.points[i].isInside(x,y)) {
                            return true;
                        }
                    }
                }

                return false;
            }

            _this.move = function(dx, dy, index) {
                if (index == -1) {
                    for(var i=0; i<_this.points.length; i++) {
                        if (_this.points[i] !== null) _this.points[i].move(dx,dy);
                    }
                } else {
                    if (_this.points[index] == null) return;
                    _this.points[index].move(dx,dy);
                }        
            }

            _this.updateCameraPoints = function(dxCamera,dyCamera, index) {
                if (index == -1) {
                    for (var i=0; i<_this.points.length; i++) {
                        if (_this.points[i] !== null) {
                            _this.cameraPoints[i][0] += dxCamera;
                            _this.cameraPoints[i][1] += dyCamera;
                        }
                    }  
                } else {
                    _this.cameraPoints[index][0] += dxCamera;
                    _this.cameraPoints[index][1] += dyCamera;
                }     
            }

            _this.removePoint = function(index) {
                delete _this.points[index];
                _this.points[index] = null;
                _this.cameraPoints[index] = [];
            }

            _this.getPointIndex = function(x, y) {
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        if (_this.points[i].isInside(x,y)) {
                            return i;
                        }
                    }
                }
            }
        }

        function BoxAIK(uid, projectedPoints, cameraPoints, labels) {
            var _this = this;

            _this.uid = uid;
            _this.points = [];
            _this.cameraPoints = [];
            _this.projectedPoints = [];
            _this.labels = labels;

            // ["tfl", "tfr", "tbl", "tbr", "bfl", "bfr", "bbl", "bbr"]
            _this.editableIndices = [0, 1, 6];     // Fill with the indices of the corners that we want to be able to create

            _this.faces = [[0,1,3,2],[1,5,7,3],[0,1,5,4],[2,3,7,6],[0,2,6,4],[4,5,7,6]];
            // CONSTRUCT (Only the 3 main points)
            if (projectedPoints.length === 0) {
                for (var i=0; i < _this.editableIndices.length; i++) {
                    _this.points.push(null);
                    _this.cameraPoints.push([]);
                } 
            } else {
                for (var i=0; i < _this.editableIndices.length; i++) {
                    if (projectedPoints[_this.editableIndices[i]].length !==0) {
                        _this.points.push(new Point(projectedPoints[_this.editableIndices[i]]))
                        _this.cameraPoints.push(cameraPoints[_this.editableIndices[i]])
                    } else {
                        _this.points.push(null);
                        _this.cameraPoints.push([])
                    }
                }
                _this.projectedPoints = projectedPoints;
            }

            // OTHER FUNCTIONS
            _this.draw = function(context, color) {
                if (_this.principalPointsExist()) _this.drawFaces(context, color, false);               

                // Then draw the principal points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].draw(context, color);
                }

            }

            // For visualization, only lines will be drawn, no interaction at all will be done with any element
            _this.drawForVisualization = function(context, color) {
                _this.drawFaces(context, color, true);
            }

            _this.drawWithUID = function(context, color) {
                if (_this.principalPointsExist()) _this.drawFaces(context, color, false);

                // Then draw the principal points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].drawWithText(context, color, _this.uid);
                }
            }

            _this.drawWithLabel = function(context, color) {
                if (_this.principalPointsExist()) _this.drawFaces(context, color, false);

                // Then draw the principal points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].drawWithText(context, color, _this.labels[i]);
                }
            }


            // Calls to draw all the faces of the box
            _this.drawFaces = function(context, color, fill) {
                for (var i=0; i<_this.faces.length; i++) {
                    if (fill) _this.drawFaceAndFill(_this.faces[i], context, color);
                    else _this.drawFaceNoFill(_this.faces[i], context, color);
                }
            }

            _this.drawFaceNoFill = function(indices, context, color){
                context.beginPath();
                context.strokeStyle = color;
                context.lineWidth = 2;
                // Get the points we need
                points = [];

                for (var i=0; i<indices.length; i++) {
                    points.push(_this.projectedPoints[indices[i]])
                }

                // Draw the face
                for (var i=0; i<points.length; i++) {
                    if (i !== points.length - 1) {
                        context.moveTo(points[i][0], points[i][1])
                        context.lineTo(points[i + 1][0], points[i + 1][1])
                    } else {
                        context.moveTo(points[i][0], points[i][1])
                        context.lineTo(points[0][0], points[0][1])
                    }          
                }

                context.stroke()
                context.closePath();
            }

            _this.drawFaceAndFill = function(indices, context, color) {
                context.beginPath();
                context.strokeStyle = color;
                context.fillStyle = color;
                context.lineWidth = 2;
                // Get the points we need
                points = [];

                for (var i=0; i<indices.length; i++) {
                    points.push(_this.projectedPoints[indices[i]])
                }

                // Draw the face
                for (var i=0; i<points.length; i++) {
                    if (i !== points.length - 1) {
                        context.moveTo(points[i][0], points[i][1])
                        context.lineTo(points[i + 1][0], points[i + 1][1])
                    } else {
                        context.moveTo(points[i][0], points[i][1])
                        context.lineTo(points[0][0], points[0][1])
                    }          
                }

                context.stroke()
                context.fill()
                context.closePath();
            }
 
            _this.principalPointsExist = function() {
                if (_this.projectedPoints.length >= 8) {
                    return true;
                }
                return false;
            } 

            // We dont want to be able to edit a point this way, so the only option will be to delete and create a new one
            _this.isInside = function(x,y) {
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        if (_this.points[i].isInside(x,y)) {
                            return true;
                        }
                    }
                }

                return false;
            }

            _this.move = function(dx, dy, index) {
                if (index == -1) { // Move everything
                    for(var i=0; i<_this.points.length; i++) {
                        if (_this.points[i] !== null) _this.points[i].move(dx,dy);
                    }
                } else {
                    if (_this.points[index] == null) return;
                    _this.points[index].move(dx,dy);
                }       
            }

            _this.updateCameraPoints = function(dxCamera,dyCamera, index) {
                if (index == -1) {  // Update all the points
                    for(var i=0; i<_this.points.length; i++) {
                        if (_this.points[i] !== null) {
                            _this.cameraPoints[i][0] += dxCamera;
                            _this.cameraPoints[i][1] += dyCamera;
                        }
                    }
                } else {
                    _this.cameraPoints[index][0] += dxCamera;
                    _this.cameraPoints[index][1] += dyCamera;
                }
            }

            _this.removePoint = function(index) {
                delete _this.points[index];
                _this.points[index] = null;
                _this.cameraPoints[index] = [];
            }

            _this.getPointIndex = function(x, y) {
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        if (_this.points[i].isInside(x,y)) {
                            return i;
                        }
                    }
                }
            }
        }

        function CylinderAIK(uid, projectedPoints, cameraPoints, labels) {
            var _this = this;

            _this.uid = uid;
            _this.points = [];
            _this.cameraPoints = [];
            _this.projectedPoints = [];
            _this.labels = labels;
            
            // Fill the rest of the labels with empty strings for the non-editable points
            for(var i=0; i < 20;i++) {
                _this.labels.push("")
            }

            _this.editableIndices = [0, 1];     // Fill with the indices of the corners that we want to be able to create

            _this.faces = [[2,3,4,5,6,7,8,9,10,11],[12,13,14,15,16,17,18,19,20,21]];
            // console.log(projectedPoints)
            // CONSTRUCT (Only the 2 main points)
            if (projectedPoints.length === 0) {
                for (var i=0; i < _this.editableIndices.length; i++) {
                    _this.points.push(null);
                    _this.cameraPoints.push([]);
                } 
            } else {
                for (var i=0; i < _this.editableIndices.length; i++) {
                    if (projectedPoints[_this.editableIndices[i]].length !==0) {
                        _this.points.push(new Point(projectedPoints[_this.editableIndices[i]]))
                        _this.cameraPoints.push(cameraPoints[_this.editableIndices[i]])
                    } else {
                        _this.points.push(null);
                        _this.cameraPoints.push([])
                    }
                }
                _this.projectedPoints = projectedPoints;
            }

            // OTHER FUNCTIONS
            _this.draw = function(context, color) {
                if (_this.principalPointsExist()) _this.drawFaces(context, color);               

                // Then draw the principal points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].draw(context, color);
                }

                // Draw the line between the two principal points
                if (_this.points[0] !== null && _this.points[1] !== null) {
                    context.beginPath();
                    context.strokeStyle = color;
                    context.lineWidth = 2;
                    context.moveTo(_this.points[0][0], _this.points[0][1])
                    context.lineTo(_this.points[1][0], _this.points[1][1])
                    context.stroke()
                    context.closePath()
                }
            }

            // For visualization, only lines will be drawn, no interaction at all will be done with any element
            _this.drawForVisualization = function(context, color) {
                _this.drawFaces(context, color);
            }

            _this.drawWithUID = function(context, color) {
                if (_this.principalPointsExist()) _this.drawFaces(context, color);

                // Then draw the principal points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].drawWithText(context, color, _this.uid);
                }
            }

            _this.drawWithLabel = function(context, color) {
                if (_this.principalPointsExist()) _this.drawFaces(context, color);

                // Then draw the principal points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].drawWithText(context, color, _this.labels[i]);
                }
            }

            // Calls to draw all the faces of the box
            _this.drawFaces = function(context, color) {
                for (var i=0; i<_this.faces.length; i++) {
                    _this.drawFace(_this.faces[i], context, color);
                }
                _this.drawFacesConnections(context, color)
            }

            _this.drawFacesConnections = function(context, color) {
                context.beginPath();
                context.strokeStyle = color;
                context.lineWidth = 2;

                points_top = []
                points_bot = []

                for (var i=0; i<_this.faces[0].length; i++) {
                    points_top.push(_this.projectedPoints[_this.faces[0][i]])
                }

                for (var i=0; i<_this.faces[1].length; i++) {
                    points_bot.push(_this.projectedPoints[_this.faces[1][i]])
                }

                for(var i=0; i<_this.faces[0].length; i++) {
                    context.moveTo(points_top[i][0], points_top[i][1])
                    context.lineTo(points_bot[i][0], points_bot[i][1])
                }

                context.stroke()
                context.closePath()
            }

            _this.drawFace = function(indices, context, color){
                context.beginPath();
                context.strokeStyle = color;
                context.lineWidth = 2;
                // Get the points we need
                points = [];

                for (var i=0; i<indices.length; i++) {
                    points.push(_this.projectedPoints[indices[i]])
                }

                // Draw the face
                for (var i=0; i<points.length; i++) {
                    if (i !== points.length - 1) {
                        context.moveTo(points[i][0], points[i][1])
                        context.lineTo(points[i + 1][0], points[i + 1][1])
                    } else {
                        context.moveTo(points[i][0], points[i][1])
                        context.lineTo(points[0][0], points[0][1])
                    }          
                }

                context.stroke()
                context.closePath();
            }
 
            _this.principalPointsExist = function() {
                if (_this.projectedPoints.length >= 22) {
                    return true;
                }
                return false;
            } 

            // We dont want to be able to edit a point this way, so the only option will be to delete and create a new one
            _this.isInside = function(x,y) {
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        if (_this.points[i].isInside(x,y)) {
                            return true;
                        }
                    }
                }

                return false;
            }

            _this.move = function(dx, dy, index) {
                if (index == -1) { // Move everything
                    for(var i=0; i<_this.points.length; i++) {
                        if (_this.points[i] !== null) _this.points[i].move(dx,dy);
                    }
                } else {
                    if (_this.points[index] == null) return;
                    _this.points[index].move(dx,dy);
                }       
            }

            _this.updateCameraPoints = function(dxCamera,dyCamera, index) {
                if (index == -1) {  // Update all the points
                    for(var i=0; i<_this.points.length; i++) {
                        if (_this.points[i] !== null) {
                            _this.cameraPoints[i][0] += dxCamera;
                            _this.cameraPoints[i][1] += dyCamera;
                        }
                    }
                } else {
                    _this.cameraPoints[index][0] += dxCamera;
                    _this.cameraPoints[index][1] += dyCamera;
                }
            }

            _this.removePoint = function(index) {
                delete _this.points[index];
                _this.points[index] = null;
                _this.cameraPoints[index] = [];
            }

            _this.getPointIndex = function(x, y) {
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        if (_this.points[i].isInside(x,y)) {
                            return i;
                        }
                    }
                }
            }
        }

        function PersonAIK(uid, projectedPoints, cameraPoints, labels) {
            var _this = this;

            _this.uid = uid;
            _this.points = [];
            _this.cameraPoints = [];
            _this.labels = labels;

            // CONSTRUCTOR
            if (projectedPoints.length !== 0) {
                _this.points = [new Point(projectedPoints[0])];
                _this.cameraPoints = cameraPoints;
            } else {
                _this.points = [null];
                _this.cameraPoints = [[]];
            }

            // OTHER FUNCTIONS
            _this.draw = function(context, color) {
                if (_this.points[0] === null) return;
                _this.points[0].draw(context, color);          
            }

            _this.drawWithUID = function(context, color) {
                if (_this.points[0] === null) return;
                _this.points[0].drawWithText(context, color, _this.uid); 
            }

            _this.drawWithLabel = function(context, color) {
                if (_this.points[0] === null) return;
                _this.points[0].drawWithText(context, color, _this.labels[0]);     
            }

            _this.isInside = function(x,y) {
                if (_this.points[0] === null) return false;

                return _this.points[0].isInside(x,y);
            }

            _this.move = function(dx, dy, index) {
                if (index == -1) { // Move everything
                    for(var i=0; i<_this.points.length; i++) {
                        if (_this.points[i] !== null) _this.points[i].move(dx,dy);
                    }
                } else {
                    if (_this.points[index] == null) return;
                    _this.points[index].move(dx,dy);
                }       
            }

            _this.drawObjectActions = function(context, color) {
                if (_this.points[0] === null) return;
                // Get actions for current frame
                var actions = angular.copy($scope.actionManager.actionsForVisualization[_this.uid][$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom]);

                if (actions.length > 0) _this.drawActions(context, color, actions);
            }

            _this.drawActions = function(context, color, actions) {
                // First get width and height of the bounding rectangle
                context.beginPath();
                context.font = $scope.optionsManager.options.fontSize.toString() + "px sans-serif";
                var maxWidth = context.measureText(actions[0]).width;
                for (var i=0; i < actions.length; i++) {
                    var currentWidth = context.measureText(actions[i]).width;
                    if (currentWidth > maxWidth) maxWidth = currentWidth;
                }

                var maxHeight = actions.length * $scope.optionsManager.options.fontSize;

                context.closePath();
                context.beginPath();
                context.fillStyle = color;
                context.fillRect(_this.points[0].center[0] - maxWidth / 2.0, _this.points[0].center[1] + $scope.optionsManager.options.pointSize / 2.0, maxWidth, maxHeight);
                context.closePath();
                context.beginPath();
                context.font = $scope.optionsManager.options.fontSize.toString() + "px sans-serif";
                context.textAlign = "start";
                context.textBaseline = "top";
                context.strokeStyle = "black";
                context.lineWidth = 2;
                context.fillStyle = "white";
                var offsetY = 0.5;
                for(var i=0; i<actions.length; i++) {
                    context.strokeText(actions[i].toString(), _this.points[0].center[0] - maxWidth / 2.0, _this.points[0].center[1] + $scope.optionsManager.options.pointSize / 2.0 + offsetY);
                    context.fillText(actions[i].toString(), _this.points[0].center[0] - maxWidth / 2.0, _this.points[0].center[1] + $scope.optionsManager.options.pointSize / 2.0 + offsetY);
                    offsetY += $scope.optionsManager.options.fontSize;
                }
                context.closePath();
            }

            _this.updateCameraPoints = function(dxCamera,dyCamera, index) {
                if (index == -1) {  // Update all the points
                    for(var i=0; i<_this.points.length; i++) {
                        if (_this.points[i] !== null) {
                            _this.cameraPoints[i][0] += dxCamera;
                            _this.cameraPoints[i][1] += dyCamera;
                        }
                    }
                } else {
                    _this.cameraPoints[index][0] += dxCamera;
                    _this.cameraPoints[index][1] += dyCamera;
                }
            }

            _this.removePoint = function(index) {
                _this.points[index] = null;
                _this.cameraPoints[index] = [];
            }

            _this.getPointIndex = function(x, y) {
                if (_this.points[0].isInside(x,y)) return 0;
            }
        }

        function BBox (uid, projectedPoints, cameraPoints, labels) {
            var _this = this;

            _this.labels = labels;
            _this.uid = uid;
            _this.points = [];
            _this.cameraPoints = [];

            // CONSTRUCTOR
            if (projectedPoints.length != 0) {
                for (var i = 0; i < projectedPoints.length; i++) {
                    if (projectedPoints[i].length !== 0) {
                        _this.points.push(new Point(projectedPoints[i]));
                    } else _this.points.push(null);
                }
                _this.cameraPoints = cameraPoints;
            } else {
                _this.points = [null, null];
                _this.cameraPoints = [[],[]];
            }

            _this.draw = function(context, color) {
                if (_this.points[0] === null || _this.points[1] === null) return;
                _this.points[0].draw(context, color);
                _this.points[1].draw(context, color);
                context.beginPath();
                context.strokeStyle = color;
                context.lineWidth = 3;
                context.rect(_this.points[0].center[0], _this.points[0].center[1], Math.abs(_this.points[0].center[0] - _this.points[1].center[0]), Math.abs(_this.points[0].center[1] - _this.points[1].center[1]));
                context.stroke();
                context.closePath();
            }

            _this.drawWithUID = function(context, color) {
                if (_this.points[0] === null || _this.points[1] === null) return;
                _this.points[0].draw(context, color);
                _this.points[1].draw(context, color);
                context.beginPath();
                context.strokeStyle = color;
                context.lineWidth = 3;
                context.rect(_this.points[0].center[0], _this.points[0].center[1], Math.abs(_this.points[0].center[0] - _this.points[1].center[0]), Math.abs(_this.points[0].center[1] - _this.points[1].center[1]));
                context.stroke();
                context.closePath();
                context.beginPath();
                context.rect(_this.points[0].center[0] - 1, _this.points[0].center[1], 40, -20);
                context.fillStyle = color;
                context.fill();
                context.closePath();
                context.beginPath();
                context.font = "12px sans-serif";
                context.strokeStyle = "black";
                context.lineWidth = 3;
                context.strokeText(_this.uid.toString(), _this.points[0].center[0] + 3, _this.points[0].center[1] - 9);
                context.fillStyle = "white";
                context.fillText(_this.uid.toString(), _this.points[0].center[0] + 3, _this.points[0].center[1] - 9);
                context.fill();
                context.closePath();
            }

            _this.drawWithLabel = function(context, color) {
                if (_this.points[0] === null || _this.points[1] === null) return;
                _this.points[0].draw(context, color);
                _this.points[1].draw(context, color);
                context.beginPath();
                context.strokeStyle = color;
                context.lineWidth = 3;
                context.rect(_this.points[0].center[0], _this.points[0].center[1], Math.abs(_this.points[0].center[0] - _this.points[1].center[0]), Math.abs(_this.points[0].center[1] - _this.points[1].center[1]));
                context.stroke();
                context.closePath();
                context.beginPath();
                context.rect(_this.points[0].center[0] - 1, _this.points[0].center[1], 40, -20);
                context.fillStyle = color;
                context.fill();
                context.closePath();
                context.beginPath();
                context.font = "12px sans-serif";
                context.strokeStyle = "black";
                context.lineWidth = 3;
                context.strokeText(_this.labels[0], _this.points[0].center[0] + 3, _this.points[0].center[1] - 9);
                context.fillStyle = "white";
                context.fillText(_this.labels[0], _this.points[0].center[0] + 3, _this.points[0].center[1] - 9);
                context.fill();
                context.closePath();
            }

            _this.isInside = function(x,y) {
                if (_this.points[0] === null || _this.points[1] === null) return false;

                if (x >= _this.points[0].center[0] && x <= _this.points[1].center[0] && y >= _this.points[0].center[1] && y <= _this.points[1].center[1] || (_this.points[0].isInside(x,y) || _this.points[1].isInside(x,y))) {
                    return true;
                }
                return false;
            }

            // Function to move the whole box
            _this.move = function(dx,dy, index) {
                if (index == -1) {  // Move everything
                    // if (_this.points[0] === null || _this.points[1] === null) return;
                    _this.points[0].move(dx,dy);
                    _this.points[1].move(dx,dy);
                } else {
                    _this.points[index].move(dx,dy);
                }  
            }

            // Updates the camera coordinates of the points
            _this.updateCameraPoints = function(dxCamera,dyCamera, index) {
                if (index == -1) {
                    _this.cameraPoints[0][0] += dxCamera;
                    _this.cameraPoints[0][1] += dyCamera;
                    _this.cameraPoints[1][0] += dxCamera;
                    _this.cameraPoints[1][1] += dyCamera;
                } else {
                    _this.cameraPoints[index][0] += dxCamera;
                    _this.cameraPoints[index][1] += dyCamera;
                }
            }

            _this.removePoint = function(index) {
                _this.points = [null, null];
                _this.cameraPoints = [[],[]];
            }

            _this.getPointIndex = function(x, y) {
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i].isInside(x,y)) return i;
                }
                return -1;
            }
        }

        function Person (uid, projectedPoints, cameraPoints, labels, visibilities) {
            var _this = this;

            _this.labels = labels; 
            _this.uid = uid;
            _this.points = [];
            _this.cameraPoints = [];
            _this.visibilities = [];

            // CONSTRUCT
            _this.visibilities = visibilities;

            if (projectedPoints.length !== 0) {
                for (var i = 0; i < projectedPoints.length; i++) {
                    if (projectedPoints[i].length !== 0) {
                        if (cameraPoints[i][0] < 0 && cameraPoints[i][1] < 0) {
                            _this.points.push(null);
                        } else {
                            _this.points.push(new Point(projectedPoints[i]));
                        }
                    } else _this.points.push(null);
                }
                _this.cameraPoints = cameraPoints;    
            } else {
                for (var i = 0; i < _this.labels.length; i++) {
                    _this.points.push(null);
                    _this.cameraPoints.push([]);
                }
            }


            _this.draw = function(context, color) {
                var lightColor = "#BDBBC9";
                var lightColorSelected = "#FFB37D";
                
                // If the option is active, draw only the selected point and return
                if ($scope.optionsManager.options.showSelectedPointOnly) {
                    if (_this.points[$scope.keypointEditor.selectedLabel] !== null){
                        if (_this.visibilities[$scope.keypointEditor.selectedLabel] == 0) _this.points[$scope.keypointEditor.selectedLabel].draw(context, lightColorSelected);
                        else _this.points[$scope.keypointEditor.selectedLabel].draw(context, "#FF8F3D");
                    } 
                    return
                }
                
                // Draw edges
                _this.drawEdges(context, color);
                
                // Draw points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        if (_this.visibilities[i] == 0) _this.points[i].draw(context, lightColor);
                        else _this.points[i].draw(context, color);
                    }
                }
                // Lastly draw the selected point, to be on top of the rest
                if (_this.points[$scope.keypointEditor.selectedLabel] !== null){
                    if (_this.visibilities[$scope.keypointEditor.selectedLabel] == 0) _this.points[$scope.keypointEditor.selectedLabel].draw(context, lightColorSelected);
                    else _this.points[$scope.keypointEditor.selectedLabel].draw(context, "#FF8F3D");
                } 
            }

            // Draws all the edges
            _this.drawEdges = function(context, color) {
                _this.drawEdge(context, color, _this.points[0], _this.points[1]);   // Nose -> Neck
                _this.drawEdge(context, color, _this.points[0], _this.points[2]);   // Nose -> Head
                _this.drawEdge(context, color, _this.points[1], _this.points[3]);   // Neck -> Left Shoulder
                _this.drawEdge(context, color, _this.points[1], _this.points[4]);   // Neck -> Right Shoulder
                _this.drawEdge(context, color, _this.points[3], _this.points[5]);   // Left Shoulder -> Left Elbow
                _this.drawEdge(context, color, _this.points[5], _this.points[7]);   // Left Elbow - > Left Wrist
                _this.drawEdge(context, color, _this.points[4], _this.points[6]);   // Right Shoulder -> Right Elbow
                _this.drawEdge(context, color, _this.points[6], _this.points[8]);   // Right Elbow -> Right Wirst
                _this.drawEdge(context, color, _this.points[3], _this.points[9]);   // Left Shoulder -> Left Hip
                _this.drawEdge(context, color, _this.points[4], _this.points[10]);  // Right Shoulder -> Right Hip
                _this.drawEdge(context, color, _this.points[9], _this.points[11]);  // Left Hip -> Left Knee
                _this.drawEdge(context, color, _this.points[11], _this.points[13]); // Left Knee -> Left Ankle
                _this.drawEdge(context, color, _this.points[10], _this.points[12]); // Right Hip -> Right Knee
                _this.drawEdge(context, color, _this.points[12], _this.points[14]); // Right Knee -> Right Ankle
            }

            // Draw an edge between two points
            _this.drawEdge = function(context, color, point1, point2) {
                if (point1 == null || point2 == null) return;

                context.beginPath();
                context.moveTo(point1.center[0], point1.center[1]);
                context.lineTo(point2.center[0], point2.center[1]);
                context.strokeStyle = color;
                context.lineWidth = 2;
                context.stroke();
                context.closePath();
            }

            _this.drawWithUID = function(context, color) {
                var lightColor = "#BDBBC9";

                // Draw all the edges
                _this.drawEdges(context, color);

                // Draw all points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null && _this.visibilities[i] == 0) _this.points[i].drawWithOutlineAndText(context, lightColor, color, _this.uid);
                    else if (_this.points[i] !== null) _this.points[i].drawWithText(context, color, _this.uid);
                }
            }

            _this.drawWithLabel = function(context, color) {
                var lightColor = "#BDBBC9";
                var lightColorSelected = "#FFB37D";

                // If the option is active, draw only the selected point and return
                if ($scope.optionsManager.options.showSelectedPointOnly) {
                    if (_this.points[$scope.keypointEditor.selectedLabel] !== null){
                        if (_this.visibilities[$scope.keypointEditor.selectedLabel] == 0) _this.points[$scope.keypointEditor.selectedLabel].drawWithOutlineAndText(context, lightColorSelected, color, _this.labels[$scope.keypointEditor.selectedLabel]);
                        else _this.points[$scope.keypointEditor.selectedLabel].drawWithOutlineAndText(context, "#FF8F3D", color, _this.labels[$scope.keypointEditor.selectedLabel]);
                    }
                    return
                }

                // Draw edges
                _this.drawEdges(context, color);

                // Draw points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        if (_this.visibilities[i] == 0) _this.points[i].drawWithText(context, lightColor, _this.labels[i]);
                        else _this.points[i].drawWithText(context, color, _this.labels[i]);
                    }
                }
                // Lastly draw the selected point, to be on top of the rest
                if (_this.points[$scope.keypointEditor.selectedLabel] !== null){
                    if (_this.visibilities[$scope.keypointEditor.selectedLabel] == 0) _this.points[$scope.keypointEditor.selectedLabel].drawWithOutlineAndText(context, lightColorSelected, color, _this.labels[$scope.keypointEditor.selectedLabel]);
                    else _this.points[$scope.keypointEditor.selectedLabel].drawWithOutlineAndText(context, "#FF8F3D", color, _this.labels[$scope.keypointEditor.selectedLabel]);
                } 
            }

            _this.isInside = function(x,y) {
                // Let only the selected label to be moved
                if (_this.points[$scope.keypointEditor.selectedLabel] !== null && _this.points[$scope.keypointEditor.selectedLabel].isInside(x,y)) return true;
                return false;
            }

            _this.move = function(dx, dy, index) {
                if (index == -1) {
                    for(var i=0; i<_this.points.length; i++) {
                        if (_this.points[i] !== null) _this.points[i].move(dx,dy);
                    }
                } else {
                    if (_this.points[index] == null) return;
                    _this.points[index].move(dx,dy);
                }        
            }

            _this.updateCameraPoints = function(dxCamera,dyCamera, index) {
                if (index == -1) {
                    for (var i=0; i<_this.points.length; i++) {
                        if (_this.points[i] !== null) {
                            _this.cameraPoints[i][0] += dxCamera;
                            _this.cameraPoints[i][1] += dyCamera;
                        }
                    }  
                } else {
                    _this.cameraPoints[index][0] += dxCamera;
                    _this.cameraPoints[index][1] += dyCamera;
                }     
            }

            _this.removePoint = function(index) {
                delete _this.points[index];
                _this.points[index] = null;
                _this.cameraPoints[index] = [];
            }

            _this.getPointIndex = function(x, y) {
                return $scope.keypointEditor.selectedLabel;
                // for (var i = 0; i < _this.points.length; i++) {
                //     if (_this.points[i] !== null) {
                //         if (_this.points[i].isInside(x,y)) {
                //             return i;
                //         }
                //     }
                // }
            }
        }

        // Polygon type for ignore regions
        function IgnoreRegion(uid, projectedPoints, cameraPoints) {
            var _this = this;

            _this.labels = []; 
            _this.uid = uid;
            _this.points = [];
            _this.cameraPoints = [];

            // CONSTRUCT
            if (projectedPoints.length !== 0) {
                for (var i = 0; i < projectedPoints.length; i++) {
                    if (projectedPoints[i].length !== 0) {
                        _this.points.push(new Point(projectedPoints[i]));
                    } else _this.points.push(null);
                }
                _this.cameraPoints = cameraPoints;    
            } else {
                for (var i = 0; i < _this.labels.length; i++) {
                    _this.points.push(null);
                    _this.cameraPoints.push([]);
                }
            }

            // Fill labels
            for (var i=0; i< _this.points.length; i++) {
                _this.labels.push(i);
            }

            // FUNCTIONS
            _this.draw  = function(context, color) {
                // Draw the path and fill it with a color with reduced alpha
                if (_this.points.length > 2) _this.drawPath(context, color);

                // Draw the points
                for (var i=0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].drawWithOutlineAndText(context, color, "black", i);                    
                }
                
                if ($scope.keypointEditor.editorActive) {
                    if (_this.points[$scope.keypointEditor.selectedLabel] !== null && _this.points[$scope.keypointEditor.selectedLabel] !== undefined) {
                        _this.points[$scope.keypointEditor.selectedLabel].drawWithOutlineAndText(context, "#FF8F3D", "black", $scope.keypointEditor.selectedLabel);
                    }
                }   
            }

            _this.drawForVisualization = function(context, color) {
                if (_this.points.length > 2) _this.drawPath(context, color);
            }

            _this.drawWithUID = function(context, color) {
                // Draw the path and fill it with a color with reduced alpha
                if (_this.points.length > 2) _this.drawPath(context, color);

                // Draw the points
                for (var i=0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].drawWithOutlineAndText(context, color, "black", _this.uid);                    
                }
                
                if ($scope.keypointEditor.editorActive) {
                    if (_this.points[$scope.keypointEditor.selectedLabel] !== null && _this.points[$scope.keypointEditor.selectedLabel] !== undefined) {
                        _this.points[$scope.keypointEditor.selectedLabel].drawWithOutlineAndText(context, "#FF8F3D", "black", $scope.keypointEditor.selectedLabel);
                    }
                }  
            }

            _this.drawWithLabel = function(context, color) {
                _this.draw(context, color)
            }

            _this.drawPath = function(context, color) {
                var notNullIndices = _this.getNotNullIndices();
                if (notNullIndices.length <= 0) return;

                var lightColor = $scope.colorManager.updateColorLight(color);

                context.fillStyle = lightColor;
                context.strokeStyle = color;

                context.beginPath();
            
                context.moveTo(_this.points[notNullIndices[0]].center[0], _this.points[notNullIndices[0]].center[1])
                
                for (var i=0; i < notNullIndices.length; i++) {
                    var index = notNullIndices[i];
                    if (_this.points[index] !== null) {
                        if (i !== notNullIndices.length - 1) {
                            var nextIndex = notNullIndices[i + 1]
                            if (_this.points[nextIndex] !== null) {
                                context.lineTo(_this.points[nextIndex].center[0], _this.points[nextIndex].center[1])
                            }      
                        } else {
                            if (_this.points[notNullIndices[0]] !== null) {
                                context.lineTo(_this.points[notNullIndices[0]].center[0], _this.points[notNullIndices[0]].center[1])
                            } 
                        }
                    }
                }
                context.stroke();
                context.fillStyle= $scope.colorManager.makeTransparent(color);
                context.fill();
                context.closePath();
            }

            _this.getNotNullIndices = function() {
                var notNullIndices = [];
                for (var i=0; i< _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        notNullIndices.push(i);
                    }
                }
                return notNullIndices;
            }

            _this.isInside = function(x,y) {
                // Check if it is inside a point
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        if (_this.points[i].isInside(x,y)) {
                            return true;
                        }
                    }
                }
                
                // If not, return false
                return false;
            }


            _this.move = function(dx, dy, index) {
                if (index == -1) { // Move everything
                    for(var i=0; i<_this.points.length; i++) {
                        if (_this.points[i] !== null) _this.points[i].move(dx,dy);
                    }
                } else {
                    if (_this.points[index] == null) return;
                    _this.points[index].move(dx,dy);
                }       
            }

            _this.updateCameraPoints = function(dxCamera,dyCamera, index) {
                if (index == -1) {  // Update all the points
                    for(var i=0; i<_this.points.length; i++) {
                        if (_this.points[i] !== null) {
                            _this.cameraPoints[i][0] += dxCamera;
                            _this.cameraPoints[i][1] += dyCamera;
                        }
                    }
                } else {
                    _this.cameraPoints[index][0] += dxCamera;
                    _this.cameraPoints[index][1] += dyCamera;
                }
            }

            _this.removePoint = function(index) {
                _this.points[index] = null;
                _this.cameraPoints[index] = [];
            }

            _this.getPointIndex = function(x, y) {
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) {
                        if (_this.points[i].isInside(x,y)) return i;
                    }    
                }
                return -1;
            }     
        }

        // Basic point
        function Point(projectedCenter) {
            var _this = this;

            _this.center = projectedCenter;

            _this.draw = function(context, color) {
                context.beginPath();
                context.arc(_this.center[0], _this.center[1], $scope.optionsManager.options.pointSize, 0, 2 * Math.PI, false);
                context.fillStyle = color;
                context.fill();
                context.closePath();
            }

            _this.drawWithText = function(context, color, text) {
                context.beginPath();
                context.arc(_this.center[0], _this.center[1], $scope.optionsManager.options.pointSize, 0, 2 * Math.PI, false);
                context.fillStyle = color;
                context.fill();
                context.closePath();
                context.beginPath();
                context.font = $scope.optionsManager.options.fontSize.toString() + "px sans-serif";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.strokeStyle = "black";
                context.lineWidth = 3;
                context.strokeText(text.toString(), _this.center[0], _this.center[1]);
                context.fillStyle = "white";
                context.fillText(text.toString(), _this.center[0], _this.center[1]);
                context.fill();
                context.closePath();
            }

            _this.drawWithOutlineAndText = function(context, color, outlineColor, text) {
                context.beginPath();
                context.arc(_this.center[0], _this.center[1], $scope.optionsManager.options.pointSize, 0, 2 * Math.PI, false);
                context.strokeStyle = outlineColor;
                context.lineWidth = 3;
                context.fillStyle = color;
                context.stroke();
                context.fill();
                context.closePath();
                context.beginPath();
                context.font = $scope.optionsManager.options.fontSize.toString() + "px sans-serif";
                context.textAlign = "center";
                context.textBaseline = "middle";
                context.strokeStyle = "black";
                context.lineWidth = 3;
                context.strokeText(text.toString(), _this.center[0], _this.center[1]);
                context.fillStyle = "white";
                context.fillText(text.toString(), _this.center[0], _this.center[1]);
                context.fill();
                context.closePath();
            }

            _this.isInside = function(x,y) {
                var dx = _this.center[0] - x;
                var dy = _this.center[1] - y;
                var distance = Math.sqrt((dx * dx) + (dy * dy));
                if (distance <= $scope.optionsManager.options.pointSize) return true;
                return false;
            }

            _this.move = function(x,y) {
                _this.center[0] += x;
                _this.center[1] += y; 
            }
        }

        function CanvasZoomManager() {
            var _this = this;

            _this.canvasZoom = null;

            _this.isActive = function() {
                return _this.canvasZoom.active;
            }

            _this.toggle = function() {
                _this.canvasZoom.toggle()
            }

            _this.initialize = function() {
                var canvasZoom = document.getElementById('canvasZoom');
                _this.canvasZoom = new CanvasZoom(canvasZoom)
            }

            _this.update = function(image, mouseCoordinates, pageX, pageY, canvasWithImage, canvasNumber) {
                _this.canvasZoom.update(image, mouseCoordinates, pageX, pageY, canvasWithImage, canvasNumber)
            }


            _this.updateImage = function(image) {
                _this.canvasZoom.updateImage(image, true)
            }

            _this.isActiveOnMe = function(number) {
                if (number == _this.canvasZoom.activeOnCanvasNumber) return true
                return false
            }
        }

        function CanvasZoom(canvas) {
            var _this = this;

            _this.canvas = canvas
            _this.ctx = _this.canvas.getContext('2d')
            _this.image = null;
            _this.active = false;
            _this.ctx.scale(2,2);

            _this.activeOnCanvasNumber = 0

            _this.mouse = {
                x: null,
                y: null,
                pageX: null,
                pageY: null
            }
            // Scale of relation between image and canvas
            _this.scale = {
                x: 1,
                y: 1
            }

            _this.width = 200
            _this.height = 200

            _this.halfWidth = _this.width / 2.0
            _this.halfHeight = _this.height / 2.0

            _this.toggle = function() {
                _this.active = !_this.active;
            }

            // From camera frame to image frame
            _this.toImage = function(point) {
                var x = point[0] / _this.scale.x;
                var y = point[1] / _this.scale.y;
                return [x, y]
            }

            _this.updateMousePosition = function(mouseX, mouseY, pageX, pageY) {
                _this.mouse.x = mouseX;
                _this.mouse.y = mouseY;
                _this.mouse.pageX = pageX;
                _this.mouse.pageY = pageY;

                _this.canvas.style.top = _this.mouse.pageY - _this.halfHeight + 'px';
                _this.canvas.style.left = _this.mouse.pageX - _this.halfWidth + 'px';
                _this.canvas.style.display = "block"
            }

            _this.updateImage = function(image, canvasWithImage) {
                _this.image = new Image()
                _this.image.src = image.src
                _this.image.width = _this.width
                _this.image.height = _this.height


                _this.scale.x = _this.image.width / _this.canvas.width
                _this.scale.y = _this.image.height / _this.canvas.height

                if (canvasWithImage) _this.draw();
            }

            _this.update = function(image,mouseCoordinates, pageX, pageY, canvasWithImage, canvasNumber) {
                _this.activeOnCanvasNumber = canvasNumber
                //var goodCoords = _this.toImage(mouseCoordinates)
                _this.updateMousePosition(mouseCoordinates[0], mouseCoordinates[1], pageX, pageY);
                _this.updateImage(image, canvasWithImage);
            }

            _this.draw = function() {
                if (_this.active) {
                    _this.ctx.fillStyle = "white"
                    _this.ctx.fillRect(0,0, _this.canvas.width,_this.canvas.height)

                    if (!$scope.toolParameters.isPosetrack) {
                        _this.ctx.drawImage(_this.image, _this.mouse.x - (_this.canvas.width /4.0) + 25, _this.mouse.y - (_this.canvas.width /4.0) + 25, _this.image.width, _this.image.height, 0, 0, _this.canvas.width, _this.canvas.height)
                        _this.drawGuideLines(_this.ctx)
                    } else {
                        _this.ctx.drawImage(_this.image, _this.mouse.x - (_this.canvas.width /8.0) + 12.5, _this.mouse.y - (_this.canvas.width /8.0) + 12.5, _this.image.width/2.0, _this.image.height/2.0, 0, 0, _this.canvas.width, _this.canvas.height)
                        _this.drawGuideLines(_this.ctx)
                    }        
                } 
            }

            _this.drawGuideLines = function(context) {
                    context.save();
                    context.setLineDash([5, 5]);
                    // Draw horizontal line
                    context.beginPath();
                    context.strokeStyle = "rgba(255, 0, 0, 0.5)";
                    context.moveTo(_this.canvas.width / 4.0 - 1000, _this.canvas.height / 4.0);
                    context.lineTo(_this.canvas.width / 4.0 + 1000, _this.canvas.height / 4.0);
                    context.stroke();
                    context.closePath();
                    // Draw vertical line
                    context.beginPath();
                    context.strokeStyle = "rgba(255, 0, 0, 0.5)";
                    context.moveTo(_this.canvas.width / 4.0, _this.canvas.height / 4.0 - 1000);
                    context.lineTo(_this.canvas.width / 4.0, _this.canvas.height / 4.0 + 1000);
                    context.stroke();
                    context.closePath();
                    context.restore();
            }
        }

        function CanvasObject(canvas, number) {
            //----- SETUP -----//
            var _this = this;
            _this.canvas = canvas;

            _this.canvasNumber = number;
            _this.ctx = _this.canvas.getContext('2d')
            _this.image = null;
            _this.images = [];

            // Make it visually fill the positioned parent
            _this.canvas.style.width = '100%';
            _this.canvas.style.height = '100%';

            // ...then set the internal size to match
            _this.canvas.width = canvas.offsetWidth;
            _this.canvas.height = canvas.offsetHeight;

            // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
            // They will mess up mouse coordinates and _this fixes that
            _this.rect = _this.canvas.getBoundingClientRect();
            _this.rectX = _this.rect.x;
            _this.rectY = _this.rect.y;

            //----- STATE TRACKING -----//
            _this.activeCamera = null;
            _this.valid = true; // when set to true, the canvas will redraw everything
            _this.dragging = false; // Keep track of when we are dragging
            _this.selection = null; // Current selected object
            _this.creatingBox = false;

            //----- 2D Projections -----//
            _this.objects2D = {
                type: "",
                labels: [],
                objects: {}
            };

            // ----- Dragging parameters ----- //
            _this.objectDragIndex = null;
            _this.pointDragIndex = null;
            _this.draggingObject = false;

            _this.epilinesManager = [null,null,null,null];
            _this.colors = [
                "#f205e6", "#1c0365", "#14a9ad", "#4ca2f9", "#a4e43f", "#d298e2", "#6119d0",
                "#d2737d", "#c0a43c", "#f2510e", "#651be6", "#79806e", "#61da5e", "#cd2f00",
                "#9348af", "#01ac53", "#c5a4fb", "#996635", "#b11573", "#4bb473", "#75d89e",
                "#2f3f94", "#2f7b99", "#da967d", "#34891f", "#b0d87b", "#ca4751", "#7e50a8",
                "#c4d647", "#e0eeb8", "#11dec1", "#289812", "#566ca0", "#ffdbe1", "#2f1179",
                "#935b6d", "#916988", "#513d98", "#aead3a", "#9e6d71", "#4b5bdc", "#0cd36d",
                "#250662", "#cb5bea", "#228916", "#ac3e1b", "#df514a", "#539397", "#880977",
                "#f697c1", "#ba96ce", "#679c9d", "#c6c42c", "#5d2c52", "#48b41b", "#e1cf3b",
                "#5be4f0", "#57c4d8", "#a4d17a", "#225bc8", "#be608b", "#96b00c", "#088baf",
                "#f158bf", "#e145ba", "#ee91e3", "#05d371", "#5426e0", "#4834d0", "#802234",
                "#6749e8", "#0971f0", "#8fb413", "#b2b4f0", "#c3c89d", "#c9a941", "#41d158",
                "#fb21a3", "#51aed9", "#5bb32d", "#807fcb", "#21538e", "#89d534", "#d36647",
                "#7fb411", "#0023b8", "#3b8c2a", "#986b53", "#f50422", "#983f7a", "#ea24a3",
                "#79352c", "#521250", "#c79ed2", "#d6dd92", "#e33e52", "#b2be57", "#fa06ec",
                "#1bb699", "#6b2e5f", "#64820f", "#1c27c1", "#21538e", "#89d534", "#d36647"
            ];
            _this.colorIndex = 0;

            // Scale of relation between image and canvas
            _this.scale = {
                x: 1,
                y: 1
            }

            _this.zoomScale = 1;

            // Mouse variable
            _this.mouse = {
                pos: { x: 0, y: 0 },
                worldPos: { x: 0, y: 0 },
                posLast: { x: 0, y: 0 },
                dragPos: { x: 0, y: 0 },
                dragging: false,
                inside: false
            }

            // View transform
            _this.m = [1, 0, 0, 1, 0, 0]; // Current view transform
            _this.im = [1, 0, 0, 1, 0, 0]; // Current inverse view transform
            _this.bounds = {
                top: 0,
                left: 0,
                right: _this.canvas.width,
                bottom: _this.canvas.height
            }
            _this.pos = { x: 0, y: 0 }; // Initial position
            _this.wp1 = { x: 0, y: 0 };
            _this.wp2 = { x: 0, y: 0 };
            _this.dirty = true;

            // To keep track of the zoom
            _this.zoom = 1;
            _this.maxZoom = 4;
            _this.minZoom = 1;

            //----- OPTIONS -----//
            _this.select
            ionColor = "#CC0000";
            _this.selectionWidth = 2;
            setInterval(function() {
                _this.draw();
            }, 100); // Redraw function

            //----- EVENTS -----//
            // Prevents clicking of selecting text
            canvas.addEventListener('selectstart', function(e) {
                e.preventDefault();
                return false;
            }, false);

            canvas.addEventListener('mouseout', function(e) {
                _this.mouse.inside = false;
                _this.setRedraw();
            }, false)

            // MouseDown event
            canvas.addEventListener('mousedown', function(e) {
                var mouse = _this.getMouse(e);
                _this.mouse.pos.x = mouse.x;
                _this.mouse.pos.y = mouse.y;

                // If we are creating points
                if ($scope.toolsManager.subTool.localeCompare('pointCreation') == 0) {
                    // If there is no point placed there yet
                    if ($scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].points[$scope.keypointEditor.keypointEditorData.indexBeingEdited] === null){
                        $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].points[$scope.keypointEditor.keypointEditorData.indexBeingEdited] = new Point([_this.mouse.pos.x, _this.mouse.pos.y]); 
                        $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].cameraPoints[$scope.keypointEditor.keypointEditorData.indexBeingEdited] = _this.toCamera([_this.mouse.pos.x, _this.mouse.pos.y]);   
                        if (!$scope.toolParameters.isPosetrack) $scope.keypointEditor.getEpilines();
                        if ($scope.objectManager.isTypeSelected("person")) $scope.toolsManager.switchSubTool(""); // In the case of creating persons this will be useful
                        _this.setRedraw();
                    }
                }

                // If we are creating boxes
                if ($scope.toolsManager.subTool.localeCompare('boxCreation') == 0) {
                    if ($scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].points[0] === null) {
                        $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].points[0] = new Point([_this.mouse.pos.x, _this.mouse.pos.y]);
                        $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].cameraPoints[0] = _this.toCamera([_this.mouse.pos.x, _this.mouse.pos.y]);
                        $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].points[1] = new Point([_this.mouse.pos.x, _this.mouse.pos.y]);
                        $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].cameraPoints[1] = _this.toCamera([_this.mouse.pos.x, _this.mouse.pos.y]);
                        _this.draggingObject = true;
                        _this.pointDragIndex = 1;
                        _this.mouse.dragPos.x = _this.mouse.pos.x;
                        _this.mouse.dragPos.y = _this.mouse.pos.y;
                        _this.setRedraw(); 
                    }
                }

                // If we are moving the objects around
                if ($scope.objectManager.selectedObject !== null && !_this.draggingObject) {
                    if ($scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].isInside(_this.mouse.pos.x, _this.mouse.pos.y)) {
                        _this.pointDragIndex = $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].getPointIndex(_this.mouse.pos.x, _this.mouse.pos.y);
                        _this.draggingObject = true;
                        _this.mouse.dragPos.x = _this.mouse.pos.x;
                        _this.mouse.dragPos.y = _this.mouse.pos.y;

                        // TODO: Frontend doesnt refresh fast enough, check this
                        $scope.keypointEditor.keypointEditorData.modified = true;
                    }
                }
            }, true);

            // MouseMove event
            canvas.addEventListener('mousemove', function(e) {
                var mouse = _this.getMouse(e);
                _this.mouse.inside = true;
                _this.mouse.pos.x = mouse.x;
                _this.mouse.pos.y = mouse.y;

                // Update the zoom
                if (_this.hasActiveCamera()) {
                    var coordinates = _this.toCamera([mouse.x, mouse.y])
                    $scope.canvasZoomManager.update(_this.images[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom], coordinates, mouse.pageX, mouse.pageY, _this.hasActiveCamera(), _this.canvasNumber);
                } 

                if (_this.dragging) {
                    _this.mouse.posLast.x = _this.mouse.pos.x;
                    _this.mouse.posLast.y = _this.mouse.pos.y;

                    _this.move(_this.mouse.pos.x - _this.mouse.posLast.x, _this.mouse.pos.y - _this.mouse.posLast.y);
                }

                if (_this.draggingObject) {
                    var dx = _this.mouse.pos.x - _this.mouse.dragPos.x;
                    var dy = _this.mouse.pos.y - _this.mouse.dragPos.y;
                    var cameraMouse = _this.toCamera([_this.mouse.pos.x, _this.mouse.pos.y]);
                    var cameraDrag = _this.toCamera([_this.mouse.dragPos.x, _this.mouse.dragPos.y])
                    if (!$scope.keypointEditor.moveWholeShape) {
                        $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].move(dx, dy, _this.pointDragIndex);
                        $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].updateCameraPoints(cameraMouse[0] - cameraDrag[0], cameraMouse[1] - cameraDrag[1], _this.pointDragIndex);    
                    } else {
                        $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].move(dx, dy, -1);
                        $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].updateCameraPoints(cameraMouse[0] - cameraDrag[0], cameraMouse[1] - cameraDrag[1], -1);
                    }
                    _this.mouse.dragPos.x = _this.mouse.pos.x;
                    _this.mouse.dragPos.y = _this.mouse.pos.y;
                    _this.setRedraw();
                }

                if ($scope.toolsManager.subTool.localeCompare("pointCreation") === 0 || $scope.toolsManager.subTool.localeCompare("boxCreation") === 0) {
                    _this.setRedraw();
                }

            }, true);

            // MouseUp event
            canvas.addEventListener('mouseup', function(e) {
                _this.dragging = false; // Stop dragging

                if (_this.draggingObject) {
                    _this.draggingObject = false;
                    if (!$scope.toolParameters.isPosetrack && $scope.toolsManager.subTool.localeCompare("pointCreation") === 0) {
                        $scope.keypointEditor.getEpilines();
                    }
                    if ($scope.toolsManager.subTool.localeCompare("boxCreation") === 0) {
                        $scope.toolsManager.switchSubTool("");
                    }
                }
                _this.setRedraw();

            }, true);

            canvas.addEventListener('mouseenter', function(e) {
                $scope.canvasesManager.setCanvasMouseOver(_this.canvasNumber - 1)

            }, true);

            //----- FUNCTIONS -----//
            // Fits the image to the canvas depending of the zoom

            _this.constraintZoom = function() {
                if (_this.zoom < _this.minZoom) _this.zoom = _this.minZoom;
                if (_this.zoom > _this.maxZoom) _this.zoom = _this.maxZoom;
            }

            // Move the context
            _this.move = function(x, y) {
                _this.pos.x += x;
                _this.pos.y += y;
                _this.setRedraw();
            }

            // Returns the coordinates of the mouse of the event e
            _this.getMouse = function(e) {
                var rect = _this.canvas.getBoundingClientRect();
                var mx = e.clientX - rect.left;
                var my = e.clientY - rect.top;

                return { x: mx, y: my, pageX: e.pageX, pageY: e.pageY};
            }

            // Function that set the flag to redraw to false
            _this.setRedraw = function() {
                _this.valid = false;
            }

            // Function that clears the context
            _this.clear = function() {
                _this.ctx.clearRect(0, 0, _this.canvas.width, _this.canvas.height);
            }

            // Function that redraws everything associated to the actual canvas
            _this.draw = function() {
                if (!_this.valid) {
                    _this.clear();
                    var ctx = _this.ctx;
                    var canvas = _this.canvas;

                    if (_this.hasActiveCamera()) {
                        ctx.save();

                         // Update the zoom
                        if ($scope.canvasZoomManager.isActiveOnMe(_this.canvasNumber)) $scope.canvasZoomManager.updateImage(_this.images[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom]);

                        //Redraw background first
                        ctx.drawImage(_this.images[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom], 0, 0, _this.images[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom].width, _this.images[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom].height, 0, 0, canvas.width, canvas.height)
                        
                        // Check what we have to draw
                        if (angular.equals(_this.objectsIn2D, {})) return; // Control to avoid errors while loading objects
                        if ($scope.objectManager.selectedObject === null && $scope.objectManager.selectedType.type !== undefined) {
                            var colorIndex = 0;
                            for (obj in _this.objects2D.objects) {
                                if (_this.objects2D.objects[obj.toString()].frames[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom].shape !== null) {
                                    _this.objects2D.objects[obj.toString()].frames[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom].shape.drawWithUID(ctx, _this.colors[colorIndex]);
                                    colorIndex++;
                                }
                            }

                            // Draw actions under the nose if the option is checked
                            if ($scope.optionsManager.options.visualizeActions) {
                                // Draw all actions for objects
                                var colorIndex = 0;
                                for (obj in _this.objects2D.objects) {
                                    if (_this.objects2D.objects[obj.toString()].frames[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom].shape !== null) {
                                        _this.objects2D.objects[obj.toString()].frames[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom].shape.drawObjectActions(ctx, _this.colors[colorIndex]);
                                        colorIndex++;
                                    }
                                }     
                            }
                        } else if ($scope.objectManager.selectedObject !== null) { // If there is one object selected, draw only its points
                            if ($scope.toolsManager.subTool.localeCompare("pointCreation") == 0) {
                                // If active, draw guide lines
                                if ($scope.optionsManager.options.showGuideLines) _this.drawGuideLines(ctx);
                                
                                // Draw epilines
                                _this.drawEpilines(ctx);
                                if ($scope.optionsManager.options.showLabels) {
                                    $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].drawWithLabel(ctx, "#24FF41");
                                } else {
                                    $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].draw(ctx, "#24FF41");
                                }
                                
                            } else if ($scope.toolsManager.subTool.localeCompare("boxCreation") == 0) {
                                // If active, draw guide lines
                                if ($scope.optionsManager.options.showGuideLines) _this.drawGuideLines(ctx);

                                if ($scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].points[0] !== null) {
                                    $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].drawWithLabel(ctx, "#01A2FF");
                                }

                            } else {
                                if ($scope.optionsManager.options.showLabels) {
                                    $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].drawWithLabel(ctx, "#24FF41");
                                } else {
                                    $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].draw(ctx, "#24FF41");
                                }
                                
                            }
                        }
                        
                        // Last thing, always draw the camera name in the top left corner of the canvas
                        _this.drawCameraName(_this.ctx);
                        ctx.restore();
                    }
                    // Set the camera to valid
                    _this.valid = true;
                }
            }

            // Draws epilines if they exist
            _this.drawEpilines = function(context) {
                for (var i = 0; i < _this.epilinesManager.length; i++) {
                    if (_this.epilinesManager[i] !== null && i !== (_this.canvasNumber - 1)) {
                        _this.epilinesManager[i].draw(context);
                    }
                }
            }
            _this.imagesLoaded = 0;
    
            // Initialization function
            _this.init = function() {
                if (_this.activeCamera !== null) {
                    _this.imagesLoaded = 0;

                    for (var i = 0; i < _this.activeCamera.frames.length; i++) {
                        var scale = {
                            x: 1,
                            y: 1
                        }
                        var canvas = _this.canvas;

                        var image = new Image();
                        image.onload = function() {
                            scale.x = image.width / canvas.width;
                            scale.y = image.height / canvas.height;
                            _this.imagesLoaded++;

                            if (_this.imagesLoaded >= $scope.toolParameters.numberOfFrames) {
                                $scope.canvasesManager.refreshProjectionOfCanvas(_this.canvasNumber - 1);
                                _this.imagesLoaded = 0;
                            }
                        };
                        image.src = _this.activeCamera.frames[i].image;
                        _this.scale = scale;
                        _this.images[i] = image;
                    }
                    
                    _this.setRedraw();
                }
            }

            // Generates the image of the given frame
            _this.createImage = function(frame) {
                var scale = {
                    x: 1,
                    y: 1
                }
                var image = new Image();
                image.onload = function() {
                    scale.x = image.width / canvas.width;
                    scale.y = image.height / canvas.height;
                    _this.setRedraw();
                };
                image.src = _this.activeCamera.frames[frame].image;
                _this.images[frame] = image;
                _this.scale = scale;
                _this.setRedraw();
            }

            // From image frame to camera frame
            _this.toCamera = function(point) {
                var x = point[0] * _this.scale.x / _this.zoom;
                var y = point[1] * _this.scale.y / _this.zoom;
                return [x, y]
            }

            // From camera frame to image frame
            _this.toImage = function(point) {
                var x = point[0] / _this.scale.x * _this.zoom;
                var y = point[1] / _this.scale.y * _this.zoom;
                return [x, y]
            }

            // Distance between two points
            _this.distance = function(p1, p2) {
                var a = p1[0] - p2[0]
                var b = p1[1] - p2[1]
                return Math.sqrt(a * a + b * b)
            }

             // Draws the camera name in the top left corner of the canvas
            _this.drawCameraName = function(context) {
                context.beginPath();
                context.font = "20px sans-serif";
                context.strokeStyle = "black";
                context.lineWidth = 3;
                context.strokeText(_this.activeCamera.filename, 20, 20);
                context.fillStyle = "white";
                context.fillText(_this.activeCamera.filename, 20, 20);
                context.fill();
                context.closePath();
            }

            // Draws guide lines to aid in the creation of bounding boxes
            _this.drawGuideLines = function(context) {
                if (_this.mouse.inside) {
                    context.save();
                    context.setLineDash([5, 5]);
                    // Draw horizontal line
                    context.beginPath();
                    context.strokeStyle = "rgba(255, 0, 0, 0.5)";
                    context.moveTo(_this.mouse.pos.x - 1000, _this.mouse.pos.y);
                    context.lineTo(_this.mouse.pos.x + 1000, _this.mouse.pos.y);
                    context.stroke();
                    context.closePath();
                    // Draw vertical line
                    context.beginPath();
                    context.strokeStyle = "rgba(255, 0, 0, 0.5)";
                    context.moveTo(_this.mouse.pos.x, _this.mouse.pos.y - 1000);
                    context.lineTo(_this.mouse.pos.x, _this.mouse.pos.y + 1000);
                    context.stroke();
                    context.closePath();
                    context.restore();
                }    
            }

            _this.prepareEpilineForFrontend = function(el) {
                return [el[0] / 2.0, el[1] / 2.0]
            }

            // Set Epiline
            _this.setEpiline = function(el1, el2, color, number) {
                // Create Epiline object
                _this.epilinesManager[number] = new Epiline(_this.toImage(_this.prepareEpilineForFrontend(el1)), _this.toImage(_this.prepareEpilineForFrontend(el2)), color);
                _this.setRedraw();

            }

            // Reset Epiline
            _this.resetEpiline = function(number) {
                delete _this.epilinesManager[number];
                _this.epilinesManager[number] = null;

            }

            // Reset epilines
            _this.resetEpilines = function() {
                for (var i =0; i < _this.epilinesManager.length; i++) {
                    _this.resetEpiline(i);
                }
            }

            // Switches the active camera of the Canvas for "camera"
            _this.setCamera = function(camera) {
                _this.scaleLoaded = false;
                if (_this.activeCamera !== null) {
                    // If there was already a video there, move it back to the loadedCameras array
                    $scope.camerasManager.loadedCameras.push(_this.activeCamera);
                }

                // Set the new camera
                _this.activeCamera = camera;

                _this.images = [];
                for (var i = 0; i < $scope.toolParameters.numberOfFrames; i++) {
                    _this.images.push(null);
                }

                _this.init();
                

                // Project the objects to visualize them if the objects are in 3D
                if (!$scope.toolParameters.isPosetrack) {
                    _this.projectObjects();
                } else { // If we are in 2D already, no need to project them
                    _this.updateObjects();
                }

                // Set the flag to redraw
                _this.setRedraw();
            }

            _this.removeCamera = function() {
                if (_this.activeCamera !== null) {
                    $scope.camerasManager.loadedCameras.push(_this.activeCamera);
                    _this.activeCamera = null;
                    _this.setRedraw();
                }
            }

            // Projects the keypointCreationData if needed
            _this.projectKeypointEditorData = function(frame) {
                var searchUID = $scope.keypointEditor.keypointEditorData.searchUID.toString();
                $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1] = _this.objects2D.objects[searchUID].frames[frame - $scope.toolParameters.frameFrom].shape;
                _this.setRedraw();
            };


            // Creates/updates the objects into the objects structure if no projection is needed (2D case)
            _this.updateObjects = function() {
                _this.resetObjectStructure();
                _this.prepareObjectStructure();

                var selectedType = $scope.objectManager.selectedType;

                for (obj in selectedType.objects) {
                    var object = selectedType.objects[obj.toString()];
                    for (var i= 0; i< object.frames.length; i++) {
                        if (object.frames[i].keypoints.length != 0) {
                            _this.update2DObject(object.uid, object.type, object.frames[i].frame, object.frames[i].keypoints);
                        }
                    }
                }                
            }

            // Creates/updates the object into the object structure
            _this.update2DObject = function(uid, type, frame, points) {
                var newObject = null;
                
                var imgPoints = [];                
                // Project if points exist
                if (points.length != 0) {
                    for (var i = 0; i < points.length; i++) {
                        if (points[i].length > 0) {
                            imgPoints.push(_this.toImage(points[i]));
                        } else {
                            imgPoints.push([]);
                        }
                    }
                }

                if (type.localeCompare("personAIK") == 0) {
                    newObject = new PersonAIK(uid, imgPoints, points, $scope.objectManager.objectTypes[type.toString()].labels.slice());         
                } else if (type.localeCompare("bbox") == 0|| type.localeCompare("bbox_head") == 0) {
                    newObject = new BBox(uid, imgPoints, points, $scope.objectManager.objectTypes[type.toString()].labels.slice());
                } else if (type.localeCompare("person") == 0) {
                    newObject = new Person(uid, imgPoints, points, $scope.objectManager.objectTypes[type.toString()].labels.slice(), $scope.objectManager.objectTypes[type.toString()].objects[uid.toString()].frames[frame - $scope.toolParameters.frameFrom].visibility.slice());
                } else if (type.localeCompare("poseAIK") == 0) {
                    newObject = new PoseAIK(uid, imgPoints, points, $scope.objectManager.objectTypes[type.toString()].labels.slice(), $scope.objectManager.selectedType.skeleton);
                } else if (type.localeCompare("boxAIK") == 0) {
                    newObject = new BoxAIK(uid, imgPoints, points, $scope.objectManager.objectTypes[type.toString()].labels.slice(), $scope.objectManager.selectedType.skeleton);
                } else if (type.localeCompare("cylinderAIK") == 0) {
                    newObject = new CylinderAIK(uid, imgPoints, points, $scope.objectManager.objectTypes[type.toString()].labels.slice(), $scope.objectManager.selectedType.skeleton);
                } else if (type.localeCompare("ignore_region") == 0) {
                    newObject = new IgnoreRegion(uid, imgPoints, points);
                } else {
                    // Whatever other objects
                }

                // Update
                delete _this.objects2D.objects[uid.toString()].frames[frame - $scope.toolParameters.frameFrom].shape; 
                _this.objects2D.objects[uid.toString()].frames[frame - $scope.toolParameters.frameFrom].shape = newObject;
                delete newObject;

                // Add the shape to the corresponding place in the keypoint editor to be visualized in other canvases
                if ($scope.keypointEditor.editorActive && $scope.keypointEditor.keypointEditorData.searchUID.toString().localeCompare(uid.toString()) === 0 && frame === $scope.timelineManager.slider.value) {
                    $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1] = newObject;
                }

                _this.setRedraw();
            }

            // Projects all objects of the selectedType in all frames to the actual active camera
            _this.projectObjects = function() {
                _this.resetObjectStructure();
                _this.prepareObjectStructure();
                var callbackProjection = function(uid, type, startFrame, endFrame, points) {
                    if (startFrame == endFrame) {
                        _this.update2DObject(uid, type, startFrame, $scope.objectManager.prepareKeypointsForFrontend(points[0]))
                    } else {
                        for (var i= startFrame; i <= endFrame; i++) {
                            _this.update2DObject(uid, type, i, $scope.objectManager.prepareKeypointsForFrontend(points[i - $scope.toolParameters.frameFrom]));
                        }
                    }
                }    
                
                // Select only the active type, for the normal objects
                var selectedType = $scope.objectManager.selectedType;

                for (obj in selectedType.objects) {
                    var object = selectedType.objects[obj.toString()];
                    toolSrvc.projectToCamera($scope.toolParameters.user.name, object.uid, object.type, $scope.toolParameters.frameFrom, $scope.toolParameters.frameTo, _this.activeCamera.filename, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, callbackProjection, $scope.messagesManager.sendMessage);
                }
            }

            // Project one object defined by objectUid
            _this.projectObject = function(objectUID, objectType, frameFrom, frameTo) {
                var callbackProjection = function(uid, type, startFrame, endFrame, points) {
                    for (var i= startFrame; i <= endFrame; i++) {
                        _this.update2DObject(uid, type, i, $scope.objectManager.prepareKeypointsForFrontend(points[i - startFrame]));
                    }          
                }

                var object = $scope.objectManager.selectedType.objects[objectUID.toString()]
                toolSrvc.projectToCamera($scope.toolParameters.user.name, object.uid, object.type, $scope.toolParameters.frameFrom, $scope.toolParameters.frameTo, _this.activeCamera.filename, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, callbackProjection, $scope.messagesManager.sendMessage); 
            }


            // Prepares the structure to store projected objects
            _this.prepareObjectStructure = function() {
                _this.objects2D.type = $scope.objectManager.selectedType.type;
                _this.objects2D.labels = $scope.objectManager.selectedType.labels;

                var objects = $scope.objectManager.selectedType.objects;
                for (obj in objects) {
                    _this.objects2D.objects[objects[obj].uid.toString()] = {}
                    _this.objects2D.objects[objects[obj].uid.toString()].uid = objects[obj].uid;
                    _this.objects2D.objects[objects[obj].uid.toString()].frames = [];

                    for (var i = 0; i <= $scope.toolParameters.numberOfFrames; i++) {
                        _this.objects2D.objects[objects[obj].uid.toString()].frames.push({
                            frame: i + $scope.toolParameters.frameFrom,
                            shape: null
                        })

                        _this.update2DObject(objects[obj].uid, objects[obj].type, i + $scope.toolParameters.frameFrom, []);
                    }
                }     
            }

            // Resets object structure
            _this.resetObjectStructure = function() {
                _this.objects2D = {
                    type: "",
                    labels: [],
                    objects: {}
                };

            }

            // Returns true if the canvas hasOptionsManager an active camera
            _this.hasActiveCamera = function() {
                return _this.activeCamera !== null;
            }

            // Returns the active camera
            _this.getActiveCamera = function() {
                return _this.activeCamera;
            }
        }

        function OptionsManager() {
            var _this = this;

            // General options of the tool
            _this.options = {
                pointSize: 10,
                fontSize: 10,
                showLabels: true,
                abbreviateLabels: false,
                showGuideLines: true,
                autoInterpolate: true,
                autoReplicate: false,
                showSecondaryPoseJoints: true,
                drawLimbLengths: false,
                showStaticObjects: false,
                quickSaveAfterJointRemoval: false,
                visualizeActions: false,
                showSelectedPointOnly: false
            }

            // Hidden option to change it manually. When True, the frames that can be annotated in PT with Persons will be restricted
            _this.restrictPTFrames = true;
            
            // Specific options for AIK object replication
            _this.replicateOptions = {
                replicateToTheMaxFrame: true,
                replicateTo: 0
            }

            navSrvc.setOptions(_this.options); // First set

            _this.optionChanged = function() {
                navSrvc.setOptions(_this.options);
                $scope.canvasesManager.redrawCanvases();
            }

            _this.replicateOptionChanged = function() {
                if (_this.replicateOptions.replicateTo < $scope.timelineManager.slider.value) _this.replicateOptions.replicateTo = $scope.timelineManager.slider.value;
                if (_this.replicateOptions.replicateTo > $scope.toolParameters.maxVideoFrame) _this.replicateOptions.replicateTo = $scope.toolParameters.maxVideoFrame;
            }

        }

        function ShortcutsManager() {
            var _this = this;

            _this.shortcuts = {
                selectedShortcuts: null,
                oldShortcuts: null,
                layouts: [
                    {
                        layout: 'QWERTY/QWERTZ',
                        nextFrame: {
                            label: 'D',
                            shortcut: 'd'
                        },
                        previousFrame: {
                            label: 'A',
                            shortcut: 'a'
                        },
                        playPause: {
                            label: 'Space',
                            shortcut: 'space'
                        },
                        toggleZoom: {
                            label: 'Ctrl',
                            shortcut: 'ctrl'
                        },
                        startAnn: {
                            label: 'Shift + A',
                            shortcut: 'shift+a'
                        },
                        saveAnn: {
                            label: 'Shift + S',
                            shortcut: 'shift+s'
                        },
                        resetAnn: {
                            label: 'Shift + R',
                            shortcut: 'shift+r'
                        },
                        deleteLabel: {
                            label: 'Shift + D',
                            shortcut: 'shift+d'
                        },
                        nextLabel: {
                            label: 'S',
                            shortcut: 's'
                        },
                        previousLabel: {
                            label: 'W',
                            shortcut: 'w'
                        },
                        moveWholeShape: {
                            label: 'Shift',
                            shortcut: 'shift'
                        },
                        changeVisibility: {
                            label: 'Shift + V',
                            shortcut: 'shift+v'
                        },
                        showSelectedPointOnly: {
                            label: 'Q',
                            shortcut: 'q'
                        },
                        arrows: {
                            label: '\u{2191}, \u{2193},\u{2190},\u{2192}'
                        }
                    },
                    {
                        layout: 'DVORAK',
                        nextFrame: {
                            label: 'E',
                            shortcut: 'e'
                        },
                        previousFrame: {
                            label: 'A',
                            shortcut: 'a'
                        },
                        playPause: {
                            label: 'Space',
                            shortcut: 'space'
                        },
                        toggleZoom: {
                            label: 'Ctrl',
                            shortcut: 'ctrl'
                        },
                        startAnn: {
                            label: 'Shift + A',
                            shortcut: 'shift+a'
                        },
                        saveAnn: {
                            label: 'Shift + O',
                            shortcut: 'shift+o'
                        },
                        resetAnn: {
                            label: 'Shift + P',
                            shortcut: 'shift+p'
                        },
                        deleteLabel: {
                            label: 'Shift + E',
                            shortcut: 'shift+e'
                        },
                        nextLabel: {
                            label: 'O',
                            shortcut: 'o'
                        },
                        previousLabel: {
                            label: '<',
                            shortcut: '<'
                        },
                        moveWholeShape: {
                            label: 'Shift',
                            shortcut: 'shift'
                        },
                        changeVisibility: {
                            label: 'Shift + X',
                            shortcut: 'shift+x'
                        },
                        showSelectedPointOnly: {
                            label: '\'',
                            shortcut: '\''
                        },
                        arrows: {
                            label: '\u{2191}, \u{2193},\u{2190},\u{2192}'
                        }
                    }
                ]
            }

            _this.bindKeys = function() {
                hotkeys.bindTo($scope).add({
                    combo: _this.shortcuts.selectedShortcuts.nextFrame.shortcut,
                    description: 'Go to the next frame',
                    callback: function() { $scope.timelineManager.nextFrame() }
                })
                .add({
                    combo: _this.shortcuts.selectedShortcuts.previousFrame.shortcut,
                    description: 'Go to the previous frame',
                    callback: function() { $scope.timelineManager.previousFrame() }
                })
                .add({
                    combo: _this.shortcuts.selectedShortcuts.playPause.shortcut,
                    description: 'Play/Pause',
                    callback: function() { $scope.timelineManager.switchPlay() }
                })
                .add({
                    combo: _this.shortcuts.selectedShortcuts.saveAnn.shortcut,
                    description: 'Save annotation',
                    callback: function() { //check if the keypoint editor is open and then save
                        if ($scope.keypointEditor.editorActive === true) {
                            $scope.commonManager.updateAnnotation();
                        }
                    }
                })
                .add({
                    combo: _this.shortcuts.selectedShortcuts.toggleZoom.shortcut,
                    description: 'Toggle zoom',
                    callback: function() {
                        $scope.canvasZoomManager.toggle();
                    }
                })
                .add({
                    combo: _this.shortcuts.selectedShortcuts.resetAnn.shortcut,
                    description: 'Delete annotation',
                    callback: function() { //check if the keypoint editor is open and then save
                        if ($scope.keypointEditor.editorActive === true) {
                            $scope.commonManager.deleteAnnotation();
                        }
                    }
                })
                .add({
                    combo: _this.shortcuts.selectedShortcuts.deleteLabel.shortcut,
                    description: 'Delete label',
                    callback: function() { //check if the keypoint editor is open and then save
                        if ($scope.keypointEditor.editorActive === true) {
                            $scope.keypointEditor.removeEditorDataPoint($scope.keypointEditor.selectedLabel);
                            if ($scope.optionsManager.options.quickSaveAfterJointRemoval) $scope.commonManager.updateAnnotation();
                        }
                    }
                })
                .add({
                    combo: _this.shortcuts.selectedShortcuts.previousLabel.shortcut,
                    description: 'Previous label',
                    callback: function() {
                        if ($scope.keypointEditor.editorActive === true) {
                            $scope.keypointEditor.previousLabel();
                        }
                    }
                })
                .add({
                    combo: _this.shortcuts.selectedShortcuts.nextLabel.shortcut,
                    description: 'Next label',
                    callback: function() {
                        if ($scope.keypointEditor.editorActive === true) {
                            $scope.keypointEditor.nextLabel();
                        }
                    }
                })
                .add({
                    combo: "t",
                    description: 'Test',
                    callback: function() {
                        console.log("test shortcut")
                    }
                })
                .add({
                    combo: _this.shortcuts.selectedShortcuts.startAnn.shortcut,
                    description: 'Annotate',
                    callback: function() {
                        if ($scope.keypointEditor.editorActive === true) {
                            if ($scope.keypointEditor.keypointEditorData.indexBeingEdited == $scope.keypointEditor.selectedLabel) {
                                $scope.keypointEditor.startEditingSelectedLabel($scope.keypointEditor.selectedLabel, '');
                            } else {
                                var tool = "";
                                if ($scope.keypointEditor.keypointEditorData.creationType.localeCompare('point') == 0) tool = "pointCreation";
                                else if ($scope.keypointEditor.keypointEditorData.creationType.localeCompare('box') == 0) tool = "boxCreation";
                                $scope.keypointEditor.startEditingSelectedLabel($scope.keypointEditor.selectedLabel, tool);
                            }
                            
                        }
                    }
                })
                .add({
                    combo: _this.shortcuts.selectedShortcuts.changeVisibility.shortcut,
                    description: "Change selected label's visibility",
                    callback: function() {
                        if (($scope.toolParameters.isPosetrack) && ($scope.keypointEditor.editorActive === true) && ($scope.objectManager.isTypeSelected("person"))) {
                            $scope.keypointEditor.changeVisibility($scope.keypointEditor.selectedLabel);
                        }
                    }
                }).add({
                    combo: _this.shortcuts.selectedShortcuts.showSelectedPointOnly.shortcut,
                    description: "Draw only the selected keypoint",
                    callback: function() {
                        if (($scope.toolParameters.isPosetrack) && ($scope.keypointEditor.editorActive === true) && ($scope.objectManager.isTypeSelected("person"))) {
                            $scope.optionsManager.options.showSelectedPointOnly = !$scope.optionsManager.options.showSelectedPointOnly;
                            $scope.canvasesManager.redrawCanvases();
                        }
                    }
                })
                .add({
                    combo: "up",
                    callback: function() {
                        if ($scope.keypointEditor.editorActive === true) {
                            $scope.keypointEditor.keypointEditorData.shapes[$scope.canvasesManager.canvasMouseOver].move(0, -1, $scope.keypointEditor.selectedLabel);
                            
                            var point = $scope.keypointEditor.keypointEditorData.shapes[$scope.canvasesManager.canvasMouseOver].points[$scope.keypointEditor.selectedLabel].center
                            var cameraPoint = $scope.canvasesManager.canvases[$scope.canvasesManager.canvasMouseOver].toCamera(point)
                            $scope.keypointEditor.keypointEditorData.shapes[$scope.canvasesManager.canvasMouseOver].cameraPoints[$scope.keypointEditor.selectedLabel] = cameraPoint.slice();
                            $scope.canvasesManager.redrawCanvases()
                        }
                    }
                })
                .add({
                    combo: "down",
                    callback: function() {
                        if ($scope.keypointEditor.editorActive === true) {
                            $scope.keypointEditor.keypointEditorData.shapes[$scope.canvasesManager.canvasMouseOver].move(0, 1, $scope.keypointEditor.selectedLabel);
                            var point = $scope.keypointEditor.keypointEditorData.shapes[$scope.canvasesManager.canvasMouseOver].points[$scope.keypointEditor.selectedLabel].center
                            var cameraPoint = $scope.canvasesManager.canvases[$scope.canvasesManager.canvasMouseOver].toCamera(point)
                            $scope.keypointEditor.keypointEditorData.shapes[$scope.canvasesManager.canvasMouseOver].cameraPoints[$scope.keypointEditor.selectedLabel] = cameraPoint.slice();
                            $scope.canvasesManager.redrawCanvases()
                        }
                    }
                })
                .add({
                    combo: "left",
                    callback: function() {
                        if ($scope.keypointEditor.editorActive === true) {
                            $scope.keypointEditor.keypointEditorData.shapes[$scope.canvasesManager.canvasMouseOver].move(-1, 0, $scope.keypointEditor.selectedLabel);
                            var point = $scope.keypointEditor.keypointEditorData.shapes[$scope.canvasesManager.canvasMouseOver].points[$scope.keypointEditor.selectedLabel].center
                            var cameraPoint = $scope.canvasesManager.canvases[$scope.canvasesManager.canvasMouseOver].toCamera(point)
                            $scope.keypointEditor.keypointEditorData.shapes[$scope.canvasesManager.canvasMouseOver].cameraPoints[$scope.keypointEditor.selectedLabel] = cameraPoint.slice();
                            $scope.canvasesManager.redrawCanvases()
                        }
                    }
                })
                .add({
                    combo: "right",
                    callback: function() {
                        if ($scope.keypointEditor.editorActive === true) {
                            $scope.keypointEditor.keypointEditorData.shapes[$scope.canvasesManager.canvasMouseOver].move(1, 0, $scope.keypointEditor.selectedLabel);
                            var point = $scope.keypointEditor.keypointEditorData.shapes[$scope.canvasesManager.canvasMouseOver].points[$scope.keypointEditor.selectedLabel].center
                            var cameraPoint = $scope.canvasesManager.canvases[$scope.canvasesManager.canvasMouseOver].toCamera(point)
                            $scope.keypointEditor.keypointEditorData.shapes[$scope.canvasesManager.canvasMouseOver].cameraPoints[$scope.keypointEditor.selectedLabel] = cameraPoint.slice();
                            $scope.canvasesManager.redrawCanvases()
                        }
                    }
                });
            }

            _this.unbindKeys = function() {
                for (key in _this.shortcuts.oldShortcuts) {
                    if (Object.prototype.hasOwnProperty(_this.shortcuts.oldShortcuts[key], 'shortcut')) {
                        hotkeys.del(_this.shortcuts.oldShortcuts[key].shortcut)
                    }
                }
                _this.shortcuts.oldShortcuts = angular.copy(_this.shortcuts.selectedShortcuts);
            }

            // By default, the qwerty shortcuts are used
            _this.shortcuts.selectedShortcuts = _this.shortcuts.layouts[0];
            _this.shortcuts.oldShortcuts = angular.copy(_this.shortcuts.layouts[0]);
            _this.bindKeys();
        }

        function ColorManager() {
            var _this = this;

            _this.colorChannelClamp = function(channel) {
                return Math.min(Math.max(parseInt(channel), 0), 255);
            }

            _this.updateColorDark = function(color) {
                var rgbColor = _this.hexToRgb(color);
                rgbColor.r = _this.colorChannelClamp(rgbColor.r - 30);
                rgbColor.g = _this.colorChannelClamp(rgbColor.g - 30);
                rgbColor.b = _this.colorChannelClamp(rgbColor.b - 30);
                return _this.rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
            }

            _this.updateColorLight = function(color) {
                var rgbColor = _this.hexToRgb(color);
                rgbColor.r = _this.colorChannelClamp(rgbColor.r + 30);
                rgbColor.g = _this.colorChannelClamp(rgbColor.g + 30);
                rgbColor.b = _this.colorChannelClamp(rgbColor.b + 30);
                return _this.rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
            }

            _this.makeTransparent = function(color) {
                return color  + 'BF'
            }

            _this.componentToHex = function(c) {
                var hex = c.toString(16);
                return hex.length == 1 ? "0" + hex: hex;
            }

            _this.rgbToHex = function(r,g,b) {
                return "#" + _this.componentToHex(r) + _this.componentToHex(g) + _this.componentToHex(b);
            }

            _this.hexToRgb = function(hex) {
                // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
                var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
                hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                    return r + r + g + g + b + b;
                });

                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? {
                    r: parseInt(result[1], 16),
                    g: parseInt(result[2], 16),
                    b: parseInt(result[3], 16)
                } : null;
            }
        }

        // Managers
        $scope.toolParameters = new ToolParametersManager($stateParams);
        $scope.toolsManager = new ToolsManager();
        $scope.toolParameters.getListOfFrameNumbers();
        $scope.timelineManager = new TimelineManager($scope.toolParameters.frameFrom,$scope.toolParameters.frameTo);
        $scope.messagesManager = new MessagesManager();
        $scope.loadingScreenManager = new LoadingScreenManager();
        $scope.objectManager = new ObjectManager();
        $scope.actionManager = new ActionManager();
        
        $scope.colorManager = new ColorManager();
        $scope.actionManager.getActivitiesList();
        $scope.camerasManager = new CamerasManager();

        $scope.optionsManager = new OptionsManager();
        $scope.shortcutsManager = new ShortcutsManager();
        
        $scope.commonManager = null;
        if ($scope.toolParameters.isPosetrack) {
            $scope.commonManager = new PTManager();
        } else {
            $scope.commonManager = new AIKManager();
        }

        $scope.mugshotsManager = new MugshotsManager();

        $scope.canvasesManager = new CanvasesManager();
        $scope.canvasesManager.initializeCanvases();

        $scope.commonManager.initialize();

        $scope.canvasZoomManager = new CanvasZoomManager();
        $scope.canvasZoomManager.initialize()

        // Editors
        $scope.actionsEditor = new ActionsEditor();
        $scope.keypointEditor = new KeypointEditor();

        /////////
        // WATCHERS AND MESSAGES
        /////////

        // Prevents Dropdowns from closing when clicked inside 
        document.getElementById("ObjectTypeDropdown").addEventListener('click', function (event) { 
            event.stopPropagation(); 
        });
        
        document.getElementById("OptionsDropdown").addEventListener('click', function (event) { 
            event.stopPropagation(); 
        });

        document.getElementById("ShortcutsDropdown").addEventListener('click', function (event) { 
            event.stopPropagation(); 
        });
        
        document.getElementById("PersonGuideDropdown").addEventListener('click', function (event) { 
            event.stopPropagation(); 
        }); 

        // Prevents from closing when clicking inside
        document.getElementById("ActionCreationDropdown").addEventListener('click', function (event) { 
             event.stopPropagation(); 
        });

        $('#ActionCreationDropdown').parent().on({  // Prevents from closing when clicking outside
        "shown.bs.dropdown": function() { this.closable = false; },
        "click":             function() { this.closable = true; },
        "hide.bs.dropdown":  function() { return this.closable; }
        });

        document.getElementById("NumberOfCanvasesDropdown").addEventListener('click', function (event) { 
            event.stopPropagation(); 
        });

        document.getElementById("ReplicateDropdown").addEventListener('click', function (event) { 
            event.stopPropagation(); 
        });
        
        // Watcher to update the canvas image
        $scope.$watch("timelineManager.slider.value", function() {
            if ($scope.keypointEditor.editorActive) $scope.keypointEditor.openEditor($scope.objectManager.selectedObject, $scope.timelineManager.slider.value);
            $scope.canvasesManager.redrawCanvases();
        });

        // The next two function control the shift key to move the whole shape when editing
        document.addEventListener("keydown", (event) => {
            if (event.key.localeCompare("Shift") == 0 && $scope.keypointEditor.editorActive) {
                $scope.keypointEditor.setMoveWholeShape();
            }
        })

        document.addEventListener("keyup", (event) => {
            if (event.key.localeCompare("Shift") == 0 && $scope.keypointEditor.editorActive) {
                $scope.keypointEditor.unsetMoveWholeShape();
            }
        })


        // Function that is executed when checkAnnotations msg is received.
        // Check if all annotations are complete
        // Structure: incompleteObjects:
        // {'type1': {
        //     'obj1': ['frame1', 'frame2', ...],
        //     'objX': [...] },
        //  'type2': { ...}, ...
        // }
        $scope.$on('checkAnnotations', function(evt, data) {
            var incompleteObjects = [];

            for (objType in $scope.objectManager.objectTypes) {
                for (obj in $scope.objectManager.objectTypes[objType].objects) {
                    var object = $scope.objectManager.objectTypes[objType].objects[obj];
                    frames = [];
                    for (f in object.frames){
                        var status = $scope.objectManager.annotationsState(object.uid, object.type, object.frames[f].frame);
                        if (status === 0 || status === -1) {
                            frames.push(object.frames[f].frame);

                        }
                    }
                    if (frames.length > 0){
                        incompleteObjects.push({'type': objType, 'object': obj, 'frames': frames.toString()});
                    }
                }
            }
            $mdDialog.show({
                templateUrl: '/static/views/dialogs/nextFrameRangeDialog.html',
                locals: {
                    objects: incompleteObjects,
                    range: data.range
                },
                controller: 'nextFrameRangeCtrl',
                escapeToClose: false,
                onRemoving: function (event, removePromise) {
                    // $scope.getListOfDatasets();
                    // $scope.getInfoOfVideos();
                }
            });
         });
    }
]);
