angular.module('CVGTool')

.controller('toolCtrl', ['$scope', '$state', '$interval', '$mdDialog', 'toolSrvc', 'navSrvc', '$stateParams',
    function($scope, $state, $interval, $mdDialog, toolSrvc, navSrvc, $stateParams) {
        // Parameters received from the task
        $scope.frameFrom = $stateParams.obj.from;
        $scope.frameTo = $stateParams.obj.to;
        $scope.numberOfFrames = $scope.frameTo - $scope.frameFrom;
        $scope.activeDataset = navSrvc.getActiveDataset(); // Get the active dataset information

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

            // Create data structure for the editor
            $scope.keypointEditorData = [];
            var labels = $scope.objectManager.objectTypes[$scope.objectManager.selectedObject.type].labels;
            var points = $scope.objectManager.selectedObject.frames[frame - $scope.frameFrom].keypoints;
            var pointStructure = null;

            // Check the dataset type
            if ($scope.activeDataset.type.localeCompare("poseTrack") === 0) {
                pointStructure = {
                    label: "",
                    points: [
                        []
                    ],
                    cameras: [""]
                }

                // Fill the keypointEditor data structure
                for (var i = 0; i < labels.length; i++) {
                    var label = labels[i];
                    var ps = JSON.parse(JSON.stringify(pointStructure))
                    ps.label = label;
                    ps.points[0] = points[i];
                    ps.cameras[0] = $scope.canvases[0].activeCamera.filename;
                    $scope.keypointEditorData.push(ps);
                }

            } else if ($scope.activeDataset.type.localeCompare("actionInKitchen") === 0) {
                pointStructure = {
                    label: "",
                    point3D: [],
                    points: [
                        [],
                        [],
                        [],
                        []
                    ],
                    cameras: ["", "", "", ""]
                }

                // Fill same way as on top
                for (var i = 0; i < labels.length; i++) {
                    var label = labels[i];
                    var ps = JSON.parse(JSON.stringify(pointStructure));
                    ps.label = label;
                    ps.point3D = points; // TODO: change the retrieval of points to be [[],[],[],[],[] etc.] and use points[i]
                    $scope.keypointEditorData.push(ps);
                }
            }



            // Set redraw to draw the selected object
            for (var i = 0; i < $scope.canvases.length; i++) {
                $scope.canvases[i].setRedraw();
            }
        }

        // Function that closes the panel to edit keypoints
        $scope.closeKeyPointEditor = function() {
            $scope.keyPointEditorTab = false;
            $scope.tool = "";
            $scope.subTool = "";
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
            if ($scope.keyPointEditorTab) $scope.openKeyPointEditor($scope.objectManager.selectedObject, $scope.slider.value);
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
                    cams.push($scope.canvases[i].getActiveCamera().filename);
                }
            }
            return cams;
        };

        var callbackRetrievingFrame = function(image, filename, frame) {
            var imageData = image.slice(2, image.length - 1) // Process the image
            var stringImage = "data:image/jpeg;base64," + imageData;

            // First search for the camera in the loadedCameras panel
            for (var i = 0; i < $scope.loadedCameras.length; i++) {
                if ($scope.loadedCameras[i].filename.localeCompare(filename) == 0) { // Find the camera
                    $scope.loadedCameras[i].frames[frame - $scope.frameFrom] = {
                        number: frame,
                        image: stringImage,
                    }
                }
            }

            // In case we couldn't find the camera in the loadedCameras panel, we seach for it in the canvases
            for (var i = 0; i < $scope.canvases.length; i++) {
                if ($scope.canvases[i].hasActiveCamera()) {
                    if ($scope.canvases[i].activeCamera.filename.localeCompare(filename) == 0) {
                        $scope.canvases[i].activeCamera.frames[frame - $scope.frameFrom] = {
                            number: frame,
                            image: stringImage,
                        }
                        $scope.canvases[i].createImage(frame - $scope.frameFrom);
                    }
                }
            }


            // After all frames have loaded, call retrieve objects in PT
            if (frame.localeCompare($scope.frameTo.toString()) === 0 &&
                $scope.activeDataset.type.localeCompare("poseTrack") === 0) {
                $scope.retrieveObjectsPT();
            }
        };

        // Function that opens the dialog in charge of adding a new camera
        $scope.addCamera = function() {
            var cams = getLoadedCameras();
            $mdDialog.show({
                templateUrl: '/static/views/dialogs/addNewCameraDialog.html',
                controller: 'dialogAddNewCameraCtrl',
                escapeToClose: false,
                locals: {
                    loadedCameras: cams
                }
            }).then(function(successData) {
                // First, create the structure for the new cameras
                for (var i = 0; i < successData.videos.length; i++) {
                    $scope.loadedCameras.push({
                        filename: successData.videos[i],
                        frames: [],
                    })

                    // Push empty frame spaces
                    for (var j = 0; j < $scope.numberOfFrames; j++) {
                        $scope.loadedCameras[i].frames.push({})
                    }
                }

                // Then, make all the frame requests
                for (var i = 0;
                    ($scope.frameFrom + i) <= $scope.frameTo; i++) {
                    for (var j = 0; j < successData.videos.length; j++) {
                        toolSrvc.getFrame(successData.videos[j], $scope.frameFrom + i, $scope.activeDataset.name,
                            $scope.activeDataset.type, callbackRetrievingFrame);
                    }
                }
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

        $scope.keypointEditorData = []
        $scope.pointCreationData = {
            labelIndex: null,
            pID: null,
            cameraID: null
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
            this.epiline = null; // Object that contains the epiline
            this.epilinesManager = {
                "1": {
                    epiline: null,
                    el1: [],
                    el2: [],
                    showEpiline: false
                },
                "2": {
                    epiline: null,
                    el1: [],
                    el2: [],
                    showEpiline: false
                },
                "3": {
                    epiline: null,
                    el1: [],
                    el2: [],
                    showEpiline: false
                },
                "4": {
                    epiline: null,
                    el1: [],
                    el2: [],
                    showEpiline: false
                }
            }

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

                if ($scope.subTool.localeCompare('createPoint') == 0) {
                    $scope.keypointEditorData[$scope.pointCreationData.labelIndex].points[$scope.pointCreationData.pID] = canvasObj.toCamera([mouse.x, mouse.y]); // Store the point with camera coordinates
                    $scope.keypointEditorData[$scope.pointCreationData.labelIndex].cameras[$scope.pointCreationData.pID] = canvasObj.activeCamera.filename;
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
                        if ($scope.subTool.localeCompare("createPoint") == 0) {
                            // Draw the temporal points
                            var colors = ["green", "blue", "red", "orange"];

                            // Draw points if they exist and they are placed in the actual camera
                            for (var i = 0; i < $scope.keypointEditorData[$scope.pointCreationData.labelIndex].points.length; i++) {
                                if ($scope.keypointEditorData[$scope.pointCreationData.labelIndex].points[i] !== null && $scope.keypointEditorData[$scope.pointCreationData.labelIndex].points[i] !== undefined && $scope.keypointEditorData[$scope.pointCreationData.labelIndex].cameras[i].localeCompare(this.activeCamera.filename) == 0) {
                                    var imageCoords = this.toImage($scope.keypointEditorData[$scope.pointCreationData.labelIndex].points[i]);
                                    this.drawCircle(this.ctx, imageCoords[0], imageCoords[1], colors[i]);
                                }

                            }

                            // Draw epiline if needed
                            for (el in this.epilinesManager) {
                                if (this.epilinesManager[el].showEpiline == true) {
                                    this.drawEpiline(this.ctx, el)
                                }
                            }
                        } else {
                            if ($scope.objectManager.selectedObject == null) {
                                var objects = null;
                                // Select objects depending on the dataset
                                if ($scope.activeDataset.type.localeCompare("poseTrack") === 0) {
                                    // console.log("Objects in 2D");
                                    // console.log(this.objectsIn2D);
                                    // objects = this.objectsIn2D["person"].objects; //TODO all objects instead of bbox
                                    objects = this.objectsIn2D["bbox"].objects;
                                    // objects.push(this.objectsIn2D["bbox"].objects);
                                    // objects.push(this.objectsIn2D["person"].objects);
                                } else {
                                    // console.log(this.objectsIn2D);
                                    objects = this.objectsIn2D["personAIK"].objects
                                }

                                // Draw objects
                                let j = 0;
                                for (obj in objects) {
                                    if (objects[obj].frames[$scope.slider.value - $scope.frameFrom].keypoints.length !== 0) {
                                        let colors = ["red", "blue", "yellow", "purple", "brown", "white", "grey", "cyan",
                                            "pink", "lilac", "orange", "canary"
                                        ];
                                        for (let i = 0; i < objects[obj].frames[$scope.slider.value - $scope.frameFrom].keypoints.length; i++) {
                                            var coords = objects[obj].frames[$scope.slider.value - $scope.frameFrom].keypoints[i];
                                            var imageCoords = this.toImage([coords[0], coords[1]]);
                                            this.drawCircleWithText(this.ctx, imageCoords[0], imageCoords[1], colors[j], objects[obj].uid);
                                        }
                                    }
                                    j++;
                                }
                            } else { // If there is one object selected, draw only its points
                                for (var i = 0; i < $scope.keypointEditorData.length; i++) {
                                    var label = $scope.keypointEditorData[i].label;
                                    var points = $scope.keypointEditorData[i].points;
                                    var cameras = $scope.keypointEditorData[i].cameras;
                                    var thereArePoints = false;
                                    for (var j = 0; j < points.length; j++) {
                                        if (points[j].length > 0 && cameras[j].localeCompare(this.activeCamera.filename) == 0) {
                                            var imageCoords = this.toImage(points[j]);
                                            thereArePoints = true;
                                            this.drawCircleWithText(this.ctx, imageCoords[0], imageCoords[1], 'green', label);
                                        }
                                    }
                                    if (!thereArePoints) {
                                        var objectKP = this.objectsIn2D[$scope.objectManager.selectedObject.type].objects[$scope.objectManager.selectedObject.uid].frames[$scope.slider.value - $scope.frameFrom];
                                        for (var i = 0; i < objectKP.keypoints.length; i++) {
                                            var imageCoords = this.toImage(objectKP.keypoints[i]);
                                            this.drawCircleWithText(this.ctx, imageCoords[0], imageCoords[1], 'green', label);
                                        }
                                    }
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
                        var canvas = this.canvas;

                        var image = new Image();
                        image.onload = function() {
                            scale.x = image.width / canvas.width;
                            scale.y = image.height / canvas.height;
                        };
                        image.src = this.activeCamera.frames[i].image;
                        this.scale = scale;
                        this.images[i] = image;
                    }
                    this.valid = false;
                }

            }

            // Generates the image of the given frame
            CanvasObject.prototype.createImage = function(frame) {
                var image = new Image();
                image.src = this.activeCamera.frames[frame].image;
                this.images[frame] = image;
                this.valid = false;
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

            // Draws a circle
            CanvasObject.prototype.drawCircle = function(context, centerX, centerY, color) {
                context.beginPath();
                context.arc(centerX, centerY, 10, 0, 2 * Math.PI, false);
                context.fillStyle = color;
                context.fill();
                context.closePath();
            }

            // Draws a circle with the UID of the object inside
            CanvasObject.prototype.drawCircleWithText = function(context, centerX, centerY, color, text) {
                context.beginPath();
                context.arc(centerX, centerY, 10, 0, 2 * Math.PI, false);
                context.fillStyle = color;
                context.fill();
                context.beginPath();
                context.font = "12px sans-serif";
                context.strokeStyle = "black";
                context.lineWidth = 3;
                context.strokeText(text.toString(), centerX - 8, centerY + 5);
                context.fillStyle = "white";
                context.fillText(text.toString(), centerX - 8, centerY + 5);
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
            CanvasObject.prototype.setEpiline = function(el1, el2, color, number) {
                var number = number + 1;
                // Store world coordinates
                this.epilinesManager[number].el1 = el1;
                this.epilinesManager[number].el2 = el2;
                this.epilinesManager[number].showEpiline = true;

                // Convert to image coordinates
                var imel1 = this.toImage(el1);
                var imel2 = this.toImage(el2);

                this.epilinesManager[number].epiline = new Path2D();
                this.epilinesManager[number].epiline.moveTo(imel1[0], imel1[1]);
                this.epilinesManager[number].epiline.lineTo(imel2[0], imel2[1]);
                this.epilinesManager[number].epiline.strokeStyle = color;
                this.epilinesManager[number].epiline.lineWidth = 3;
                this.epilinesManager[number].epiline.closePath();

                this.setRedraw();
            }

            // Reset Epiline
            CanvasObject.prototype.resetEpiline = function(number) {
                this.epilinesManager[number + 1] = {
                    epiline: null,
                    el1: [],
                    el2: [],
                    showEpiline: false
                }
            }

            // Draw Epiline
            CanvasObject.prototype.drawEpiline = function(context, number) {
                context.strokeStyle = this.epilinesManager[number].epiline.strokeStyle;
                context.stroke(this.epilinesManager[number].epiline);
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
                for (var i = 0; i < $scope.numberOfFrames; i++) {
                    this.images.push(null);
                }
                this.init();

                // Project the objects to visualize them if the objects are in 3D
                if ($scope.activeDataset.dim == 3) {
                    this.projectObjects();
                } else if ($scope.activeDataset.dim == 2) { // If we are in 2D already, no need to project them
                    this.objectsIn2D = JSON.parse(JSON.stringify($scope.objectManager.objectTypes));
                }

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
                                toolSrvc.projectToCamera(object.uid, object.type, object.frames[i].keypoints[0], object.frames[i].frame, this.activeCamera.filename, $scope.activeDataset.name, this.canvasNumber, callbackProjection);
                            }
                        }
                    }
                }
            }

            // Project one object defined by objectUid
            CanvasObject.prototype.projectObject = function(objectUid, objectType, frameToProject) {
                var callbackProjection = function(canvasNumber, uid, type, frame, point) {
                    $scope.canvases[canvasNumber - 1].update2DPoints(uid, type, frame, point);
                }
                this.objectsIn2D[objectType.toString()].objects[objectUid.toString()].frames[frameToProject - $scope.frameFrom] = JSON.parse(JSON.stringify($scope.objectManager.objectTypes[objectType.toString()].objects[objectUid.toString()].frames[frameToProject - $scope.frameFrom])); // Copy the object

                var object = this.objectsIn2D[objectType.toString()].objects[objectUid.toString()];

                if (object.frames[frameToProject - $scope.frameFrom].keypoints.length !== 0) {
                    toolSrvc.projectToCamera(object.uid, object.type, object.frames[frameToProject - $scope.frameFrom].keypoints[0], frameToProject, this.activeCamera.filename, $scope.activeDataset.name, this.canvasNumber, callbackProjection);
                } else {
                    this.setRedraw();
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
                return this.activeCamera !== null;
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
            toolSrvc.getActivitiesList($scope.activeDataset.type, function(activitiesList) {
                $scope.actionManager.activitiesList = activitiesList.activities;
            });
        };

        // Fetch all actions from database
        $scope.getActionsList = function() {
            $scope.actionManager.actionList = [];
            toolSrvc.getActions(navSrvc.getUser().name, $scope.frameFrom, $scope.frameTo, $scope.activeDataset.name,
                function(actionList) {
                    $scope.actionManager.actionList = actionList;
                })
        };

        // Fetch all actions of an Object from database
        $scope.getActionsListByUID = function(objectUID) {
            $scope.actionManager.actionList = [];
            toolSrvc.getActionsByUID(navSrvc.getUser().name, objectUID,
                $scope.frameFrom, $scope.frameTo, $scope.activeDataset.name,
                function(actionList) {
                    $scope.actionManager.actionList = actionList;
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
                    dataset: $scope.activeDataset.name,
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
                    action.objectUID, $scope.activeDataset.name, $scope.createActionSuccess,
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

        // Function to remove the point in the keypointEditor
        $scope.removePoint = function(index, pointID) {
            // If the pointID is -1, remove all
            if (pointID == -1) {
                for (var i = 0; i < $scope.keypointEditorData[index].points.length; i++) {
                    $scope.keypointEditorData[index].points[i] = [];
                }

                if ($scope.activeDataset.type.localeCompare("actionInKitchen") == 0) {
                    $scope.keypointEditorData[index].point3D = [];
                }
            } else {
                $scope.keypointEditorData[index].points[pointID] = [];
            }


            for (var i = 0; i < $scope.canvases.length; i++) {
                $scope.canvases[i].setRedraw();
            }
        }

        // Function that fill the pointCreationData
        $scope.setPointCreationData = function(index, pointID) {
            $scope.pointCreationData.labelIndex = index;
            $scope.pointCreationData.pID = pointID;
        }

        // Function that resets the pointCreationData
        $scope.resetPointCreationData = function() {
                $scope.pointCreationData = {
                    labelIndex: null,
                    pID: null,
                    cameraID: null
                }
            }
            // Resets all epilines
        $scope.resetEpilines = function() {
            for (var i = 0; i < $scope.canvases.length; i++) {
                $scope.canvases[i].resetEpiline(0)
                $scope.canvases[i].resetEpiline(1)
                $scope.canvases[i].resetEpiline(2)
                $scope.canvases[i].resetEpiline(3)
            }
        }

        // Callback function of get epiline
        var callbackGetEpiline = function(elPoints, cam1Index, cam2Index, pointNumber) {
            $scope.canvases[cam2Index - 1].setEpiline(elPoints.el1, elPoints.el2, $scope.canvasesColors[cam1Index], pointNumber);
        }

        // Function that manages the epiline calculation
        $scope.getEpilines = function() {
            // Reset existing epilines
            $scope.resetEpilines();

            // Check if there are enough cameras
            var counter = 0;
            for (var i = 0; i < $scope.canvases.length; i++) {
                if ($scope.canvases[i].hasActiveCamera()) counter++;
            }
            if (counter < 2) {
                window.alert("You need at least 2 active cameras!")
            }

            // Generate epilines of existing points in cameras that are free of points
            var labelIndex = $scope.pointCreationData.labelIndex;

            for (var i = 0; i < $scope.canvases.length; i++) {
                if ($scope.canvases[i].hasActiveCamera()) {
                    if (!$scope.keypointEditorData[labelIndex].cameras.includes($scope.canvases[i].getActiveCamera().filename)) { // If there isn't a point already in that camera
                        // Get epilines for that camera
                        for (var j = 0; j < $scope.keypointEditorData[labelIndex].points.length; j++) {
                            if ($scope.keypointEditorData[labelIndex].points[j].length != 0) {
                                toolSrvc.getEpiline($scope.slider.value, $scope.activeDataset.name, $scope.keypointEditorData[labelIndex].points[j], $scope.keypointEditorData[labelIndex].cameras[j], $scope.canvases[i].getActiveCamera().filename, j, $scope.canvases[i].canvasNumber, j, callbackGetEpiline);
                            }
                        }
                    }
                }
            }
        }

        $scope.refreshProjectionOfCanvases = function() {
            for (var i = 0; i < $scope.canvases.length; i++) {
                if ($scope.canvases[i].hasActiveCamera()) {
                    if ($scope.activeDataset.type.localeCompare("actionInKitchen") === 0) {
                        $scope.canvases[i].projectObjects();
                    }
                }
            }
        };

        $scope.refreshProjectionOfCanvasesByUID = function(objectUid, objectType, frame) {
            $scope.openKeyPointEditor($scope.objectManager.objectTypes[objectType].objects[objectUid], $scope.slider.value)

            // Refresh the selected object so the table of annotations updates
            var selectedType = $scope.objectManager.selectedType.type;
            var selectedUID = $scope.objectManager.selectedObject.uid;

            $scope.objectManager.selectedType = $scope.objectManager.objectTypes[selectedType];
            $scope.objectManager.selectedObject = $scope.objectManager.objectTypes[selectedType].objects[selectedUID];
            for (var i = 0; i < $scope.canvases.length; i++) {
                if ($scope.canvases[i].hasActiveCamera()) {
                    $scope.canvases[i].projectObject(objectUid, objectType, frame);
                }
            }
        }

        // Callback function of updateAnnotation
        var updateAnnotationCallback = function(objectUid, objectType, frameTo, deleting) {
            window.alert("Annotation updated!");
            $scope.interpolate(objectUid, objectType, frameTo, deleting);
        }

        // Function that triangulates the 3D point given the 2D points
        $scope.updateAnnotation = function() {
            // Construct the variable to store the annotation
            var deleting = false;
            var structureOfPoint = {
                p1: [],
                cam1: "",
                p2: [],
                cam2: "",
                p3: [],
                cam3: "",
                p4: [],
                cam4: ""
            }
            var objects = {
                uid: $scope.objectManager.selectedObject.uid,
                type: $scope.objectManager.selectedObject.type,
                keypoints: []
            }

            // Append as many keypoints structures as labels are in the object
            for (var i = 0; i < $scope.keypointEditorData.length; i++) {
                objects.keypoints.push(structureOfPoint);
            }

            // Check that for everypoint in the keypointEditData there is 0 or < 2 placed points and fill the objects structure
            for (var i = 0; i < $scope.keypointEditorData.length; i++) {
                // Count the number of points that have been placed for each of the labels
                var count = 0;
                for (var j = 0; j < $scope.keypointEditorData[i].points.length; j++) {
                    if ($scope.keypointEditorData[i].points[j].length > 0) {
                        count++;
                    }
                }

                // If count is equal to 1 we cant continue. We need 0 (to not change) or >= 2 points placed (to update/create)
                if (count == 1) {
                    window.alert("The label '" + $scope.keypointEditorData[i].label + "' needs to have 0 or at least 2 points placed.");
                    return;
                } else if (count == 0) { // If count is 0 we have to check if the point already existed
                    if ($scope.keypointEditorData[i].point3D.length > 0) {
                        // If the point3D exists, we don't need to update it. So we will fill the object with the 2D-projections of the canvases.
                        if ($scope.canvases[0].hasActiveCamera()) {
                            objects.keypoints[i].p1 = $scope.canvases[0].objectsIn2D[$scope.objectManager.selectedObject.type].objects[$scope.objectManager.selectedObject.uid].frames[$scope.slider.value].keypoints[i];
                            objects.keypoints[i].cam1 = $scope.canvases[0].getActiveCamera().filename;
                        }
                        if ($scope.canvases[1].hasActiveCamera()) {
                            objects.keypoints[i].p2 = $scope.canvases[1].objectsIn2D[$scope.objectManager.selectedObject.type].objects[$scope.objectManager.selectedObject.uid].frames[$scope.slider.value].keypoints[i];
                            objects.keypoints[i].cam2 = $scope.canvases[1].getActiveCamera().filename;
                        }
                        if ($scope.canvases[2].hasActiveCamera()) {
                            objects.keypoints[i].p3 = $scope.canvases[2].objectsIn2D[$scope.objectManager.selectedObject.type].objects[$scope.objectManager.selectedObject.uid].frames[$scope.slider.value].keypoints[i];
                            objects.keypoints[i].cam3 = $scope.canvases[2].getActiveCamera().filename;
                        }
                        if ($scope.canvases[3].hasActiveCamera()) {
                            objects.keypoints[i].p4 = $scope.canvases[3].objectsIn2D[$scope.objectManager.selectedObject.type].objects[$scope.objectManager.selectedObject.uid].frames[$scope.slider.value].keypoints[i];
                            objects.keypoints[i].cam4 = $scope.canvases[3].getActiveCamera().filename;
                        }

                    } else {
                        // If the point3D doesn't exist is because it has been removed or was never annotated. We leave it blank.
                        deleting = true;
                    }
                } else if (count >= 2) { // If count is >= 2 then we have to update/create that label (which is the same)
                    var points = $scope.keypointEditorData[i].points;
                    var cameras = $scope.keypointEditorData[i].cameras;
                    objects.keypoints[i].p1 = points[0];
                    objects.keypoints[i].cam1 = cameras[0];
                    objects.keypoints[i].p2 = points[1];
                    objects.keypoints[i].cam2 = cameras[1];
                    objects.keypoints[i].p3 = points[2];
                    objects.keypoints[i].cam3 = cameras[2];
                    objects.keypoints[i].p4 = points[3];
                    objects.keypoints[i].cam4 = cameras[3];
                }

            }

            // Now with the object structure created, we can call the update
            toolSrvc.updateAnnotation(navSrvc.getUser().name, $scope.activeDataset, $scope.activeDataset.name, $scope.slider.value, objects, deleting, updateAnnotationCallback);
        }

        // Function that creates a new object
        $scope.createNewObject = function() {
            toolSrvc.createNewObject(navSrvc.getUser().name, $scope.activeDataset.name, $scope.activeDataset.name, $scope.objectManager.selectedType.type, $scope.slider.value, callbackCreateNewObject);
        }

        // Auxiliar callback function for the interpolation
        var callbackInterpolate = function(objectUid, frames) {
            $scope.retrieveAnnotation(objectUid, frames);
        }

        // Function that interpolates (if possible) between the created point and the closest previous point
        $scope.interpolate = function(objectUid, objectType, frameTo, deleting) {
            if (frameTo == $scope.frameFrom) {
                callbackInterpolate(objectUid, [frameTo]); // If its not possible to interpolate, jump this step
                return;
            }

            // If we were deleting the point, dont interpolate
            if (deleting) {
                callbackInterpolate(objectUid, [frameTo]);
                return;
            }

            // Find the closest previous annotated frame for that object
            var object = $scope.objectManager.objectTypes[objectType.toString()].objects[objectUid.toString()];
            var frameFrom = null;
            for (var i = frameTo - 1; i >= Math.max(1, frameTo - 5); i--) {
                if (object.frames[i - $scope.frameFrom].keypoints.length > 0) {
                    frameFrom = i;
                    break;
                }
            }

            // Interpolate if possible
            if (frameFrom != null) {
                var frameArray = [];
                for (var i = frameFrom; i <= frameTo; i++) {
                    frameArray.push(i);
                }
                toolSrvc.interpolate(navSrvc.getUser().name, $scope.activeDataset.name, $scope.activeDataset.name, frameFrom, frameTo, objectUid, frameArray, callbackInterpolate);
            } else callbackInterpolate(objectUid, [frameTo]);

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
            toolSrvc.retrieveAvailableObjectTypes($scope.activeDataset.type, callbackSuccessRetrieveAvailableObjectTypes);
        }


        // Callback function for retrieving one object
        var callbackRetrievingFrameObject = function(annotation, frame) {
            if (angular.equals({}, annotation)) return; // Check if we received something
            $scope.objectManager.objectTypes[annotation.type.toString()].objects[annotation.uid.toString()].frames[frame - $scope.frameFrom].keypoints = annotation.keypoints;

            $scope.refreshProjectionOfCanvasesByUID(annotation.uid, annotation.type, frame);
        }

        // Function that returns the annotations defined by objectUid
        $scope.retrieveAnnotation = function(objectUid, frameArray) {
            for (var i = 0; i < frameArray.length; i++) {
                toolSrvc.getAnnotationOfFrameByUID(navSrvc.getUser().name, $scope.activeDataset.name, $scope.activeDataset.name, objectUid, frameArray[i], callbackRetrievingFrameObject);
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

        // Callback function for retrieving the existing objects
        var callbackRetrieveObjectsPT = function(objects) {
            // console.log("OBJECTS");
            // console.log(objects);
            for (obj in objects) {
                var object = objects[obj].object;
                $scope.objectManager.objectTypes[object.type.toString()].objects[object.track_id.toString()] = {
                    uid: object.track_id,
                    type: object.type,
                    frames: []
                };

                // Fill the frames array with an empty array for each frame
                for (var j = 0; j <= $scope.numberOfFrames; j++) {
                    $scope.objectManager.objectTypes[object.type.toString()].objects[object.track_id.toString()].frames.push({
                        frame: $scope.frameFrom + j,
                        original_uid: object.uid,
                        keypoints: []
                    })
                }
            }
            // console.log($scope.objectManager);
            $scope.retrieveAnnotationsPT();
        }

        $scope.retrieveObjects = function() {
            if ($scope.activeDataset.type.localeCompare("actionInKitchen") === 0) {
                toolSrvc.retrieveObjects($scope.activeDataset, $scope.activeDataset.name, navSrvc.getUser().name, callbackRetrieveObjects);
            } // else it's posetrack and it is not done here!
        };

        // Retrieve objects for posetrack
        $scope.retrieveObjectsPT = function() {
            toolSrvc.retrieveObjects($scope.activeDataset, $scope.loadedCameras[0].filename, navSrvc.getUser().name, callbackRetrieveObjectsPT);
        };

        // TODO: Temporal function to retrieve objects, when tasks exist, this will only be called one before entering the tool
        var callbackRetrievingFrameObjects = function(annotation) {
            if (angular.equals({}, annotation)) return; // Check if we received something

            var frame = annotation.frame; // Read the frame

            for (var i = 0; i < annotation.objects.length; i++) {
                // In any case, store in that frame the keypoints, the frame number and the actions
                if ($scope.activeDataset.type.localeCompare("poseTrack") === 0) {
                    $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                        .objects[annotation.objects[i].track_id.toString()].frames[frame - $scope.frameFrom].keypoints =
                        annotation.objects[i].keypoints;
                    $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                        .objects[annotation.objects[i].track_id.toString()].frames[frame - $scope.frameFrom].frame =
                        frame;
                    $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                        .objects[annotation.objects[i].track_id.toString()].frames[frame - $scope.frameFrom].original_uid =
                        $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                        .objects[annotation.objects[i].track_id.toString()].original_uid;
                } else {
                    $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                        .objects[annotation.objects[i].uid.toString()].frames[frame - $scope.frameFrom].keypoints =
                        annotation.objects[i].keypoints;
                    $scope.objectManager.objectTypes[annotation.objects[i].type.toString()]
                        .objects[annotation.objects[i].uid.toString()].frames[frame - $scope.frameFrom].frame = frame;
                }
            }
            // console.log("OBJECT MANAGER");
            // console.log($scope.objectManager);
            $scope.refreshProjectionOfCanvases();
        }

        // Function that return the available objects
        $scope.retrieveAnnotations = function() {
            dataset = $scope.activeDataset;

            if (dataset.type.localeCompare("poseTrack") === 0) { // Check the dataset type to select the correct value for "scene"
                console.log("Posetrack does not load annotations now.")
            } else if (dataset.type.localeCompare("actionInKitchen") === 0) {
                for (var i = 0; i < $scope.frameList.length; i++) {
                    toolSrvc.getAnnotationOfFrame(dataset.name, $scope.frameList[i],
                        dataset.name, navSrvc.getUser().name, callbackRetrievingFrameObjects);
                }
            }
        };

        $scope.retrieveAnnotationsPT = function() {
            console.log($scope.loadedCameras[0].filename);
            for (var i = 0; i < $scope.frameList.length; i++) {
                toolSrvc.getAnnotationOfFrame($scope.loadedCameras[0].filename, $scope.frameList[i],
                    $scope.activeDataset.name, navSrvc.getUser().name, callbackRetrievingFrameObjects);
            }
        };

        $scope.retrieveAvailableObjectTypes();
        $scope.initializeCanvases();
        $scope.getActivitiesList();
    }
]);