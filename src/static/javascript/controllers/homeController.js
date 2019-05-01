angular.module('CVGTool')

    .controller('homeCtrl', ['$scope', '$state', '$interval', '$mdDialog', 'homeSrvc', function ($scope, $state, $interval, $mdDialog, homeSrvc) {


//////// TOOLS
      $scope.mode = 'navigation';  // navigation = Normal
                                    // keypoint = Key-Point mode

      $scope.switchMode = function (newMode) {
        $scope.mode = newMode;
      }

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
      }

      // Function that watches over the value of the slider and calls to redraw the canvases when this variable changes
      $scope.$watch("slider.value", function(){
        $scope.redrawCanvases()
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
        if (number == 1) {
          if ($scope.canvases.canvas1.activeCamera !== null) {  // If there was already a video there, move it back to the loadedCameras array
            $scope.loadedCameras.push($scope.canvases.canvas1.activeCamera);
          }
          $scope.canvases.canvas1.activeCamera = video;
        } else if (number == 2) {
          if ($scope.canvases.canvas2.activeCamera !== null) {  // If there was already a video there, move it back to the loadedCameras array
            $scope.loadedCameras.push($scope.canvases.canvas2.activeCamera);
          }
          $scope.canvases.canvas2.activeCamera = video;
        } else if (number == 3) {
          if ($scope.canvases.canvas3.activeCamera !== null) {  // If there was already a video there, move it back to the loadedCameras array
            $scope.loadedCameras.push($scope.canvases.canvas3.activeCamera);
          }
          $scope.canvases.canvas3.activeCamera = video;
        } else if (number == 4) {
          if ($scope.canvases.canvas4.activeCamera !== null) {  // If there was already a video there, move it back to the loadedCameras array
            $scope.loadedCameras.push($scope.canvases.canvas4.activeCamera);
          }
          $scope.canvases.canvas4.activeCamera = video;
        }
        // When the video is set in a canvas, remove it from the array of loadedCameras
        for (var i=0; i< $scope.loadedCameras.length; i++) {
          if($scope.loadedCameras[i].filename.localeCompare(video.filename) == 0){
            $scope.loadedCameras.splice(i,1);
            break;
          }
        }
        $scope.redrawCanvases();
      }

//////// CANVASES
      $scope.numberOfCanvases = 4;  // Number of canvases

      $scope.canvases = {   // Initial canvas structure
        canvas1:{
          canvas: null,
          ctx: null,
          activeCamera: null,
          valid: false,     // when set to true, the canvas will redraw everything
          dragging: false,  // Keep track of when we are dragging
          dragoffx: 0,
          dragoffy: 0,
        },
        canvas2:{
          canvas: null,
          ctx: null,
          activeCamera: null,
          valid: false,     // when set to true, the canvas will redraw everything
          dragging: false,  // Keep track of when we are dragging
          dragoffx: 0,
          dragoffy: 0,
        },
        canvas3:{
          canvas: null,
          ctx: null,
          activeCamera: null,
          valid: false,     // when set to true, the canvas will redraw everything
          dragging: false,  // Keep track of when we are dragging
          dragoffx: 0,
          dragoffy: 0,
        },
        canvas4:{
          canvas: null,
          ctx: null,
          activeCamera: null,
          valid: false,     // when set to true, the canvas will redraw everything
          dragging: false,  // Keep track of when we are dragging
          dragoffx: 0,
          dragoffy: 0,
        },
      }

      // Function that redraws all canvases
      $scope.redrawCanvases = function() {
         if ($scope.numberOfCanvases >= 1) {
           if ($scope.canvases.canvas1.activeCamera !== null) {
             var image = new Image();
             image.onload = function() {
               $scope.canvases.canvas1.ctx.drawImage(this, 0, 0, this.width, this.height, 0, 0, $scope.canvases.canvas1.canvas.width, $scope.canvases.canvas1.canvas.height);

             };
             image.src= $scope.canvases.canvas1.activeCamera.frames[$scope.slider.value-1].image;
           }
           if ($scope.numberOfCanvases >= 2) {
             if ($scope.canvases.canvas2.activeCamera !== null) {
               var image = new Image();
               image.onload = function() {
                 $scope.canvases.canvas2.ctx.drawImage(this, 0, 0, this.width, this.height, 0, 0, $scope.canvases.canvas2.canvas.width, $scope.canvases.canvas2.canvas.height);
               };
               image.src= $scope.canvases.canvas2.activeCamera.frames[$scope.slider.value-1].image;
             }
             if ($scope.numberOfCanvases >= 3) {
               if ($scope.canvases.canvas3.activeCamera !== null) {
                 var image = new Image();
                 image.onload = function() {
                   $scope.canvases.canvas3.ctx.drawImage(this, 0, 0, this.width, this.height, 0, 0, $scope.canvases.canvas3.canvas.width, $scope.canvases.canvas3.canvas.height);
                 };
                 image.src= $scope.canvases.canvas3.activeCamera.frames[$scope.slider.value-1].image;
               }
               if ($scope.numberOfCanvases >= 4) {
                 if ($scope.canvases.canvas4.activeCamera !== null) {
                   var image = new Image();
                   image.onload = function() {
                     $scope.canvases.canvas4.ctx.drawImage(this, 0, 0, this.width, this.height, 0, 0, $scope.canvases.canvas4.canvas.width, $scope.canvases.canvas4.canvas.height);
                   };
                   image.src= $scope.canvases.canvas4.activeCamera.frames[$scope.slider.value-1].image;
                 }
               }
             }
           }
         }
      }

      function fitToContainer(canvas){
        // Make it visually fill the positioned parent
        canvas.style.width ='100%';
        canvas.style.height='100%';
        // ...then set the internal size to match
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }


      $scope.setCanvases = function() {
        var canvas1 = document.getElementById('canvas1');
        var ctx1 = canvas1.getContext('2d');
        fitToContainer(canvas1)

        $scope.canvases.canvas1.canvas = canvas1;
        $scope.canvases.canvas1.ctx = ctx1;

        var canvas2 = document.getElementById('canvas2');
        var ctx2 = canvas2.getContext('2d');
        fitToContainer(canvas2)

        $scope.canvases.canvas2.canvas = canvas2;
        $scope.canvases.canvas2.ctx = ctx2;

        var canvas3 = document.getElementById('canvas3');
        var ctx3 = canvas3.getContext('2d');
        fitToContainer(canvas3)

        $scope.canvases.canvas3.canvas = canvas3;
        $scope.canvases.canvas3.ctx = ctx3;

        var canvas4 = document.getElementById('canvas4');
        var ctx4 = canvas4.getContext('2d');
        fitToContainer(canvas4)

        $scope.canvases.canvas4.canvas = canvas4;
        $scope.canvases.canvas4.ctx = ctx4;
      }

      $scope.setCanvases();

}]);
