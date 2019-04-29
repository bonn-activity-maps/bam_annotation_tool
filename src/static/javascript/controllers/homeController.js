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
        },
      }

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
      // Variables to control the for camera views
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
          }).then(
            function(successData){
              imageData = successData[0].slice(1)
              var image = new Image()
              image.src = imageData;
              ctx1.drawImage(image,0,0)
            }
          );
      }

//////// CANVASES
      $scope.canvases = {   // Initial canvas structure
        canvas1:{
          element: null,
          ctx: null,
          valid: false,     // when set to true, the canvas will redraw everything
          dragging: false,  // Keep track of when we are dragging
          dragoffx: 0,
          dragoffy: 0,
        },
        canvas2:{
          element: null,
          ctx: null,
          valid: false,     // when set to true, the canvas will redraw everything
          dragging: false,  // Keep track of when we are dragging
          dragoffx: 0,
          dragoffy: 0,
        },
        canvas3:{
          element: null,
          ctx: null,
          valid: false,     // when set to true, the canvas will redraw everything
          dragging: false,  // Keep track of when we are dragging
          dragoffx: 0,
          dragoffy: 0,
        },
        canvas4:{
          element: null,
          ctx: null,
          valid: false,     // when set to true, the canvas will redraw everything
          dragging: false,  // Keep track of when we are dragging
          dragoffx: 0,
          dragoffy: 0,
        },
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

        $scope.canvases.canvas1.element = canvas1;
        $scope.canvases.canvas1.ctx = ctx1;

        var canvas2 = document.getElementById('canvas2');
        var ctx2 = canvas2.getContext('2d');
        fitToContainer(canvas2)

        $scope.canvases.canvas2.element = canvas2;
        $scope.canvases.canvas2.ctx = ctx2;

        var canvas3 = document.getElementById('canvas3');
        var ctx3 = canvas3.getContext('2d');
        fitToContainer(canvas3)

        $scope.canvases.canvas3.element = canvas3;
        $scope.canvases.canvas3.ctx = ctx3;

        var canvas4 = document.getElementById('canvas4');
        var ctx4 = canvas4.getContext('2d');
        fitToContainer(canvas4)

        $scope.canvases.canvas4.element = canvas4;
        $scope.canvases.canvas4.ctx = ctx4;
      }

      $scope.setCanvases();

}]);
