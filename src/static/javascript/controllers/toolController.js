angular.module('CVGTool')

.controller('toolCtrl', ['$scope', '$rootScope', '$state', '$interval', '$mdDialog', 'toolSrvc', 'navSrvc', 'hotkeys', '$stateParams',
    function($scope, $rootScope, $state, $interval, $mdDialog, toolSrvc, navSrvc, hotkeys, $stateParams) {
        
        // ENABLE TOOLTIPS //
        $(function() {
            $('[data-toggle="tooltip"]').tooltip()
        })
        
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

            // Closes the alert to select an object type again
            _this.closeObjectTypeAlert = function() {
                _this.showObjectTypeAlert = false;
            }

            // Check where do we come from to load pre-loaded cameras if needed
            _this.checkWhereAreWeComingFrom = function() {
                if (!_this.fromTaskHome) {
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
            _this.selectedObject = null;

            // FUNCTIONS //
            // Resets the object Manager object
            _this.resetObjectManager = function() {
                _this.objectTypes = {};
                _this.selectedType = {};
                _this.selectedObject = null;
            }

            // Function called everytime the selector type changes
            _this.changeSelectedType = function(type) {
                _this.selectedType = _this.objectTypes[type];
            
                $scope.canvasesManager.refreshProjectionOfCanvases();
                      
                $scope.canvasesManager.redrawCanvases();

                navSrvc.setSelectedType(type);  // Update selected type in session
            };

            // Creates a new object
            _this.createNewObject = function() {
                var callback = function(newUID, type) {
                    // Add the new object to the object Manager
                    _this.objectTypes[type.toString()].objects[newUID.toString()] = {
                        uid: newUID,
                        type: type,
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

                toolSrvc.createNewObject(navSrvc.getUser().name, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, _this.selectedType.type, $scope.timelineManager.slider.value, callback, $scope.messagesManager.sendMessage);
            }

            // Returns "complete" if the whole object is annotated, "incomplete" if the object is not completely annotated or "empty" is the object is not annotated at all
            _this.annotationsState = function(objectUID, type, frame) {
                var existAnnotation = _this.objectTypes[type.toString()].objects[objectUID.toString()].frames[frame - $scope.toolParameters.frameFrom].annotationsExist;
                var max = existAnnotation.length;
                var count = 0;
                for (var i = 0; i < max; i++) {
                    if (existAnnotation[i]) count++;
                }

                if (count == 0) return 0;      // No annotation
                if (count == max) return 1;    // All annotations
                return -1;                     // Some annotated, but not all
            }  
        }


        function ActionManager() {
            var _this = this;

            // VARIABLES //
            _this.activitiesList = [];
            _this.actionsList = [];
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
            _this.getActionsListByUID = function() {
                _this.actionsList = [];
                var callback = function(actionsList) {
                    _this.actionsList = actionsList;
                }
                toolSrvc.getActionsByUID($scope.toolParameters.user.name, _this.selectedObject.uid,
                    $scope.toolParameters.frameFrom, $scope.toolParameters.frameTo, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, callback, $scope.messagesManager.sendMessage)
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
                        _this.actionsList.push({
                            name: _this.actionCreationData.selectedType,
                            objectUID: _this.selectedObject.uid,
                            startFrame: _this.actionCreationData.startFrame,
                            endFrame: _this.actionCreationData.endFrame,
                            dataset: $scope.toolParameters.activeDataset.name,
                            user: $scope.toolParameters.user.name
                        });

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
                    _this.actionsList.pop();
                } else {
                    var callback = function() {
                        $scope.messagesManager.sendMessage("success", "Action deleted!");
                        _this.getActionsListByUID(_this.selectedObject.uid);
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
                    }
                    
                    _this.retrieveObjects();
                    
                }
                
                toolSrvc.retrieveAvailableObjectTypes($scope.toolParameters.activeDataset.type, callback, $scope.messagesManager.sendMessage);
            }

            // STEP2: Retrieve all available objects
            _this.retrieveObjects = function() {
                var callback = function(objects) {
                    if (objects.length <= 0) return;
                    
                    for (obj in objects) {
                        var object = objects[obj].object;

                        var existsInit = [];
                        for (var j = 0; j < $scope.objectManager.objectTypes[object.type.toString()].labels.length; j++) {
                            existsInit.push(false);
                        }
                        
                        $scope.objectManager.objectTypes[object.type.toString()].objects[object.uid.toString()] = {
                            uid: object.uid,
                            type: object.type,
                            frames: []
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

            // Interpolate in AIK
            _this.interpolate = function (objectUID, objectType, frameTo) {
                var callbackSuccess = function(objectUID, objectType, frameFrom, frameTo) {
                    var frameArray = [];
                    for (var i = frameFrom; i <= frameTo; i++) frameArray.push(i);
                    _this.retrieveAnnotation(objectUID, objectType, frameArray);
                }

                if (frameTo == $scope.toolParameters.frameFrom) return; // Nothing to interpolate

                var frameFrom = null;

                // Find the frame to interpolate to
                for (var i = frameTo - 1; i >= Math.max($scope.toolParameters.frameFrom, frameTo - $scope.toolParameters.interpolationRange); i--) {
                    if ($scope.objectManager.annotationsState(objectUID, objectType, i) !== 0) {    // Found frame to interpolate to
                        frameFrom = i;
                        break;
                    }
                }

                if (frameFrom === null || frameFrom + 1 == frameTo) return; // Nothing found to interpolate to

                toolSrvc.interpolate($scope.toolParameters.user.name, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, frameFrom, frameTo, objectUID, objectType, objectUID, callbackSuccess, $scope.messagesManager.sendMessage);
            }

            // Updates the annotation being edited
            _this.updateAnnotation = function() {
                var callbackSuccess = function(uid, type, frame) {
                    $scope.toolsManager.switchSubTool("");
                    $scope.canvasesManager.resetEpilines();
                    $scope.messagesManager.sendMessage("success", "Annotation updated!");
                    _this.retrieveAnnotation(uid, type, [frame]);   // Retrieve the new annotated object

                    if ($scope.keypointEditor.autoInterpolate) {
                        _this.interpolate(uid, type, frame);
                    }
                }

                var pointStructure = {
                    points: [[],[],[],[]],
                    cameras: ["", "", "", ""]
                }

                var objects = {
                    uid: $scope.objectManager.selectedObject.uid,
                    type: $scope.objectManager.selectedObject.type,
                    keypoints: []
                }

                // Append as many keypoints structures as labels the object has
                for (var i = 0; i < $scope.keypointEditor.keypointEditorData.realLabels.length; i++) {
                    objects.keypoints.push(pointStructure);
                }

                // For each canvas and for each label, fill the data
                for (var i = 0; i < $scope.keypointEditor.keypointEditorData.shapes.length; i++) {
                    if ($scope.keypointEditor.keypointEditorData.shapes[i] !== null){
                        var points = $scope.keypointEditor.keypointEditorData.shapes[i].points;;
                        var cameraPoints = $scope.keypointEditor.keypointEditorData.shapes[i].cameraPoints;
                        var count = 0;

                        for (var j = 0; j < $scope.keypointEditor.keypointEditorData.realLabels.length; j++) {
                            if (points[j] !== null) {
                                objects.keypoints[j].points[i] = cameraPoints[j];
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
                    } else {       
                        // Update the object
                        toolSrvc.updateAnnotation($scope.toolParameters.user.name, $scope.toolParameters.activeDataset, $scope.toolParameters.activeDataset.name, $scope.timelineManager.slider.value, objects, callbackSuccess, $scope.messagesManager.sendMessage);
                    }
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

            // Deletes the actual object in the actual frame
            _this.deleteAnnotation = function() {
                var successFunction = function() {
                    $scope.messagesManager.sendMessage("success", "Annotation deleted!")
                    let object = $scope.objectManager.selectedObject;
                    _this.retrieveAnnotation(object.uid, object.type, [$scope.timelineManager.slider.value]);
                }
                toolSrvc.batchDeleteAnnotations($scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, $scope.toolParameters.activeDataset.name, $scope.timelineManager.slider.value, $scope.timelineManager.slider.value, $scope.toolParameters.user.name, $scope.objectManager.selectedObject.uid, $scope.objectManager.selectedObject.type, successFunction, $scope.messagesManager.sendMessage);
            }
        }

        function PTManager() {
            var _this = this;

            // Executes the whole PT initialization process
            _this.initialize = function() {
                $scope.loadingScreenManager.setLoadingScreen();
                _this.retrieveAvailableObjectTypes();
                $scope.toolParameters.checkWhereAreWeComingFrom();
            }

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
                if (keypoints.length == 15) return keypoints.slice();
                // First remove the points from the ears
                var returnKeypoints = keypoints.slice();
                returnKeypoints.splice(3,2);

                var finalReturnKeypoints = [];

                for (var i = 0; i < returnKeypoints.length; i++) {
                    if (returnKeypoints[i].length == 0) {
                        finalReturnKeypoints.push([]);
                    } else if (returnKeypoints[i].length == 2) {
                        finalReturnKeypoints.push(returnKeypoints[i]);
                    } else if (returnKeypoints[i].length == 3) {
                        if (returnKeypoints[i][2] == 1) {
                            finalReturnKeypoints.push([returnKeypoints[i][0], returnKeypoints[i][1]])
                        } else {
                            finalReturnKeypoints.push([]);
                        }
                    }
                }

                // Check third coordinates to remove them
                return finalReturnKeypoints;
            }

            // Function that restores the two person labels from posetrack person
            _this.restorePersonKeypoints = function(keypoints) {
                var returnKeypoints = keypoints.slice();
                returnKeypoints.splice(3,0, [], []);
                return returnKeypoints;
            }

            // Retrieve objects
            _this.retrieveObjects = function() {
                var callback = function(objects) {
                    if (objects.length <= 0) return;
                    
                    for (let obj in objects) {
                        let object = objects[obj].object;
                        
                        var existsInit = [];
                        for (var j = 0; j < $scope.objectManager.objectTypes[object.type.toString()].labels.length; j++) {
                            existsInit.push(false);
                        }

                        $scope.objectManager.objectTypes[object.type.toString()].objects[object.track_id.toString()] = {
                            uid: object.track_id,
                            type: object.type,
                            frames: []
                        };
    
                        // Fill the frames array with an empty array for each frame
                        for (var j = 0; j <= $scope.toolParameters.numberOfFrames; j++) {
                            $scope.objectManager.objectTypes[object.type.toString()].objects[object.track_id.toString()].frames.push({
                                frame: $scope.toolParameters.frameFrom + j,
                                annotationsExist: existsInit.slice(),
                                keypoints: []
                            })
                        }
                    }
                    for (let obj in objects) {
                        let object = objects[obj].object;
                        if (object.frame >= $scope.toolParameters.frameFrom && object.frame <= $scope.toolParameters.frameTo) {
                            $scope.objectManager.objectTypes[object.type.toString()].objects[object.track_id.toString()]
                                // .frames[object.frame - $scope.toolParameters.frameFrom].original_uid = _this.generateNewOriginalUid(object.track_id, object.frame);
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
            }

            // Retrieve annotations
            _this.retrieveAnnotations = function() {
                var callback = function(annotations) {
                    if (annotations.length == 0) {  // Check if we received something
                        $scope.loadingScreenManager.closeLoadingScreen();
                        $scope.canvasesManager.refreshProjectionOfCanvases();
                        return;
                    }
        
                    for (var j = 0; j < annotations.length; j++) {
                        var annotation = annotations[j];
                        for (var i = 0; i < annotation.objects.length; i++) {
                            // If the object is of type "person", fix the keypoint structure to ignore ears
                            if (annotation.objects[i].type.toString().localeCompare("person") == 0) {
                                annotation.objects[i].keypoints = _this.fixPersonKeypoints(annotation.objects[i].keypoints);
                            }
                            // In any case, store in that frame the keypoints, the frame number and the actions
                            $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                                .objects[annotation.objects[i].track_id.toString()].frames[annotation.frame - $scope.toolParameters.frameFrom].keypoints =
                                annotation.objects[i].keypoints.slice();
                            $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                                .objects[annotation.objects[i].track_id.toString()].frames[annotation.frame - $scope.toolParameters.frameFrom].frame =
                                annotation.frame;
                            
                            for (var k = 0; k < annotation.objects[i].keypoints.length; k++) {
                                if (annotation.objects[i].keypoints[k].length != 0) {
                                    $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                                        .objects[annotation.objects[i].track_id.toString()].frames[annotation.frame - $scope.toolParameters.frameFrom].annotationsExist[k] = true;
                                } 
                            }
                              
                        }
                    }
                    $scope.loadingScreenManager.closeLoadingScreen();
                    $scope.canvasesManager.refreshProjectionOfCanvases();
                }

                if ($scope.camerasManager.loadedCameras.length > 0) {
                    toolSrvc.getAnnotationsByFrameRange($scope.camerasManager.loadedCameras[0].filename, $scope.toolParameters.activeDataset.type, $scope.toolParameters.frameFrom, $scope.toolParameters.frameTo,
                        $scope.toolParameters.activeDataset.name, $scope.toolParameters.user.name, callback);
                } else {
                    toolSrvc.getAnnotationsByFrameRange($scope.canvasesManager.canvases[0].getActiveCamera().filename, $scope.toolParameters.activeDataset.type, $scope.toolParameters.frameFrom, $scope.toolParameters.frameTo,
                        $scope.toolParameters.activeDataset.name, $scope.toolParameters.user.name, callback);
                }
            }

            // Retrieve annotation by UID, objectType and range of frames
            _this.retrieveAnnotation = function(objectUID, objectType, frameArray) {
                var callback = function(annotations) { // Check if we received something
                    if (annotations.length <= 0) {
                        $scope.loadingScreenManager.closeLoadingScreen();
                        return;
                    }
                    for (let k = 0; k < annotations.length; k++) {
                        var frame = annotations[k].frame;
                        var objects = annotations[k].objects;
                        for (var i= 0; i< objects.length; i++) {
                            // If the object is of type "person", fix the keypoint structure to ignore ears
                            if (objects[i].type.toString().localeCompare("person") === 0) {
                                objects[i].keypoints = _this.fixPersonKeypoints(objects[i].keypoints);
                            }

                            $scope.objectManager.objectTypes[objects[i].type.toString()].objects[objects[i].track_id.toString()].frames[frame - $scope.toolParameters.frameFrom].keypoints = objects[i].keypoints;
                            $scope.objectManager.objectTypes[objects[i].type.toString()].objects[objects[i].track_id.toString()].frames[frame - $scope.toolParameters.frameFrom].original_uid = objects[i].uid;

                            for (let j = 0; j < objects[i].keypoints.length; j++) {
                                if (objects[i].keypoints[j].length !== 0) {
                                    $scope.objectManager.objectTypes[objects[i].type.toString()]
                                        .objects[objects[i].track_id.toString()].frames[frame - $scope.toolParameters.frameFrom].annotationsExist[j] = true;
                                }
                            }
                            $scope.canvasesManager.refreshCanvasPointByUID(objects[i].track_id, objects[i].type, frame);
                        }
                    }
                    $scope.loadingScreenManager.closeLoadingScreen();
                }
                
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
                        callback, $scope.messagesManager.sendMessage);
                } else {
                    toolSrvc.getAnnotationOfFrameByUID($scope.toolParameters.user.name,
                        $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type,
                        $scope.canvasesManager.canvases[0].getActiveCamera().filename,
                        objectUID, objectType ,frameArray[0], frameArray[frameArray.length - 1],
                        callback, $scope.messagesManager.sendMessage);
                }
            };

            // Interpolate
            _this.interpolate = function (objectUID, objectType, frameTo) {
                var callbackSuccess = function(_objectUID, objectType, frameFrom, frameTo) {
                    var frameArray = [];
                    for (var i = frameFrom; i <= frameTo; i++) frameArray.push(i);
                    _this.retrieveAnnotation(objectUID, objectType, frameArray);
                };

                if (frameTo === $scope.toolParameters.frameFrom) return; // Nothing to interpolate

                var frameFrom = null;
                // Find the frame to interpolate to
                for (var i = frameTo - 1; i >= Math.max($scope.toolParameters.frameFrom, frameTo - $scope.toolParameters.interpolationRange); i--) {
                    if ($scope.objectManager.annotationsState(objectUID, objectType, i) !== 0) {    // Found frame to interpolate to
                        frameFrom = i;
                        break;
                    }
                }

                if (frameFrom === null) return; // Nothing found to interpolate to

                toolSrvc.interpolate($scope.toolParameters.user.name, $scope.toolParameters.activeDataset.name,
                    $scope.toolParameters.activeDataset.type, $scope.canvasesManager.canvases[0].activeCamera.filename,
                    frameFrom, frameTo,
                    $scope.objectManager.selectedObject.frames[frameTo - $scope.toolParameters.frameFrom].original_uid,
                    objectType,
                    $scope.objectManager.selectedObject.frames[frameFrom - $scope.toolParameters.frameFrom].original_uid,
                    callbackSuccess, $scope.messagesManager.sendMessage);
            }
            

            // Updates the annotation being edited
            _this.updateAnnotation = function() {
                var callbackSuccess = function(uid, type, frame) {
                    $scope.toolsManager.switchSubTool("");
                    $scope.messagesManager.sendMessage("success", "Annotation updated!");
                    _this.retrieveAnnotation(uid, type, [frame]);

                    if ($scope.keypointEditor.autoInterpolate) {
                        _this.interpolate(uid, type, frame);
                    }
                }


                var objects = {
                    uid: $scope.objectManager.selectedObject.original_uid,
                    type: $scope.objectManager.selectedObject.type,
                    track_id: $scope.objectManager.selectedObject.uid,
                    keypoints: []
                }

                var shape = $scope.keypointEditor.keypointEditorData.shapes[0];
                if (objects.type.localeCompare("person") === 0) {
                    objects.keypoints = _this.restorePersonKeypoints(shape.cameraPoints);
                }
                objects.keypoints = shape.cameraPoints;

                toolSrvc.updateAnnotation($scope.toolParameters.user.name, $scope.toolParameters.activeDataset, $scope.canvasesManager.canvases[0].activeCamera.filename, $scope.timelineManager.slider.value, objects, callbackSuccess, $scope.messagesManager.sendMessage);
            };

            // Deprecated code beloging to original ID generation. Left just in case
            // // Function that generates a legit poseTrack UID for new objects
            // _this.generateNewOriginalUid_old = function(track_id, frame) {
            //     // Convert num to String and add 0s to the left of size size.
            //     function pad (num, size) {
            //         let s = String(num);
            //         while (s.length < size) { s = "0" + s; }
            //         return s;
            //     }
            //     let video = "";
            //     try{
            //         video = $scope.canvasesManager.canvases[0].activeCamera.filename;
            //     } catch (e) {
            //         video = $scope.camerasManager.loadedCameras[0].filename;
            //     }
            //     frame = pad(frame, 4);
            //     track_id = pad(track_id, 2);
            //     return Number("1" + video + frame + track_id)
            // };

            // Opens the dialog for batch-deleting points
            _this.openBatchDelete = function(object) {
                $mdDialog.show({
                    templateUrl: '/static/views/dialogs/batchDeleteDialog.html',
                    controller: 'batchDeleteCtrl',
                    escapeToClose: false,
                    locals: {
                        toolSrvc: toolSrvc,
                        object: object,
                        minFrame: $scope.toolParameters.frameFrom,
                        maxFrame: $scope.toolParameters.frameTo,
                        dataset: $scope.toolParameters.activeDataset,
                        scene: $scope.canvasesManager.canvases[0].activeCamera.filename, 
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
                }      

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

        }

        function KeypointEditor () {
            var _this = this;

            _this.active = false;
            _this.editorActive = false;

            _this.minimized = false;
            _this.editorMinimized = false;

            _this.autoInterpolate = true;
            _this.showGuideLines = true;
            _this.showLabels = true;

            _this.keypointEditorData = {};

            // Opens the panel to edit keypoints
            _this.openEditor = function(object, frame) {
                _this.editorActive = true;
                $scope.objectManager.selectedObject = object;
                $scope.timelineManager.slider.value = frame;
                if ($scope.toolParameters.isPosetrack) $scope.mugshotsManager.getMugshots(object.uid);
                
                _this.keypointEditorData = {
                    searchUID: null,
                    shapes: [],
                    labels: $scope.objectManager.selectedType.labels,
                    realLabels: $scope.objectManager.selectedType.labels,
                    creationType: "point",
                    indexBeingEdited: null,
                    modified: false
                }

                // In case of the object being of type box
                if ($scope.objectManager.selectedType.type.localeCompare("bbox") == 0 || $scope.objectManager.selectedType.type.localeCompare("bbox_head") == 0) {
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
                    _this.keypointEditorData.shapes = [null, null, null, null];
                    _this.keypointEditorData.searchUID = $scope.objectManager.selectedObject.uid;
                    
                }

                $scope.canvasesManager.projectKeypointEditorData(frame);

            }

            _this.setIndexBeingEdited = function(index) {
                // If there was an index being edited and its not saved we remove whatever we created
                // if (_this.keypointEditorData.indexBeingEdited !== null) {
                //     _this.removeEditorDataPoint(_this.keypointEditorData.indexBeingEdited)
                    
                //     if (!$scope.toolParameters.isPosetrack) $scope.canvasesManager.resetEpilines();
                // }
                _this.keypointEditorData.indexBeingEdited = index;
            }

            _this.removeEditorDataPoint = function(index) {
                for (var i = 0; i < _this.keypointEditorData.shapes.length; i++) {
                    if (_this.keypointEditorData.shapes[i] !== null) _this.keypointEditorData.shapes[i].removePoint(index);
                }
                
                $scope.canvasesManager.redrawCanvases();
            }

            _this.removeEditorDataBox = function() {
                for (var i = 0; i < _this.keypointEditorData.points.length; i++) {
                    _this.removeEditorDataPoint(i);
                }
            }

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
                                    toolSrvc.getEpiline($scope.timelineManager.slider.value, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, point, cameraName, cameraToProject, i, j, _this.keypointEditorData.indexBeingEdited, callbackSuccess, $scope.messagesManager.sendMessage);
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
            _this.uid = uid;
            _this.points = [];
            _this.cameraPoints = [];
            _this.skeleton = skeleton;

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
          

            _this.draw = function(context, color) {
                // First draw all points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].draw(context, color);
                }

                // Then draw all the edges
                _this.drawEdges(context, color);
            }

            _this.drawEdges = function(context, color) {
                for (var i = 0; i < _this.skeleton.length; i++) {
                    _this.drawEdge(context, color, _this.points[_this.skeleton[i][0]], _this.points[_this.skeleton[i][1]]);
                }
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
                // First draw all points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].drawWithText(context, color, _this.uid);
                }

                // Then draw all the edges
                //_this.drawEdges(context, color);
            }

            _this.drawWithLabel = function(context, color) {
                // First draw all points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].drawWithText(context, color, _this.labels[i]);
                }

                // Then draw all the edges
                //_this.drawEdges(context, color);
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
                if (_this.points[index] == null) return;
                _this.points[index].move(dx,dy);
            }

            _this.updateCameraPoints = function(dxCamera,dyCamera, index) {
                _this.cameraPoints[index][0] += dxCamera;
                _this.cameraPoints[index][1] += dyCamera;
            }

            _this.removePoint = function(index) {
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

        function Person (uid, projectedPoints, cameraPoints, labels) {
            var _this = this;

            _this.labels = labels; 
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

            _this.draw = function(context, color) {
                // First draw all points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].draw(context, color);
                }

                // Then draw all the edges
                _this.drawEdges(context, color);
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
                // First draw all points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].drawWithText(context, color, _this.uid);
                }

                // Then draw all the edges
                _this.drawEdges(context, color);
            }

            _this.drawWithLabel = function(context, color) {
                // First draw all points
                for (var i = 0; i < _this.points.length; i++) {
                    if (_this.points[i] !== null) _this.points[i].drawWithText(context, color, _this.labels[i]);
                }

                // Then draw all the edges
                _this.drawEdges(context, color);
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
                if (_this.points[index] == null) return;
                _this.points[index].move(dx,dy);
            }

            _this.updateCameraPoints = function(dxCamera,dyCamera, index) {
                _this.cameraPoints[index][0] += dxCamera;
                _this.cameraPoints[index][1] += dyCamera;
            }

            _this.removePoint = function(index) {
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

            _this.move = function(dx,dy, index) {
                if (_this.points[index] === null) return;
                _this.points[index].move(dx,dy); 
            }

            _this.updateCameraPoints = function(dxCamera,dyCamera, index) {
                _this.cameraPoints[index][0] += dxCamera;
                _this.cameraPoints[index][1] += dyCamera;
            }

            _this.removePoint = function(index) {
                _this.points[index] = null;
                _this.cameraPoints[index] = [];
            }

            _this.getPointIndex = function(x, y) {
                if (_this.points[0].isInside(x,y)) return 0;
            }
        }

        // Basic point
        function Point(projectedCenter) {
            var _this = this;

            _this.center = projectedCenter;
            _this.radius = 10;

            _this.draw = function(context, color) {
                context.beginPath();
                context.arc(_this.center[0], _this.center[1], _this.radius, 0, 2 * Math.PI, false);
                context.fillStyle = color;
                context.fill();
                context.closePath();
            }

            _this.drawWithText = function(context, color, text) {
                context.beginPath();
                context.arc(_this.center[0], _this.center[1], _this.radius, 0, 2 * Math.PI, false);
                context.fillStyle = color;
                context.fill();
                context.closePath();
                context.beginPath();
                context.font = "12px sans-serif";
                context.strokeStyle = "black";
                context.lineWidth = 3;
                context.strokeText(text.toString(), _this.center[0] - 8, _this.center[1] + 5);
                context.fillStyle = "white";
                context.fillText(text.toString(), _this.center[0] - 8, _this.center[1] + 5);
                context.fill();
                context.closePath();
            }

            _this.isInside = function(x,y) {
                var dx = _this.center[0] - x;
                var dy = _this.center[1] - y;
                var distance = Math.sqrt((dx * dx) + (dy * dy));
                if (distance <= _this.radius) return true;
                return false;
            }

            _this.move = function(x,y) {
                _this.center[0] += x;
                _this.center[1] += y; 
            }
        }

        // TODO: Polygon, skeleton and move points of everyone of them

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
            var html = document.body.parentNode;
            _this.htmlTop = html.offsetTop;
            _this.htmlLeft = html.offsetLeft;

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
                "#63b598", "#ce7d78", "#ea9e70", "#a48a9e", "#c6e1e8", "#648177", "#0d5ac1",
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

            // Mouse variable
            _this.mouse = {
                pos: { x: 0, y: 0 },
                worldPos: { x: 0, y: 0 },
                posLast: { x: 0, y: 0 },
                dragPos: { x: 0, y: 0 },
                dragging: false
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

            // MouseDown event
            canvas.addEventListener('mousedown', function(e) {
                var mouse = _this.getMouse(e);
                _this.mouse.pos.x = mouse.x;
                _this.mouse.pos.y = mouse.y;

                // // If the tool is navigation
                // if ($scope.toolsManager.tool.localeCompare('navigation') == 0) {
                //     _this.dragging = true;
                // }

                // // If the subtool is 'Zoom Out'
                // if ($scope.toolsManager.subTool.localeCompare('zoomIn') == 0) {
                //     _this.zoom += 0.5;
                //     _this.constraintZoom();
                //     _this.setRedraw();
                // }

                // // If the subtool is 'Zoom In'
                // if ($scope.toolsManager.subTool.localeCompare('zoomOut') == 0) {
                //     _this.zoom -= 0.5;
                //     _this.constraintZoom();
                //     _this.setRedraw();
                // }

                // If we are creating points
                if ($scope.toolsManager.subTool.localeCompare('pointCreation') == 0) {
                    // If there is no point placed there yet
                    if ($scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].points[$scope.keypointEditor.keypointEditorData.indexBeingEdited] === null){
                        $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].points[$scope.keypointEditor.keypointEditorData.indexBeingEdited] = new Point([_this.mouse.pos.x, _this.mouse.pos.y]); 
                        $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].cameraPoints[$scope.keypointEditor.keypointEditorData.indexBeingEdited] = _this.toCamera([_this.mouse.pos.x, _this.mouse.pos.y]);   
                        if (!$scope.toolParameters.isPosetrack) $scope.keypointEditor.getEpilines();
                        if ($scope.objectManager.selectedType.type.localeCompare("person") == 0) $scope.toolsManager.switchSubTool(""); // In the case of creating persons this will be useful
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

                _this.mouse.pos.x = mouse.x;
                _this.mouse.pos.y = mouse.y;

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
                    $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].move(dx, dy, _this.pointDragIndex);
                    $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].updateCameraPoints(cameraMouse[0] - cameraDrag[0], cameraMouse[1] - cameraDrag[1], _this.pointDragIndex);
                    // $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].cameraPoints[_this.pointDragIndex] = _this.toCamera([_this.mouse.pos.x, _this.mouse.pos.y]);
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

                return { x: mx, y: my };
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

                    if (_this.activeCamera !== null) {
                        //Redraw background first
                        ctx.drawImage(_this.images[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom], 0, 0, _this.images[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom].width / _this.zoom, _this.images[$scope.timelineManager.slider.value - $scope.toolParameters.frameFrom].height / _this.zoom, 0, 0, canvas.width, canvas.height)
                        
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

                        } else if ($scope.objectManager.selectedObject !== null) { // If there is one object selected, draw only its points
                            if ($scope.toolsManager.subTool.localeCompare("pointCreation") == 0) {
                                // If active, draw guide lines
                                if ($scope.keypointEditor.showGuideLines) _this.drawGuideLines(ctx);
                                
                                // Draw epilines
                                _this.drawEpilines(ctx);

                                if ($scope.keypointEditor.showLabels) {
                                    $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].drawWithLabel(ctx, "green");
                                } else {
                                    $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].draw(ctx, "green");
                                }
                                
                                // // Draw just the tag being edited  
                                // if ($scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].points[$scope.keypointEditor.keypointEditorData.indexBeingEdited] !== null) {
                                //     $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].points[$scope.keypointEditor.keypointEditorData.indexBeingEdited].drawWithText(ctx, "blue", _this.canvasNumber);
                                // }
                            } else if ($scope.toolsManager.subTool.localeCompare("boxCreation") == 0) {
                                // If active, draw guide lines
                                if ($scope.keypointEditor.showGuideLines) _this.drawGuideLines(ctx);

                                if ($scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].points[0] !== null) {
                                    $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].drawWithLabel(ctx, "blue");
                                }

                            } else {
                                if ($scope.keypointEditor.showLabels) {
                                    $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].drawWithLabel(ctx, "green");
                                } else {
                                    $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1].draw(ctx, "green");
                                }
                                
                            }
                        }
                        
                        // Last thing, always draw the camera name in the top left corner of the canvas
                        _this.drawCameraName(_this.ctx);

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
                        var zoom = _this.zoom;
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

            // Set Epiline
            _this.setEpiline = function(el1, el2, color, number) {
                // Create Epiline object
                _this.epilinesManager[number] = new Epiline(_this.toImage(el1), _this.toImage(el2), color);
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

            // Projects the keypointCreationData if needed
            _this.projectKeypointEditorData = function(frame) {
                $scope.keypointEditor.keypointEditorData.shapes[_this.canvasNumber - 1] = _this.objects2D.objects[$scope.keypointEditor.keypointEditorData.searchUID.toString()].frames[frame - $scope.toolParameters.frameFrom].shape;
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
                var labels = $scope.objectManager.objectTypes[type.toString()].labels.slice();

                if (type.localeCompare("personAIK") == 0) {
                    newObject = new PersonAIK(uid, imgPoints, points, labels);         
                } else if (type.localeCompare("bbox") == 0|| type.localeCompare("bbox_head") == 0) {
                    newObject = new BBox(uid, imgPoints, points, labels);
                } else if (type.localeCompare("person") == 0) {
                    newObject = new Person(uid, imgPoints, points, labels);
                } else if (type.localeCompare("poseAIK") == 0) {
                    newObject = new PoseAIK(uid, imgPoints, points, labels, $scope.objectManager.selectedType.skeleton);
                } else {
                    // Whatever other shapes we may have, polygon, skeleton, etc
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
                    for (var i= startFrame; i <= endFrame; i++) {
                        _this.update2DObject(uid, type, i, points[i - $scope.toolParameters.frameFrom]);
                    }
                }
                // Select only the active type
                var selectedType = $scope.objectManager.selectedType;

                for (obj in selectedType.objects) {
                    var object = selectedType.objects[obj.toString()];
                    var points = [];
                    
                    // Crate the structure to project
                    for (var i=0; i < object.frames.length; i++) {
                        points.push(object.frames[i].keypoints);
                    }


                    toolSrvc.projectToCamera(object.uid, object.type, points, $scope.toolParameters.frameFrom, $scope.toolParameters.frameTo, _this.activeCamera.filename, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, callbackProjection, $scope.messagesManager.sendMessage);
                }              
            }

            // Project one object defined by objectUid
            _this.projectObject = function(objectUID, objectType, frameFrom, frameTo) {
                var callbackProjection = function(uid, type, startFrame, endFrame, points) {
                    for (var i= startFrame; i <= endFrame; i++) {
                        _this.update2DObject(uid, type, i, points[i - startFrame]);
                    }          
                }
                //var object = $scope.objectManager.objectTypes[objectType.toString()].objects[objectUID.toString()];
                var object = $scope.objectManager.selectedType.objects[objectUID.toString()]
                var points = [];

                // Crate the structure to project
                for (var i=frameFrom; i <= frameTo; i++) {
                    points.push(object.frames[i - $scope.toolParameters.frameFrom].keypoints);
                }

                toolSrvc.projectToCamera(object.uid, object.type, points, frameFrom, frameTo, _this.activeCamera.filename, $scope.toolParameters.activeDataset.name, $scope.toolParameters.activeDataset.type, callbackProjection, $scope.messagesManager.sendMessage);
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

            // Puts the active camera in the array of cameras
            _this.removeCamera = function() {
                if (_this.activeCamera !== null) {
                    $scope.loadedCameras.push(_this.activeCamera); // Store actual camera
                    _this.activeCamera = null; // Set canvas camera to null
                }
            }

            // Returns true if the canvas has an active camera
            _this.hasActiveCamera = function() {
                return _this.activeCamera !== null;
            }

            // Returns the active camera
            _this.getActiveCamera = function() {
                return _this.activeCamera;
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
        $scope.actionManager.getActivitiesList();
        $scope.camerasManager = new CamerasManager();

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

        document.getElementById("ActionCreationDropdown").addEventListener('click', function (event) { 
            event.stopPropagation(); 
        });
        
        document.getElementById("NumberOfCanvasesDropdown").addEventListener('click', function (event) { 
            event.stopPropagation(); 
        });
        
        // Watcher to update the canvas image
        $scope.$watch("timelineManager.slider.value", function() {
            if ($scope.keypointEditor.editorActive) $scope.keypointEditor.openEditor($scope.objectManager.selectedObject, $scope.timelineManager.slider.value);
            $scope.canvasesManager.redrawCanvases();
        });



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

        /////////
        // KEYBINDINGS
        /////////
        hotkeys.bindTo($scope).add({
                combo: 'right',
                description: 'Go to the next frame',
                callback: function() { $scope.timelineManager.nextFrame() }
            })
            .add({
                combo: 'left',
                description: 'Go to the previous frame',
                callback: function() { $scope.timelineManager.previousFrame() }
            })
            .add({
                combo: 'space',
                description: 'Play/Pause',
                callback: function() { $scope.timelineManager.switchPlay() }
            })
            // TODO: Fix this when we have editor tab
            .add({
                combo: 's',
                description: 'Save annotation',
                callback: function() { //check if the keypoint editor is open and then save
                    if ($scope.keypointEditor.editorActive === true) {
                        $scope.commonManager.updateAnnotation();
                    }
                }
            })
            .add({
                combo: 'd',
                description: 'Delete annotation',
                callback: function() { //check if the keypoint editor is open and then save
                    if ($scope.keypointEditor.editorActive === true) {
                        $scope.commonManager.deleteAnnotation();
                    }
                }
            });

        /////////
        // END OF KEYBINDINGS 
        /////////
    }
]);
