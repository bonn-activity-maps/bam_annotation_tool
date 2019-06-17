angular.module('CVGTool')

    .controller('toolCtrl', ['$scope', '$state', '$interval', '$mdDialog', 'toolSrvc', 'navSrvc', function ($scope, $state, $interval, $mdDialog, toolSrvc, navSrvc) {

        // Enable tooltips
        $(function () {
            $('[data-toggle="tooltip"]').tooltip()
        })

//////// TOOLS
        $scope.tool = 'navigation';  // navigation = Normal
                                     // keypoint = Key-Point mode

        $scope.subTool = '';         // Subtool inside tool, for example "addKeypoint";
        $scope.keyPointEditTab = false; // Boolean to control if the keypoint edit panel is activated

        // Switches the value of the secondary tool
        $scope.switchSubTool = function (sT) {
            if ($scope.subTool.localeCompare(sT) == 0) {
                $scope.subTool = '';
                return;
            }
            $scope.subTool = sT;
        };

        // Switches the value of the principal tool
        $scope.switchTool = function (newTool) {
            $scope.tool = newTool
            $scope.subTool = '';

            if ($scope.tool.localeCompare("keypoint") == 0) {
                $scope.openKeyPointEditor();
            }
        };

        // Function that opens the panel to manage keypoints
        $scope.openKeyPointEditor = function () {
            $scope.keyPointEditTab = true;
        }

        // Function that closes the panel to manage keypoints
        $scope.closeKeyPointEditor = function () {
            $scope.keyPointEditTab = false;
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
                    canvasE1.setAttribute("style", "border:1px solid #000000;");
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
                    canvasE1.setAttribute("style", "border:1px solid #000000;");
                    var canvasE2 = document.createElement("canvas");
                    canvasE2.classList.add("playable-canvas");
                    canvasE2.setAttribute("id", "canvas2");
                    canvasE2.setAttribute("style", "border:1px solid #000000;");
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
                    canvasE1.setAttribute("style", "border:1px solid #000000;");
                    var canvasE2 = document.createElement("canvas");
                    canvasE2.classList.add("playable-canvas");
                    canvasE2.setAttribute("id", "canvas2");
                    canvasE2.setAttribute("style", "border:1px solid #000000;");
                    var canvasE3 = document.createElement("canvas");
                    canvasE3.classList.add("playable-canvas");
                    canvasE3.setAttribute("id", "canvas3");
                    canvasE3.setAttribute("style", "border:1px solid #000000;");
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
                    canvasE1.setAttribute("style", "border:1px solid #000000;");
                    var canvasE2 = document.createElement("canvas");
                    canvasE2.classList.add("playable-canvas");
                    canvasE2.setAttribute("id", "canvas2");
                    canvasE2.setAttribute("style", "border:1px solid #000000;");
                    var canvasE3 = document.createElement("canvas");
                    canvasE3.classList.add("playable-canvas");
                    canvasE3.setAttribute("id", "canvas3");
                    canvasE3.setAttribute("style", "border:1px solid #000000;");
                    var canvasE4 = document.createElement("canvas");
                    canvasE4.classList.add("playable-canvas");
                    canvasE4.setAttribute("id", "canvas4");
                    canvasE4.setAttribute("style", "border:1px solid #000000;");
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
        $scope.switchNumberOfCanvases = function (newNumber) {
            if ($scope.numberOfCanvases == newNumber) return; // If no change, exit

            // Save all active cameras
            for (var i = 0; i < $scope.numberOfCanvases; i++) {
                if ($scope.canvases[i].hasActiveCamera()) {
                    console.log(i)
                    console.log($scope.canvases[i].getActiveCamera())
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
        };

        $scope.dragOptions = {};
        $scope.numberOfCanvases = 4;  // Number of canvases
        $scope.activeDataset = navSrvc.getActiveDataset();

        $scope.tempCameraStorage = [null, null, null, null];


//////// TIMELINE
        // Variables to control the timeline
        $scope.isPlaying = false;
        var promise;

        $scope.slider = {   // Options and values for the slider
            value: 1,
            options: {
                floor: 1,
                ceil: 100,
                step: 1,
                showTicks: true
            }
        };

        // Function that watches over the value of the slider and calls to redraw the canvases when this variable changes
        $scope.$watch("slider.value", function () {
            for (var i = 0; i < $scope.canvases.length; i++) {
                $scope.canvases[i].setRedraw();
            }
        });

        // Function that switches "on" and "off" the "play" functionality
        $scope.switchPlay = function () {
            $scope.isPlaying = !$scope.isPlaying;

            if ($scope.isPlaying == true) {
                promise = $interval(function () {
                    $scope.nextFrame();
                }, 500);
            } else {
                $interval.cancel(promise);
            }
        }

        // Function that increases the frame of the timeline by 1
        $scope.nextFrame = function () {
            if ($scope.slider.value + 1 > $scope.slider.options.ceil) {
                $scope.slider.value = $scope.slider.options.ceil;
                $scope.isPlaying = false;        // If we are in the last frame, stop "playing"
                $interval.cancel(promise);       // If we are in the last frame, stop the $interval
            } else {
                $scope.slider.value += 1;
            }
        }

        // Function that decreases the frame of the timeline by 1
        $scope.previousFrame = function () {
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
         *                  frameY: image, key-points: []
         */

        // Function that opens the dialog in charge of adding a new camera
        $scope.addCamera = function () {
            $mdDialog.show({
                templateUrl: '/static/views/dialogs/addNewCameraDialog.html',
                controller: 'dialogAddNewCameraCtrl',
                escapeToClose: false
            }).then(function (successData) {
                var filename = successData[0].filename; // Get the name of the camera from the first frame
                var frames = [];

                for (var i = 0; i < successData.length; i++) {
                    var imageData = successData[i].image.slice(2, successData[i].image.length - 1)
                    var stringImage = "data:image/jpeg;base64," + imageData;

                    frames.push({
                        number: successData[i].frame,
                        image: stringImage
                    });
                }

                // Short frames once loaded
                frames.sort(function (a, b) {
                    return a.number - b.number;
                });

                // Create new camera
                $scope.loadedCameras.push({
                    filename: filename,
                    frames: frames
                })

            });
        }

        // Function that opens the dialog in charge of moving one camera to one canvas
        $scope.openSelector = function (video) {
            $mdDialog.show({
                templateUrl: '/static/views/dialogs/cameraSelectorDialog.html',
                controller: 'dialogCameraSelectorCtrl',
                locals: {
                    video: video,
                    canvases: $scope.numberOfCanvases
                },
                escapeToClose: true
            }).then(function (successData) {
                $scope.switchVideo(successData.video, successData.number);

            });
        }

        // Switches the video "video" to the canvas specified by "number"
        $scope.switchVideo = function (video, number) {
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
        $scope.canvases = []   // Initial canvas structure

        // Shape to represent keypoints
        // function Shape(x,y) {
        //   this.x = x;
        //   this.y = y;
        //   this.z = 0;
        //   this.radius = 5;
        //
        //   this.fill = '#AAAAAA';
        //
        //   // Draws the shape
        //   Shape.prototype.draw = function(ctx) {
        //       ctx.fillStyle = this.fill;
        //
        //   }
        //
        //   // Check if mouse coordinates are contained inside the shape
        //   Shape.prototype.contains = function(mx, my) {
        //     var d = Math.sqrt((this.x - mx)*(this.x - mx) + (this.y - my)*(this.y - my))
        //     if (d <= this.radius) return true;
        //     else return false;
        //   }
        // };

        // Object that controls the canvas and stores its state
        function CanvasObject(canvas) {
            //----- SETUP -----//
            this.canvas = canvas;
            this.ctx = this.canvas.getContext('2d')

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
            this.valid = true;    // when set to true, the canvas will redraw everything
            this.dragging = false; // Keep track of when we are dragging
            this.selection = null; // Current selected object

            // Mouse variable
            this.mouse = {
                pos: {x: 0, y: 0},
                worldPos: {x: 0, y: 0},
                posLast: {x: 0, y: 0},
                dragging: false
            }

            // View transform
            this.m = [1, 0, 0, 1, 0, 0];  // Current view transform
            this.im = [1, 0, 0, 1, 0, 0]; // Current inverse view transform
            this.bounds = {
                top: 0,
                left: 0,
                right: this.canvas.width,
                bottom: this.canvas.height
            }
            this.pos = {x: 0, y: 0}; // Initial position
            this.wp1 = {x: 0, y: 0};
            this.wp2 = {x: 0, y: 0};
            this.dirty = true;

            // To keep track of the zoom
            this.zoom = 1;
            this.maxZoom = 4;
            this.minZoom = 1;

            var canvasObj = this;

            //----- OPTIONS -----//
            this.selectionColor = "#CC0000";
            this.selectionWidth = 2;
            setInterval(function () {
                canvasObj.draw();
            }, 100); // Redraw function

            //----- EVENTS -----//
            // Prevents clicking of selecting text
            canvas.addEventListener('selectstart', function (e) {
                e.preventDefault();
                return false;
            }, false);

            // MouseDown event
            canvas.addEventListener('mousedown', function (e) {
                var mouse = canvasObj.getMouse(e);
                canvasObj.mouse.pos.x = mouse.x;
                canvasObj.mouse.pos.y = mouse.y;
                console.log(mouse)

                canvasObj.toWorld(canvasObj.mouse.pos, canvasObj.mouse.worldPos); // gets the world coords

                // If the tool is navigation
                if ($scope.tool.localeCompare('navigation') == 0) {
                    // TODO: Search in the keypoints (shapes) array to see if we clicked in a shape or in the background
                    // TODO: this will tell us what are we are trying to drag

                    canvasObj.dragging = true;
                }

                // If the subtool is 'Zoom Out'
                if ($scope.subTool.localeCompare('zoomIn') == 0) {
                    canvasObj.scaleAt(canvasObj.mouse.pos, 0.5);
                }

                // If the subtool is 'Zoom In'
                if ($scope.subTool.localeCompare('zoomOut') == 0) {
                    canvasObj.scaleAt(canvasObj.mouse.pos, -0.5);
                }
            }, true);

            // MouseMove event
            canvas.addEventListener('mousemove', function (e) {
                var mouse = canvasObj.getMouse(e);

                if (canvasObj.dragging) {
                    canvasObj.mouse.posLast.x = canvasObj.mouse.pos.x;
                    canvasObj.mouse.posLast.y = canvasObj.mouse.pos.y;

                    canvasObj.mouse.pos.x = mouse.x;
                    canvasObj.mouse.pos.y = mouse.y;

                    canvasObj.toWorld(canvasObj.mouse.pos, canvasObj.mouse.worldPos); // gets the world coords

                    canvasObj.move(canvasObj.mouse.pos.x - canvasObj.mouse.posLast.x, canvasObj.mouse.pos.y - canvasObj.mouse.posLast.y);
                }

            }, true);

            // MouseUp event
            canvas.addEventListener('mouseup', function (e) {
                canvasObj.dragging = false; // Stop dragging
            }, true);

            //----- FUNCTIONS -----//
            // Fits the image to the canvas depending of the zoom
            CanvasObject.prototype.canvasDefault = function () {
                this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            }

            // Apply transformation to context
            CanvasObject.prototype.apply = function () {
                if (!this.valid) {
                    this.update()
                }
                this.ctx.setTransform(this.m[0], this.m[1], this.m[2], this.m[3], this.m[4], this.m[5]);
            }

            // Update transformation matrix
            CanvasObject.prototype.update = function () {
                this.valid = true;
                this.m[3] = this.m[0] = this.zoom;
                this.m[1] = this.m[2] = 0;
                this.m[4] = this.pos.x;
                this.m[5] = this.pos.y;

                this.constrain();

                // Calculate the inverse transformation
                var cross = this.m[0] * this.m[3] - this.m[1] * this.m[2];
                this.im[0] = this.m[3] / cross;
                this.im[1] = -this.m[1] / cross;
                this.im[2] = -this.m[2] / cross;
                this.im[3] = this.m[0] / cross;
            }

            // Apply the constraints to the image
            CanvasObject.prototype.constrain = function () {
                this.maxZoom = Math.min(
                    this.canvas.width / (this.bounds.right - this.bounds.left),
                    this.canvas.height / (this.bounds.bottom - this.bounds.top)
                );
                if (this.zoom < this.maxZoom) {
                    this.m[0] = this.m[3] = this.zoom = this.maxZoom
                }
                this.wp1.x = this.bounds.left;
                this.wp1.y = this.bounds.top;
                this.toScreen(this.wp1, this.wp2);
                if (this.wp2.x > 0) {
                    this.m[4] = this.pos.x -= this.wp2.x
                }
                if (this.wp2.y > 0) {
                    this.m[5] = this.pos.y -= this.wp2.y
                }
                this.wp1.x = this.bounds.right;
                this.wp1.y = this.bounds.bottom;
                this.toScreen(this.wp1, this.wp2);
                if (this.wp2.x < this.canvas.width) {
                    this.m[4] = (this.pos.x -= this.wp2.x - this.canvas.width)
                }
                if (this.wp2.y < this.canvas.height) {
                    this.m[5] = (this.pos.y -= this.wp2.y - this.canvas.height)
                }
            }

            // Convert from screen coordinates to world coordinates
            CanvasObject.prototype.toWorld = function (from, point = {}) {
                var xx, yy;
                if (!this.valid) {
                    this.update()
                }
                xx = from.x - this.m[4];
                yy = from.y - this.m[5];
                point.x = xx * this.im[0] + yy * this.im[2];
                point.y = xx * this.im[1] + yy * this.im[3];
                return point;
            }

            // Convert from world coordinates to string coordinates
            CanvasObject.prototype.toScreen = function (from, point = {}) {
                if (!this.valid) {
                    this.update()
                }
                point.x = from.x * this.m[0] + from.y * this.m[2] + this.m[4];
                point.y = from.x * this.m[1] + from.y * this.m[3] + this.m[5];
                return point;
            }

            // Apply zoom (scale) centered in the "at" point
            CanvasObject.prototype.scaleAt = function (at, amount) {
                if (!this.valid) {
                    this.update()
                }
                var oldZoom = this.zoom;
                this.zoom += amount;
                if (this.zoom < 1) this.zoom = 1;
                if (this.zoom > 4) this.zoom = 4;

                if (this.zoom != oldZoom) {
                    this.pos.x = at.x - (at.x - this.pos.x) * amount;
                    this.pos.y = at.y - (at.y - this.pos.y) * amount;
                }
                this.setRedraw();
            }

            // Move the context
            CanvasObject.prototype.move = function (x, y) {
                this.pos.x += x;
                this.pos.y += y;
                this.setRedraw();
            }

            // Returns the coordinates of the mouse of the event e
            CanvasObject.prototype.getMouse = function (e) {
                var rect = this.canvas.getBoundingClientRect();
                var mx = e.clientX - rect.left;
                var my = e.clientY - rect.top;

                return {x: mx, y: my};
            }

            // Adds a keypoint to the stored keypoints
            CanvasObject.prototype.addKeypoint = function (keypoint) {
                // TODO: this is temporal, no objects yet
                $scope.activeCamera.frames[$scope.slider.value - 1].keypoints.push(keypoint)
            }

            // Removes the selected keypoint from the stored keypoints
            CanvasObject.prototype.removeKeypoint = function (keypoint) {

            }

            // Function that set the flag to redraw to false
            CanvasObject.prototype.setRedraw = function () {
                this.valid = false;
            }

            // Function that clears the context
            CanvasObject.prototype.clear = function () {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }

            // Function that redraws everything associated to the actual canvas
            CanvasObject.prototype.draw = function () {
                if (!this.valid) {
                    this.canvasDefault();
                    this.apply();

                    var ctx = this.ctx;
                    var canvas = this.canvas;

                    //Redraw background first
                    if (this.activeCamera !== null) {
                        var image = new Image();
                        image.onload = function () {
                            // ctx.drawImage(this, bgX, bgY, this.width, this.height, 0, 0, canvas.width, canvas.height);
                            ctx.drawImage(this, 0, 0, canvas.width, canvas.height)
                        };
                        image.src = this.activeCamera.frames[$scope.slider.value - 1].image;
                    }

                    // Redraw everything we have to redraw (keypoints)
                    this.valid = true;
                }
            }

            // Switches the active camera of the Canvas for "camera"
            CanvasObject.prototype.setCamera = function (camera) {
                if (this.activeCamera !== null) {
                    // If there was already a video there, move it back to the loadedCameras array
                    $scope.loadedCameras.push(this.activeCamera);
                }

                // Set the new camera
                this.activeCamera = camera;

                // Set the flag to redraw
                this.valid = false;
            }

            // Puts the active camera in the array of cameras
            CanvasObject.prototype.removeCamera = function () {
                if (this.activeCamera !== null) {
                    $scope.loadedCameras.push(this.activeCamera); // Store actual camera
                    this.activeCamera = null;                     // Set canvas camera to null
                }
            }

            // Returns true if the canvas has an active camera
            CanvasObject.prototype.hasActiveCamera = function () {
                if (this.activeCamera !== null) {
                    return true;
                } else return false;
            }

            // Returns the active camera
            CanvasObject.prototype.getActiveCamera = function () {
                return this.activeCamera;
            }
        }

        // Initializator of canvases
        $scope.initializeCanvases = function () {
            $scope.canvases = []
            if ($scope.numberOfCanvases >= 1) {
                var canvas1 = document.getElementById('canvas1');
                $scope.canvases.push(new CanvasObject(canvas1))
            }
            if ($scope.numberOfCanvases >= 2) {
                var canvas2 = document.getElementById('canvas2');
                $scope.canvases.push(new CanvasObject(canvas2))
            }
            if ($scope.numberOfCanvases >= 3) {
                var canvas3 = document.getElementById('canvas3');
                $scope.canvases.push(new CanvasObject(canvas3))
            }
            if ($scope.numberOfCanvases >= 4) {
                var canvas4 = document.getElementById('canvas4');
                $scope.canvases.push(new CanvasObject(canvas4))
            }
        }

        $scope.initializeCanvases();
        if ($scope.activeDataset.type === 'poseTrack') { // If poseTrack type, only one canvas.
            $scope.switchNumberOfCanvases(1);   // Change to 1 canvas
        }

    }]);
