angular.module('CVGTool')

    .controller('toolCtrl', ['$scope', '$state', '$interval', '$mdDialog', 'toolSrvc', function ($scope, $state, $interval, $mdDialog, toolSrvc) {

      // $(document).ready(function() {
      //       $('[data-toggle="tooltip"]').tooltip();
      //   });

//////// TOOLS
      $scope.tool = 'navigation';  // navigation = Normal
                                   // keypoint = Key-Point mode

      $scope.subTool = '';         // Subtool inside tool, for example "addKeypoint";

      $scope.switchSubTool = function (sT) {
        if ($scope.subTool.localeCompare(sT) == 0) {
            $scope.subTool = '';
            return;
        }
        $scope.subTool = sT;
      };

      $scope.switchTool = function (newTool) {
        $scope.tool = newTool
      };

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
      $scope.$watch("slider.value", function(){
        for(var i=0; i < $scope.canvases.length; i++) {
          $scope.canvases[i].setRedraw();
        }
      });

      // Function that switches "on" and "off" the "play" functionality
      $scope.switchPlay = function() {
        $scope.isPlaying = !$scope.isPlaying;

        if ($scope.isPlaying == true) {
          promise = $interval(function(){ $scope.nextFrame(); }, 500);
        } else {
          $interval.cancel(promise);
        }
      }

      // Function that increases the frame of the timeline by 1
      $scope.nextFrame = function() {
        if ($scope.slider.value + 1 > $scope.slider.options.ceil) {
            $scope.slider.value = $scope.slider.options.ceil;
            $scope.isPlaying = false;        // If we are in the last frame, stop "playing"
            $interval.cancel(promise);       // If we are in the last frame, stop the $interval
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
       *                  frameY: image, key-points: []
       */

      // Function that opens the dialog in charge of adding a new camera
      $scope.addCamera = function() {
          $mdDialog.show({
            templateUrl: '/static/views/dialogs/addNewCameraDialog.html',
            controller: 'dialogAddNewCameraCtrl',
            escapeToClose: false
          }).then(function(successData){
              var filename = successData[0].filename; // Get the name of the camera from the first frame
              var frames = [];

              for (var i=0; i < successData.length; i++) {
                var imageData = successData[i].image.slice(2,successData[i].image.length - 1)
                var stringImage = "data:image/jpeg;base64," + imageData;

                frames.push({
                  number: successData[i].frame,
                  image: stringImage
                });

              }
              // Short frames once loaded
              frames.sort(function(a, b) {
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
      $scope.openSelector = function(video) {
            $mdDialog.show({
              templateUrl: '/static/views/dialogs/cameraSelectorDialog.html',
              controller: 'dialogCameraSelectorCtrl',
              locals: {
                  video: video,
                  canvases: $scope.numberOfCanvases
              },
              escapeToClose: true
            }).then(function(successData){
                $scope.switchVideo(successData.video, successData.number);

            });
      }

      // Switches the video "video" to the canvas specified by "number"
      $scope.switchVideo = function(video, number){
        $scope.canvases[number-1].setCamera(video);
      }

//////// CANVASES
      $scope.numberOfCanvases = 4;  // Number of canvases
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
        this.canvas.style.width ='100%';
        this.canvas.style.height='100%';

        // ...then set the internal size to match
        this.canvas.width  = canvas.offsetWidth;
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
        this.dragoffx = 0;
        this.dragoffy = 0;

        var canvasObj = this;

        //----- OPTIONS -----//
        this.selectionColor = "#CC0000";
        this.selectionWidth = 2;
        setInterval(function() { canvasObj.draw(); }, 100); // Redraw function

        //----- EVENTS -----//
        // Prevents clicking of selecting text
        canvas.addEventListener('selectstart', function(e) { e.preventDefault(); return false;}, false);

        // // MouseDown event, click
        // canvas.addEventListener('mousedown', function(e) {
        //     var mouse = canvasObj.getMouse(e);
        //     var mx = mouse.x;
        //     var my= mouse.y;
        //
        //     if ($scope.subTool.localeCompare('addKeypoint')) {
        //       var keypoint = {
        //           shape:
        //       }
        //     }
        //
        //     var keypoints = $scope.activeCamera.frames[$scope.slider.value-1].keypoints;
        //     for (var i= 0; i< keypoints.length; i++) {
        //         if (keypoints[i].shape.contains(mx,my)) {
        //
        //         }
        //
        //     }
        // }, true);


        //----- FUNCTIONS -----//
        // Adds a keypoint to the stored keypoints
        CanvasObject.prototype.addKeypoint = function(keypoint) {
            // TODO: this is temporal, no objects yet
            $scope.activeCamera.frames[$scope.slider.value-1].keypoints.push(keypoint)
        }

        // Removes the selected keypoint from the stored keypoints
        CanvasObject.prototype.removeKeypoint = function(keypoint) {

        }

        // Function that set the flag to redraw to false
        CanvasObject.prototype.setRedraw = function() {
          this.valid = false;
        }

        // Function that redraws everything associated to the actual canvas
        CanvasObject.prototype.draw = function() {
          if (!this.valid) {
            var ctx = this.ctx;
            var canvas = this.canvas;

            // Redraw background first
            if (this.activeCamera !== null) {
              var image = new Image();
              image.onload = function() {
                ctx.drawImage(this, 0, 0, this.width, this.height, 0, 0, canvas.width, canvas.height);

              };
              image.src= this.activeCamera.frames[$scope.slider.value-1].image;
            }

            // Redraw everything we have to redraw (keypoints)
            this.valid = true;
          }
        }

        // Switches the active camera of the Canvas for "camera"
        CanvasObject.prototype.setCamera = function(camera) {
          if (this.activeCamera !== null) {
            // If there was already a video there, move it back to the loadedCameras array
            $scope.loadedCameras.push(this.activeCamera);
          }

          // Set the new camera
          this.activeCamera = camera;


          // When the video is set in a canvas, remove it from the array of loadedCameras
          for (var i=0; i< $scope.loadedCameras.length; i++) {
            if($scope.loadedCameras[i].filename.localeCompare(camera.filename) == 0){
              $scope.loadedCameras.splice(i,1);
              break;
            }
          }
          // Set the flag to redraw
          this.valid = false;
        }
      }

      // Initializator of canvases
      $scope.initializeCanvases = function() {
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



}]);
