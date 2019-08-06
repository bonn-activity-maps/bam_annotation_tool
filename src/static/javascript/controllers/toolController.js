angular.module('CVGTool')

.controller('toolCtrl', ['$scope', '$state', '$interval', '$mdDialog', 'toolSrvc', 'navSrvc', '$stateParams',
    function($scope, $state, $interval, $mdDialog, toolSrvc, navSrvc, $stateParams) {
        // Parameters received from the task
        $scope.frameFrom = $stateParams.obj.from;
        $scope.frameTo = $stateParams.obj.to;
        $scope.numberOfFrames = $scope.frameTo - $scope.frameFrom; // TODO: hardcoded for the time being

        // Convert the interval of frames in a list of friends
        $scope.getListOfFrameNumbers = function() {
            var frames = [];
            for (var i = $scope.frameFrom; i <= $scope.frameTo; i++) {
                frames.push(i);
            }
            return frames;
        }

        $scope.frameList = $scope.getListOfFrameNumbers();

        // Enable tooltips
        $(function() {
            $('[data-toggle="tooltip"]').tooltip()
        })

        //////// TOOLS
        $scope.tool = 'navigation'; // navigation = Normal
        // keypoint = Key-Point mode

        $scope.subTool = ''; // Subtool inside tool, for example "addKeypoint";
        $scope.keyPointManagerTab = false; // Boolean to control if the keypoint edit panel is activated
        $scope.keyPointEditorTab = false; // Boolean to control if the keypoint editor panel is activated
        $scope.keyPointEditorEditFlag = false;
        $scope.actionsEditorTab = false; // Boolean to control if the action editor panel is activated


        // Switches the value of the secondary tool
        $scope.switchSubTool = function(sT) {
            if ($scope.subTool.localeCompare(sT) == 0) {
                $scope.subTool = '';
                return;
            }
            $scope.subTool = sT;
        };


        // Switches the value of the principal tool
        $scope.switchTool = function(newTool) {
            $scope.tool = newTool
            $scope.subTool = '';

            if ($scope.tool.localeCompare("keypoint") == 0) {
                $scope.openKeyPointManager();
            }
        };

        // Auxiliar function to swith between number of canvases
        function cleanCanvasContainerElement() {
            var canvasContainer = document.getElementById("canvas-container");
            while (canvasContainer.firstChild) {
                canvasContainer.removeChild(canvasContainer.firstChild);
            }
        }

        // Function that opens the panel to edit keypoints
        $scope.openKeyPointEditor = function(object, frame) {
            $scope.keyPointEditorTab = true;
            $scope.objectManager.selectedObject = object;
            $scope.slider.value = frame;
            for (var i = 0; i < $scope.canvases.length; i++) {
                $scope.canvases[i].setRedraw();
            }
        }

        $scope.switchKeyPointEditorEditFlag = function() {
            $scope.keyPointEditorEditFlag = !$scope.keyPointEditorEditFlag;
        }

        // Function that closes the panel to edit keypoints
        $scope.closeKeyPointEditor = function() {
            $scope.keyPointEditorTab = false;
            $scope.keyPointEditorEditFlag = false;
            $scope.objectManager.selectedObject = null; // De-select the selected object when closing the panel
            for (var i = 0; i < $scope.canvases.length; i++) {
                $scope.canvases[i].setRedraw();
            }
        }

        // Function that opens the panel to manage keypoints
        $scope.openKeyPointManager = function() {
            $scope.keyPointManagerTab = true;
            keyPointManagerPanel = document.getElementById("keyPointManagerPanel");
            keyPointManagerPanel.style.top = '200 px;';
            keyPointManagerPanel.style.left = '200 px;';
        }

        // Function that closes the panel to manage keypoints
        $scope.closeKeyPointManager = function() {
            $scope.keyPointManagerTab = false;
            $scope.tool = '';
        }


        // Auxiliar function to swith between number of canvases
        function cleanCanvasContainerElement() {
            var canvasContainer = document.getElementById("canvas-container");
            while (canvasContainer.firstChild) {
                canvasContainer.removeChild(canvasContainer.firstChild);
            }
        }

        // Function to set the new canvas distribution reconstructing HTML
        function setCanvasDistribution(numCanvases) {
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
                    canvasE1.setAttribute("style", "border:1px solid" + $scope.canvasesColors[0] + ";");
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
                    canvasE1.setAttribute("style", "border:1px solid" + $scope.canvasesColors[0] + ";");
                    var canvasE2 = document.createElement("canvas");
                    canvasE2.classList.add("playable-canvas");
                    canvasE2.setAttribute("id", "canvas2");
                    canvasE2.setAttribute("style", "border:1px solid" + $scope.canvasesColors[1] + ";");
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
                    canvasE1.setAttribute("style", "border:1px solid" + $scope.canvasesColors[0] + ";");
                    var canvasE2 = document.createElement("canvas");
                    canvasE2.classList.add("playable-canvas");
                    canvasE2.setAttribute("id", "canvas2");
                    canvasE2.setAttribute("style", "border:1px solid" + $scope.canvasesColors[1] + ";");
                    var canvasE3 = document.createElement("canvas");
                    canvasE3.classList.add("playable-canvas");
                    canvasE3.setAttribute("id", "canvas3");
                    canvasE3.setAttribute("style", "border:1px solid #A66BFF;");
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
                    canvasE1.setAttribute("style", "border:1px solid" + $scope.canvasesColors[0] + ";");
                    var canvasE2 = document.createElement("canvas");
                    canvasE2.classList.add("playable-canvas");
                    canvasE2.setAttribute("id", "canvas2");
                    canvasE2.setAttribute("style", "border:1px solid" + $scope.canvasesColors[1] + ";");
                    var canvasE3 = document.createElement("canvas");
                    canvasE3.classList.add("playable-canvas");
                    canvasE3.setAttribute("id", "canvas3");
                    canvasE3.setAttribute("style", "border:1px solid" + $scope.canvasesColors[2] + ";");
                    var canvasE4 = document.createElement("canvas");
                    canvasE4.classList.add("playable-canvas");
                    canvasE4.setAttribute("id", "canvas4");
                    canvasE4.setAttribute("style", "border:1px solid" + $scope.canvasesColors[3] + ";");
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


        // Function that changes the number of canvases two show in the tool
        $scope.switchNumberOfCanvases = function(newNumber) {
            if ($scope.numberOfCanvases == newNumber) return; // If no change, exit

            // Save all active cameras
            for (var i = 0; i < $scope.numberOfCanvases; i++) {
                if ($scope.canvases[i].hasActiveCamera()) {
                    $scope.tempCameraStorage[i] = $scope.canvases[i].getActiveCamera();
                }
            }

            // Clear the whole html element
            cleanCanvasContainerElement();

            // Create the whole html element again
            setCanvasDistribution(newNumber);

            // Update number of canvases
            $scope.numberOfCanvases = newNumber;

            // Get the canvas objects again
            $scope.initializeCanvases();

            // Put the cameras in the canvas where they were
            for (var i = 0; i < $scope.numberOfCanvases; i++) {
                if ($scope.tempCameraStorage[i] !== null) {
                    $scope.switchVideo($scope.tempCameraStorage[i], i + 1);
                    $scope.tempCameraStorage[i] = null;
                }
            }
            // Send the cameras without a canvas to the camera array
            for (var i = $scope.numberOfCanvases; i < $scope.tempCameraStorage.length; i++) {
                if ($scope.tempCameraStorage[i] !== null) {
                    $scope.loadedCameras.push($scope.tempCameraStorage[i]);
                    $scope.tempCameraStorage[i] = null;
                }
            }
        }

        $scope.dragOptions = {}

        $scope.numberOfCanvases = 4; // Number of canvases

        $scope.tempCameraStorage = [null, null, null, null];


        //////// TIMELINE
        // Variables to control the timeline
        $scope.isPlaying = false;
        var promise;

        $scope.slider = { // Options and values for the slider
            value: $scope.frameFrom,
            options: {
                floor: $scope.frameFrom,
                ceil: $scope.frameTo,
                step: 1,
                showTicks: true
            }
        };

        // Function that watches over the value of the slider and calls to redraw the canvases when this variable changes
        $scope.$watch("slider.value", function() {
            $scope.clearNewPoint(1);
            for (var i = 0; i < $scope.canvases.length; i++) {
                $scope.canvases[i].setRedraw();
            }
        });

        // Function that switches "on" and "off" the "play" functionality
        $scope.switchPlay = function() {
            $scope.isPlaying = !$scope.isPlaying;

            if ($scope.isPlaying == true) {
                promise = $interval(function() { $scope.nextFrame(); }, 500);
            } else {
                $interval.cancel(promise);
            }
        }

        // Function that increases the frame of the timeline by 1
        $scope.nextFrame = function() {
            if ($scope.slider.value + 1 > $scope.slider.options.ceil) {
                $scope.slider.value = $scope.slider.options.ceil;
                $scope.isPlaying = false; // If we are in the last frame, stop "playing"
                $interval.cancel(promise); // If we are in the last frame, stop the $interval
            } else {
                $scope.slider.value += 1;
            }
        }

        // Function that decreases the frame of the timeline by 1
        $scope.previousFrame = function() {
            if ($scope.slider.value - 1 < $scope.slider.options.floor) {
                $scope.slider.value = $scope.slider.options.floor;
            } else {
                $scope.slider.value -= 1;
            }
        }

        //////// CAMERAS
        // Variables to control the camera views
        $scope.cameraViewSelected = "";
        $scope.isCameraViewSelected = false;

        // Variables to control the loaded cameras array
        $scope.cameraSelected = "";
        $scope.isCameraSelected = true;
        $scope.loadedCameras = [];
        $scope.recommendedFrames = "";

        /*
         * Structure:
         *    loadedCameras:
         *        cameraX:
         *            arrayOfFrames: []
         *                  image: image
         */

        var getLoadedCameras = function() {
            var cams = [];
            for (var i = 0; i < $scope.loadedCameras.length; i++) {
                cams.push($scope.loadedCameras[i].filename);
            }
            for (var i = 0; i < $scope.canvases.length; i++) {
                if ($scope.canvases[i].hasActiveCamera()) {
                    console.log($scope.canvases[i].getActiveCamera())
                    cams.push($scope.canvases[i].getActiveCamera().filename);
                }
            }
            return cams;
        }

        // Function that opens the dialog in charge of adding a new camera
        $scope.addCamera = function() {
            var cams = getLoadedCameras();
            $mdDialog.show({
                templateUrl: '/static/views/dialogs/addNewCameraDialog.html',
                controller: 'dialogAddNewCameraCtrl',
                escapeToClose: false,
                locals: {
                    frameFrom: $scope.frameFrom,
                    frameTo: $scope.frameTo,
                    loadedCameras: cams
                }
            }).then(function(successData) {
                var filename = successData[0].filename; // Get the name of the camera from the first frame
                var frames = [];

                for (var i = 0; i < successData.length; i++) {
                    var imageData = successData[i].image.slice(2, successData[i].image.length - 1)
                    var stringImage = "data:image/jpeg;base64," + imageData;

                    frames.push({
                        number: successData[i].frame,
                        image: stringImage,
                    });
                }

                // Sort frames once loaded
                frames.sort(function(a, b) {
                    return a.number - b.number;
                });

                // Create new camera
                $scope.loadedCameras.push({
                    filename: filename,
                    frames: frames,
                })
            });
        }



        // Function that opens the dialog in charge of moving one camera to one canvas
        $scope.openSelector = function(video) {
            $mdDialog.show({
                templateUrl: '/static/views/dialogs/cameraSelectorDialog.html',
                controller: 'dialogCameraSelectorCtrl',
                locals: {
                    video: video,
                    canvases: $scope.numberOfCanvases
                },
                escapeToClose: true
            }).then(function(successData) {
                $scope.switchVideo(successData.video, successData.number);

            });
        }

        // Switches the video "video" to the canvas specified by "number"
        $scope.switchVideo = function(video, number) {
            $scope.canvases[number - 1].setCamera(video); // Set the camera

            // When the video is set in a canvas, remove it from the array of loadedCameras
            for (var i = 0; i < $scope.loadedCameras.length; i++) {
                if ($scope.loadedCameras[i].filename.localeCompare(video.filename) == 0) {
                    $scope.loadedCameras.splice(i, 1);
                    break;
                }
            }
        }

        //////// CANVASES
        $scope.canvases = [] // Initial canvas structure
        $scope.canvasesColors = ["#FF2D26", "#5673E8", "#A66BFF", "#51FF2D"]
        $scope.newPoint = {
            point1: [],
            point2: [],
            cam1: "",
            cam2: ""
        }

        // Function that resets the new point temporal variable
        $scope.clearNewPoint = function(number) {
            if (number == 1) {
                $scope.newPoint.point1 = [];
                $scope.newPoint.cam1 = "";
                $scope.newPoint.point2 = [];
                $scope.newPoint.cam2 = "";
            } else if (number == 2) {
                $scope.newPoint.point2 = [];
                $scope.newPoint.cam2 = "";
            }

            for (var i = 0; i < $scope.canvases.length; i++) {
                $scope.canvases[i].resetEpiline();
                $scope.canvases[i].setRedraw();

            }
        }

        // Object that controls the canvas and stores its state
        function CanvasObject(canvas, number) {
            //----- SETUP -----//
            this.canvasNumber = number;
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('2d')
            this.image = null;
            this.images = [];

            // Make it visually fill the positioned parent
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';

            // ...then set the internal size to match
            this.canvas.width = canvas.offsetWidth;
            this.canvas.height = canvas.offsetHeight;

            // Some pages have fixed-position bars (like the stumbleupon bar) at the top or left of the page
            // They will mess up mouse coordinates and this fixes that
            var html = document.body.parentNode;
            this.htmlTop = html.offsetTop;
            this.htmlLeft = html.offsetLeft;

            //----- STATE TRACKING -----//
            this.activeCamera = null;
            this.valid = true; // when set to true, the canvas will redraw everything
            this.dragging = false; // Keep track of when we are dragging
            this.selection = null; // Current selected object

            //----- 2D Projections -----//
            this.objectsIn2D;
            this.showEpiline = false;
            this.epiline = null; // Object that contains the epiline
            this.el1 = []
            this.el2 = []
            this.isOverEpiline = false; // Controls if the second point lies over the epiline

            // Scale of relation between image and canvas
            this.scale = {
                x: 1,
                y: 1
            }

            // Mouse variable
            this.mouse = {
                pos: { x: 0, y: 0 },
                worldPos: { x: 0, y: 0 },
                posLast: { x: 0, y: 0 },
                dragging: false
            }

            // View transform
            this.m = [1, 0, 0, 1, 0, 0]; // Current view transform
            this.im = [1, 0, 0, 1, 0, 0]; // Current inverse view transform
            this.bounds = {
                top: 0,
                left: 0,
                right: this.canvas.width,
                bottom: this.canvas.height
            }
            this.pos = { x: 0, y: 0 }; // Initial position
            this.wp1 = { x: 0, y: 0 };
            this.wp2 = { x: 0, y: 0 };
            this.dirty = true;

            // To keep track of the zoom
            this.zoom = 1;
            this.maxZoom = 4;
            this.minZoom = 1;

            var canvasObj = this;

            //----- OPTIONS -----//
            this.selectionColor = "#CC0000";
            this.selectionWidth = 2;
            setInterval(function() {
                canvasObj.draw();
            }, 100); // Redraw function

            //----- EVENTS -----//
            // Prevents clicking of selecting text
            canvas.addEventListener('selectstart', function(e) {
                e.preventDefault();
                return false;
            }, false);

            // MouseDown event
            canvas.addEventListener('mousedown', function(e) {
                var mouse = canvasObj.getMouse(e);
                canvasObj.mouse.pos.x = mouse.x;
                canvasObj.mouse.pos.y = mouse.y;

                // If the tool is navigation
                if ($scope.tool.localeCompare('navigation') == 0) {
                    canvasObj.dragging = true;
                }

                // If the subtool is 'Zoom Out'
                if ($scope.subTool.localeCompare('zoomIn') == 0) {
                    canvasObj.zoom += 0.5;
                    canvasObj.constraintZoom();
                    canvasObj.setRedraw();
                }

                // If the subtool is 'Zoom In'
                if ($scope.subTool.localeCompare('zoomOut') == 0) {
                    canvasObj.zoom -= 0.5;
                    canvasObj.constraintZoom();
                    canvasObj.setRedraw();
                }

                // If the subtool is 'addPrimaryPoint'
                if ($scope.subTool.localeCompare('addPrimaryPoint') == 0) {
                    // Add the point to the temporal point storage
                    $scope.newPoint.point1 = canvasObj.toCamera([mouse.x, mouse.y]); // Store the point with camera coordinates
                    $scope.newPoint.cam1 = canvasObj.activeCamera.filename;
                    $scope.switchSubTool("");
                    canvasObj.setRedraw();
                }

                // If the subtool is 'addSecondaryPoint'
                if ($scope.subTool.localeCompare('addSecondaryPoint') == 0) {
                    $scope.newPoint.point2 = canvasObj.toCamera([mouse.x, mouse.y]);
                    $scope.newPoint.cam2 = canvasObj.activeCamera.filename;
                    $scope.switchSubTool("");
                    canvasObj.setRedraw();
                }

            }, true);

            // MouseMove event
            canvas.addEventListener('mousemove', function(e) {
                var mouse = canvasObj.getMouse(e);

                if (canvasObj.dragging) {
                    canvasObj.mouse.posLast.x = canvasObj.mouse.pos.x;
                    canvasObj.mouse.posLast.y = canvasObj.mouse.pos.y;

                    canvasObj.mouse.pos.x = mouse.x;
                    canvasObj.mouse.pos.y = mouse.y;

                    canvasObj.move(canvasObj.mouse.pos.x - canvasObj.mouse.posLast.x, canvasObj.mouse.pos.y - canvasObj.mouse.posLast.y);
                }

            }, true);

            // MouseUp event
            canvas.addEventListener('mouseup', function(e) {
                canvasObj.dragging = false; // Stop dragging
            }, true);

            //----- FUNCTIONS -----//
            // Fits the image to the canvas depending of the zoom

            CanvasObject.prototype.constraintZoom = function() {
                if (this.zoom < this.minZoom) this.zoom = this.minZoom;
                if (this.zoom > this.maxZoom) this.zoom = this.maxZoom;
            }

            // Move the context
            CanvasObject.prototype.move = function(x, y) {
                this.pos.x += x;
                this.pos.y += y;
                this.setRedraw();
            }

            // Returns the coordinates of the mouse of the event e
            CanvasObject.prototype.getMouse = function(e) {
                var rect = this.canvas.getBoundingClientRect();
                var mx = e.clientX - rect.left;
                var my = e.clientY - rect.top;

                return { x: mx, y: my };
            }

            // Function that set the flag to redraw to false
            CanvasObject.prototype.setRedraw = function() {
                this.valid = false;
            }

            // Function that clears the context
            CanvasObject.prototype.clear = function() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }

            // Function that redraws everything associated to the actual canvas
            CanvasObject.prototype.draw = function() {
                if (!this.valid) {
                    this.clear();
                    var ctx = this.ctx;
                    var canvas = this.canvas;

                    if (this.activeCamera !== null) {
                        //Redraw background first
                        ctx.drawImage(this.images[$scope.slider.value - $scope.frameFrom], 0, 0, this.images[$scope.slider.value - $scope.frameFrom].width / this.zoom, this.images[$scope.slider.value - $scope.frameFrom].height / this.zoom, 0, 0, canvas.width, canvas.height)

                        // If we are creating points
                        if ($scope.subTool.localeCompare("addPrimaryPoint") == 0 || $scope.newPoint.point1.length > 0 || $scope.subTool.localeCompare("addSecondaryPoint") == 0 || $scope.newPoint.point2.length > 0) {
                            // Draw the temporal points
                            if ($scope.newPoint.point1.length != 0 && $scope.newPoint.cam1.localeCompare(this.activeCamera.filename) == 0) {
                                var imageCoords = this.toImage($scope.newPoint.point1);
                                this.drawCircle(this.ctx, imageCoords[0], imageCoords[1], 'green');
                            }

                            // Draw epiline if you need to
                            if (this.showEpiline) {
                                this.drawEpiline(this.ctx);
                            }

                            // Draw secondary point if we are with that tool selected and we are over the epiline
                            if ($scope.newPoint.point2.length != 0 && $scope.newPoint.cam2.localeCompare(this.activeCamera.filename) == 0) {
                                var imageCoords = this.toImage($scope.newPoint.point2);
                                this.drawCircle(this.ctx, imageCoords[0], imageCoords[1], 'blue');
                            }
                        } else {
                            // Draw the existing keypoints of personAIK if there is no point selected
                            if ($scope.objectManager.selectedObject == null) {
                                var objects = this.objectsIn2D["personAIK"].objects;
                                for (obj in objects) {
                                    if (objects[obj].frames[$scope.slider.value - $scope.frameFrom].keypoints.length != 0) {
                                        var coords = objects[obj].frames[$scope.slider.value - $scope.frameFrom].keypoints[0];
                                        var imageCoords = this.toImage([coords[0], coords[1]]);
                                        this.drawCircleWithUID(this.ctx, imageCoords[0], imageCoords[1], 'red', objects[obj].uid);
                                    }
                                }
                            } else { // If there is one point selected, just draw it
                                var uid = $scope.objectManager.selectedObject.uid;
                                var type = $scope.objectManager.selectedObject.type;
                                if (this.objectsIn2D[type.toString()].objects[uid.toString()].frames[$scope.slider.value - $scope.frameFrom].keypoints.length > 0) {
                                    var coords = this.objectsIn2D[type.toString()].objects[uid.toString()].frames[$scope.slider.value - $scope.frameFrom].keypoints[0];
                                    var imageCoords = this.toImage([coords[0], coords[1]]);
                                    this.drawCircleWithUID(this.ctx, imageCoords[0], imageCoords[1], 'green', uid);
                                }
                            }
                        }

                        // Last thing, always draw the camera name in the top left corner of the canvas
                        this.drawCameraName(this.ctx);

                    }
                    // Set the camera to valid
                    this.valid = true;
                }
            }

            // Initialization function
            CanvasObject.prototype.init = function() {
                if (this.activeCamera !== null) {
                    for (var i = 0; i < this.activeCamera.frames.length; i++) {
                        var scale = {
                            x: 1,
                            y: 1
                        }
                        var zoom = this.zoom;
                        var ctx = this.ctx;
                        var canvas = this.canvas;

                        var image = new Image();
                        image.onload = function() {
                            scale.x = image.width / canvas.width;
                            scale.y = image.height / canvas.height;
                        };
                        image.src = this.activeCamera.frames[i].image;
                        this.scale = scale;
                        this.images.push(image);
                    }
                    this.valid = false;
                }

            }

            // From image frame to camera frame
            CanvasObject.prototype.toCamera = function(point) {
                var x = point[0] * this.scale.x / this.zoom;
                var y = point[1] * this.scale.y / this.zoom;
                return [x, y]
            }

            // From camera frame to image frame
            CanvasObject.prototype.toImage = function(point) {
                var x = point[0] / this.scale.x * this.zoom;
                var y = point[1] / this.scale.y * this.zoom;
                return [x, y]
            }

            // Distance between two points
            CanvasObject.prototype.distance = function(p1, p2) {
                var a = p1[0] - p2[0]
                var b = p1[1] - p2[1]
                return Math.sqrt(a * a + b * b)
            }

            // Checks if the point (x,y) is over the epiline
            CanvasObject.prototype.isPointInEpiline = function(point) {

            }

            // Draws a circle
            CanvasObject.prototype.drawCircle = function(context, centerX, centerY, color) {
                context.beginPath();
                context.arc(centerX, centerY, 10, 0, 2 * Math.PI, false);
                context.fillStyle = color;
                context.fill();
                context.closePath();
            }

            // Draws a circle with the UID of the object inside
            CanvasObject.prototype.drawCircleWithUID = function(context, centerX, centerY, color, uid) {
                context.beginPath();
                context.arc(centerX, centerY, 10, 0, 2 * Math.PI, false);
                context.fillStyle = color;
                context.fill();
                context.beginPath();
                context.font = "12px sans-serif";
                context.fillStyle = "black";
                context.fillText(uid.toString(), centerX - 8, centerY + 5);
                context.fill();
                context.closePath();
            }

            // Draws the camera name in the top left corner of the canvas
            CanvasObject.prototype.drawCameraName = function(context) {
                context.beginPath();
                context.font = "20px sans-serif";
                context.strokeStyle = "black";
                context.lineWidth = 3;
                context.strokeText(this.activeCamera.filename, 20, 20);
                context.fillStyle = "white";
                context.fillText(this.activeCamera.filename, 20, 20);
                context.fill();
                context.closePath();
            }

            // Set Epiline
            CanvasObject.prototype.setEpiline = function(el1, el2, color) {
                // Store world coordinates
                this.el1 = el1;
                this.el2 = el2;
                this.showEpiline = true;

                // Convert to image coordinates
                var imel1 = this.toImage(el1);
                var imel2 = this.toImage(el2);

                this.epiline = new Path2D();
                this.epiline.moveTo(imel1[0], imel1[1]);
                this.epiline.lineTo(imel2[0], imel2[1]);
                this.epiline.strokeStyle = color;
                this.epiline.lineWidth = 3;
                this.epiline.closePath();

                this.setRedraw();
            }

            // Reset Epiline
            CanvasObject.prototype.resetEpiline = function() {
                this.epiline = null;
                this.showEpiline = false;
            }

            // Draw Epiline
            CanvasObject.prototype.drawEpiline = function(context) {
                context.strokeStyle = this.epiline.strokeStyle;
                context.stroke(this.epiline);
            }

            // Switches the active camera of the Canvas for "camera"
            CanvasObject.prototype.setCamera = function(camera) {
                if (this.activeCamera !== null) {
                    // If there was already a video there, move it back to the loadedCameras array
                    $scope.loadedCameras.push(this.activeCamera);
                }

                // Set the new camera
                this.activeCamera = camera;

                this.images = [];
                this.init();

                // // Proyect the objects to visualize them
                this.projectObjects();

                // Set the flag to redraw
                this.setRedraw();
            }

            // Auxiliar function to update the 2D point values
            CanvasObject.prototype.update2DPoints = function(uid, type, frame, point) {
                // Update the point with its 2D coordinates
                this.objectsIn2D[type.toString()].objects[uid.toString()].frames[frame - $scope.frameFrom].keypoints[0][0] = point[0][0];
                this.objectsIn2D[type.toString()].objects[uid.toString()].frames[frame - $scope.frameFrom].keypoints[0][1] = point[0][1];
                this.objectsIn2D[type.toString()].objects[uid.toString()].frames[frame - $scope.frameFrom].keypoints[0][2] = 0;

                this.setRedraw();
            }

            // Projects all objects in all frames to the actual active camera
            CanvasObject.prototype.projectObjects = function() {
                var callbackProjection = function(canvasNumber, uid, type, frame, point) {
                    $scope.canvases[canvasNumber - 1].update2DPoints(uid, type, frame, point);
                }
                this.objectsIn2D = JSON.parse(JSON.stringify($scope.objectManager.objectTypes)); // Copy the object
                var objectTypes = this.objectsIn2D;
                // Go through all the objectTypes
                for (objectType in objectTypes) {
                    // Go through all the objects of that object type
                    for (obj in objectTypes[objectType].objects) {
                        var object = objectTypes[objectType].objects[obj.toString()];
                        // Go through all frames of that object
                        for (var i = 0; i < object.frames.length; i++) {
                            if (object.frames[i].keypoints.length != 0) {
                                toolSrvc.projectToCamera(object.uid, object.type, object.frames[i].keypoints[0], object.frames[i].frame, this.activeCamera.filename, navSrvc.getActiveDataset().name, this.canvasNumber, callbackProjection);
                            }
                        }
                    }
                }
            }

            // Project one object defined by objectUid
            CanvasObject.prototype.projectObject = function(objectUid, objectType) {
                var callbackProjection = function(canvasNumber, uid, type, frame, point) {
                    $scope.canvases[canvasNumber - 1].update2DPoints(uid, type, frame, point);
                }
                this.objectsIn2D[objectType.toString()].objects[objectUid.toString()] = JSON.parse(JSON.stringify($scope.objectManager.objectTypes[objectType.toString()].objects[objectUid.toString()])); // Copy the object

                var object = this.objectsIn2D[objectType.toString()].objects[objectUid.toString()];
                // Go through all frames of that object
                for (var i = 0; i < object.frames.length; i++) {
                    if (object.frames[i].keypoints.length != 0) {
                        toolSrvc.projectToCamera(object.uid, object.type, object.frames[i].keypoints[0], object.frames[i].frame, this.activeCamera.filename, navSrvc.getActiveDataset().name, this.canvasNumber, callbackProjection);
                    }
                }

            }

            // Puts the active camera in the array of cameras
            CanvasObject.prototype.removeCamera = function() {
                if (this.activeCamera !== null) {
                    $scope.loadedCameras.push(this.activeCamera); // Store actual camera
                    this.activeCamera = null; // Set canvas camera to null
                }
            }

            // Returns true if the canvas has an active camera
            CanvasObject.prototype.hasActiveCamera = function() {
                if (this.activeCamera !== null) {
                    return true;
                } else return false;
            }

            // Returns the active camera
            CanvasObject.prototype.getActiveCamera = function() {
                return this.activeCamera;
            }
        }


        // Initializator of canvases
        $scope.initializeCanvases = function() {
            $scope.canvases = []
            if ($scope.numberOfCanvases >= 1) {
                var canvas1 = document.getElementById('canvas1');
                $scope.canvases.push(new CanvasObject(canvas1, 1))
            }
            if ($scope.numberOfCanvases >= 2) {
                var canvas2 = document.getElementById('canvas2');
                $scope.canvases.push(new CanvasObject(canvas2, 2))
            }
            if ($scope.numberOfCanvases >= 3) {
                var canvas3 = document.getElementById('canvas3');
                $scope.canvases.push(new CanvasObject(canvas3, 3))
            }
            if ($scope.numberOfCanvases >= 4) {
                var canvas4 = document.getElementById('canvas4');
                $scope.canvases.push(new CanvasObject(canvas4, 4))
            }
            if ($scope.activeDataset.type === 'poseTrack') { // If poseTrack type, only one canvas.
                $scope.switchNumberOfCanvases(1); // Change to 1 canvas
            }
        }

        // Object to store all information about the objects. Each position of the array is an object type. Inside each object
        // type we have an "objects" with all the objects of that type
        $scope.objectManager = {
            objectTypes: {},
            selectedType: {},
            selectedObject: null
        };

        // Function that resets the object Manager object
        $scope.resetObjectManager = function() {
            $scope.objectManager = {
                objectTypes: {},
                selectedType: {},
                selectedObject: null
            }
        };

        //                                          //
        //              ACTION MANAGEMENT           //
        //                                          //

        // Object to store information about actions.
        $scope.actionManager = {
            activitiesList: [], // List of possible actions
            actionList: [], // List of actions for the selected object in the selected frames
            selectedType: null, // Selected type of activity to add
            selectedObject: null, // Selected object to edit
            isActionSelected: false, // Set to True when selecting start/stop frames
        };

        // Update activities list
        $scope.getActivitiesList = function() {
            toolSrvc.getActivitiesList(navSrvc.getActiveDataset().type, function(activitiesList) {
                $scope.actionManager.activitiesList = activitiesList.activities;
            });
        };

        // Fetch all actions from database
        $scope.getActionsList = function() {
            $scope.actionManager.actionList = [];
            toolSrvc.getActions(navSrvc.getUser().name, $scope.frameFrom, $scope.frameTo, navSrvc.getActiveDataset().name,
                function(actionList) {
                    $scope.actionManager.actionList = actionList;
                })
        };

        // Fetch all actions of an Object from database
        $scope.getActionsListByUID = function(objectUID) {
            $scope.actionManager.actionList = [];
            toolSrvc.getActionsByUID(navSrvc.getUser().name, objectUID,
                $scope.frameFrom, $scope.frameTo, navSrvc.getActiveDataset().name,
                function(actionList) {
                    $scope.actionManager.actionList = actionList;
                    console.log(actionList)
                })
        };

        // Function that opens the panel to edit actions
        $scope.openActionsEditor = function(object) {
            $scope.actionsEditorTab = true;
            $scope.actionManager.selectedObject = object;
            $scope.getActionsListByUID(object.uid);
        };

        // Function that closes the panel to edit actions
        $scope.closeActionsEditor = function() {
            $scope.actionsEditorTab = false;
            $scope.actionManager.selectedObject = null; // De-select the selected object when closing the panel
        };

        // Create a new blank action
        $scope.createNewAction = function() {
            if ($scope.actionManager.selectedType == null) {
                window.alert("Select an activity first.")
            } else {
                $scope.actionManager.actionList.push({
                    name: $scope.actionManager.selectedType,
                    objectUID: $scope.actionManager.selectedObject.uid,
                    startFrame: null,
                    endFrame: null,
                    dataset: navSrvc.getActiveDataset().name,
                    user: navSrvc.getUser().name
                })
            }
        };

        // Remove an existent action
        $scope.removeAction = function(action, object) {
            if (action.startFrame == null || action.endFrame == null) {
                $scope.actionManager.actionList.pop();
                $scope.actionManager.isActionSelected = false;
            } else {
                toolSrvc.removeAction(action.name, action.user, action.objectUID, action.startFrame, action.endFrame, action.dataset,
                    function(response) {
                        $scope.getActionsListByUID($scope.actionManager.selectedObject.uid);
                    })
            }
        };

        // Function to select time frame for an action. Creates the new action in the backend when selecting the stop frame.
        $scope.selectActionFrame = function(frame, action) {
            if (!$scope.actionManager.isActionSelected) {
                $scope.actionManager.isActionSelected = true;
                action.startFrame = frame;
            } else {
                action.endFrame = frame;
                toolSrvc.createAction(navSrvc.getUser().name, action.startFrame, frame, action.name,
                    action.objectUID, navSrvc.getActiveDataset().name, $scope.createActionSuccess,
                    $scope.createActionError);
                $scope.actionManager.isActionSelected = false;
            }
        };

        // Callback for success in create Action
        $scope.createActionSuccess = function(data) {
            console.log(data)
        };
        // Callback for error in create Action
        $scope.createActionError = function(data) {
            console.log(data)
        };

        //                                          //
        //          END ACTION MANAGEMENT           //
        //                                          //

        // Callback function for creating a new object
        var callbackCreateNewObject = function(newUid, type) {
            // Add the new object to the object Manager
            $scope.objectManager.objectTypes[type.toString()].objects[newUid.toString()] = {
                uid: newUid,
                type: type,
                frames: []
            }

            // Fill the frames array with an empty array for each frame
            for (var j = 0; j <= $scope.numberOfFrames; j++) {
                $scope.objectManager.objectTypes[type.toString()].objects[newUid.toString()].frames.push({
                    frame: $scope.frameFrom + j,
                    keypoints: [],
                    actions: []
                })
            }

            // Update the selected type in the object manager
            $scope.objectManager.selectedType = $scope.objectManager.objectTypes[type.toString()];

            $scope.refreshProjectionOfCanvases();
        }


        // Callback function of get epiline
        var callbackGetEpiline = function(elPoints, cam2Index, cam1Index) {
            $scope.canvases[cam2Index].setEpiline(elPoints.el1, elPoints.el2, $scope.canvasesColors[cam1Index]);
        }

        // Function that manages the epiline calculation
        $scope.getEpilines = function() {
            // Check if the first point is placed
            if ($scope.newPoint.point1.length == 0) {
                window.alert("You have to place the point 1 first!");
                return;
            }
            var camera1Index = 0;
            // Get which camera am I
            for (var i = 0; i < $scope.canvases.length; i++) {
                var camera = $scope.canvases[i].getActiveCamera();
                if (camera.filename.localeCompare($scope.newPoint.cam1) == 0) {
                    camera1Index = i;
                    break;
                }
            }

            var counter = 0;
            for (var i = 0; i < $scope.canvases.length; i++) {
                if ($scope.canvases[i].hasActiveCamera()) {
                    var camera = $scope.canvases[i].getActiveCamera();
                    if (camera.filename.localeCompare($scope.newPoint.cam1) != 0) {
                        toolSrvc.getEpiline($scope.slider.value, navSrvc.getActiveDataset().name, $scope.newPoint.point1, $scope.newPoint.cam1, $scope.canvases[i].getActiveCamera().filename, i, camera1Index, callbackGetEpiline);
                        counter++;
                    }
                }
            }

            if (counter == 0) {
                window.alert("You need at least 2 active cameras!")
            }
        }

        $scope.refreshProjectionOfCanvases = function() {
            for (var i = 0; i < $scope.canvases.length; i++) {
                if ($scope.canvases[i].hasActiveCamera()) {
                    $scope.canvases[i].projectObjects();
                }
            }
        }

        $scope.refreshProjectionOfCanvasesByUID = function(objectUid, objectType) {
            for (var i = 0; i < $scope.canvases.length; i++) {
                if ($scope.canvases[i].hasActiveCamera()) {
                    $scope.canvases[i].projectObject(objectUid, objectType);
                }
            }
        }

        // Callback function of triangulate
        var updateAnnotationCallback = function(objectUid, objectType, frameTo) {
            window.alert("Annotation updated!");
            $scope.clearNewPoint(1);
            $scope.interpolate(objectUid, objectType, frameTo);

            // Refresh the selected object so the table of annotations updates
            var selected = $scope.objectManager.selectedType.type;
            $scope.objectManager.selectedType = $scope.objectManager.objectTypes[selected];
        }

        // Function that triangulates the 3D point given the 2D points
        $scope.updateAnnotation = function() {
            if ($scope.newPoint.point1.length != 0 && $scope.newPoint.point2.length != 0) {
                // Go to triangulate
                toolSrvc.updateAnnotation(navSrvc.getUser().name, navSrvc.getActiveDataset(), navSrvc.getActiveDataset().name, $scope.slider.value, $scope.objectManager.selectedObject, $scope.newPoint.point1, $scope.newPoint.point2, $scope.newPoint.cam1, $scope.newPoint.cam2, updateAnnotationCallback);
            } else window.alert("You need to place point 1 and 2 (in two different cameras)");
        }

        // Function that creates a new object
        $scope.createNewObject = function() {
            toolSrvc.createNewObject(navSrvc.getUser().name, navSrvc.getActiveDataset().name, navSrvc.getActiveDataset().name, $scope.objectManager.selectedType.type, $scope.slider.value, callbackCreateNewObject);
        }

        // Auxiliar callback function for the interpolation
        var callbackInterpolate = function(objectUid) {
            $scope.retrieveAnnotation(objectUid);
        }

        // Function that interpolates (if possible) between the created point and the closest previous point
        $scope.interpolate = function(objectUid, objectType, frameTo) {
            if (frameTo == 1) callbackInterpolate(objectUid); // If its not possible to interpolate, jump this step

            // Find the closest previous annotated frame for that object
            var object = $scope.objectManager.objectTypes[objectType.toString()].objects[objectUid.toString()];
            var frameFrom = null;
            for (var i = frameTo - 1; i >= Math.max(0, frameTo - 5); i--) {
                if (object.frames[i - $scope.frameFrom].keypoints.length > 0) {
                    frameFrom = i;
                    break;
                }
            }

            // Interpolate if possible
            if (frameFrom != null) {
                toolSrvc.interpolate(navSrvc.getUser().name, navSrvc.getActiveDataset().name, navSrvc.getActiveDataset().name, frameFrom, frameTo, objectUid, callbackInterpolate);
            } else callbackInterpolate(objectUid);

        }

        // Callback function to fill the availableObjects array with the retrieved data
        var callbackSuccessRetrieveAvailableObjectTypes = function(obj) {
            $scope.resetObjectManager();
            for (var i = 0; i < obj.length; i++) {
                $scope.objectManager.objectTypes[obj[i].type] = {
                    type: obj[i].type,
                    datasetType: obj[i].datasetType,
                    numKeypoints: obj[i].numKeypoints,
                    labels: obj[i].labels,
                    objects: {}
                }
            }
            $scope.retrieveObjects();
        }

        // Retrieve available objects and fill the array
        $scope.retrieveAvailableObjectTypes = function() {
            toolSrvc.retrieveAvailableObjectTypes(navSrvc.getActiveDataset().type, callbackSuccessRetrieveAvailableObjectTypes);
        }


        // Callback function for retrieving one object
        var callbackRetrievingFrameObject = function(annotation, frame) {
            if (angular.equals({}, annotation)) return; // Check if we received something
            $scope.objectManager.objectTypes[annotation.type.toString()].objects[annotation.uid.toString()].frames[frame - $scope.frameFrom].keypoints = annotation.keypoints;
            $scope.refreshProjectionOfCanvasesByUID(annotation.uid, annotation.type);
        }

        // Function that returns the annotations defined by objectUid
        $scope.retrieveAnnotation = function(objectUid) {
            for (var i = 0; i < $scope.frameList.length; i++) {
                toolSrvc.getAnnotationOfFrameByUID(navSrvc.getUser().name, navSrvc.getActiveDataset().name, navSrvc.getActiveDataset().name, objectUid, $scope.frameList[i], callbackRetrievingFrameObject);
            }
        }

        // Callback function for retrieving the existing objects
        var callbackRetrieveObjects = function(objects) {
            for (obj in objects) {
                var object = objects[obj].object;
                $scope.objectManager.objectTypes[object.type.toString()].objects[object.uid.toString()] = {
                    uid: object.uid,
                    type: object.type,
                    frames: []
                }

                // Fill the frames array with an empty array for each frame
                for (var j = 0; j <= $scope.numberOfFrames; j++) {
                    $scope.objectManager.objectTypes[object.type.toString()].objects[object.uid.toString()].frames.push({
                        frame: $scope.frameFrom + j,
                        keypoints: []
                    })
                }
            }

            $scope.retrieveAnnotations();
        }

        $scope.retrieveObjects = function() {
            toolSrvc.retrieveObjects(navSrvc.getActiveDataset().name, navSrvc.getActiveDataset().name, navSrvc.getUser().name, callbackRetrieveObjects);
        }

        // TODO: Temporal function to retrieve objects, when tasks exist, this will only be called one before entering the tool
        var callbackRetrievingFrameObjects = function(annotation) {
            if (angular.equals({}, annotation)) return; // Check if we received something

            var frame = annotation.frame; // Read the frame

            for (var i = 0; i < annotation.objects.length; i++) {
                // if ($scope.objectManager.objectTypes[annotation.objects[i].type.toString()].objects[annotation.objects[i].uid.toString()] === undefined) { // If the object is not stored
                //     $scope.objectManager.objectTypes[annotation.objects[i].type.toString()].objects[annotation.objects[i].uid.toString()] = {
                //         uid: annotation.objects[i].uid,
                //         type: annotation.objects[i].type,
                //         frames: []
                //     }

                //     // Fill the frames array with an empty array for each frame
                //     for (var j = 0; j <= $scope.numberOfFrames; j++) {
                //         $scope.objectManager.objectTypes[annotation.objects[i].type.toString()].objects[annotation.objects[i].uid.toString()].frames.push({
                //             frame: $scope.frameFrom + j,
                //             keypoints: [],
                //             actions: []
                //         })
                //     }
                // }

                // In any case, store in that frame the keypoints, the frame number and the actions
                $scope.objectManager.objectTypes[annotation.objects[i].type.toString()].objects[annotation.objects[i].uid.toString()].frames[frame - $scope.frameFrom].keypoints = annotation.objects[i].keypoints;
                $scope.objectManager.objectTypes[annotation.objects[i].type.toString()].objects[annotation.objects[i].uid.toString()].frames[frame - $scope.frameFrom].frame = frame;

            }
            $scope.refreshProjectionOfCanvases();
        }

        // Function that return the available objects
        $scope.retrieveAnnotations = function() {
            dataset = navSrvc.getActiveDataset();

            if (dataset.type.localeCompare("poseTrack") == 0) { // Check the dataset type to select the correct value for "scene"
                for (var i = 1; i <= $scope.numberOfFrames; i++) {
                    // toolSrvc.getAnnotationOfFrame($scope.videoSelected.name, frame, dataset.name, navSrvc.getUser().name, callbackRetrievingFrameObjects);
                    console.log("Posetrack not done yet!")
                }
            } else if (dataset.type.localeCompare("actionInKitchen") == 0) {
                for (var i = 0; i < $scope.frameList.length; i++) {
                    toolSrvc.getAnnotationOfFrame(dataset.name, $scope.frameList[i], dataset.name, navSrvc.getUser().name, callbackRetrievingFrameObjects);
                }
            }
        }
        $scope.retrieveAvailableObjectTypes();
        $scope.initializeCanvases();
        $scope.getActivitiesList();
    }
]);