angular.module('CVGTool')

    .controller('homeCtrl', ['$scope', '$state', '$interval', '$mdDialog', 'homeSrvc', function ($scope, $state, $interval, $mdDialog, homeSrvc) {

      // Variables to control the for camera views
      $scope.cameraViewSelected = "";
      $scope.isCameraViewSelected = false;

      // Variables to control the loaded cameras array
      $scope.cameraSelected = "";
      $scope.isCameraSelected = true;
      $scope.loadedCameras = [];
      $scope.recommendedFrames = "";

      // Variables to control the timeline
      $scope.isPlaying = false;
      var promise;

      // TODO: Check if this thing works
      function fitCanvasToContainer(canvas){
        // Make it visually fill the positioned parent
        canvas.style.width ='100%';
        canvas.style.height='100%';
        // ...then set the internal size to match
        // canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        canvas.width = canvas.height * (canvas.clientWidth / canvas.clientHeight);
      }

      var canvas1 = document.getElementById('canvas1');
      var ctx1 = canvas1.getContext('2d');
      var canvas2 = document.getElementById('canvas2');
      var ctx2 = canvas2.getContext('2d');
      var canvas3 = document.getElementById('canvas3');
      var ctx3 = canvas3.getContext('2d');
      var canvas4 = document.getElementById('canvas4');
      var ctx4 = canvas4.getContext('2d');


      fitCanvasToContainer(canvas1);
      fitCanvasToContainer(canvas2);
      fitCanvasToContainer(canvas3);
      fitCanvasToContainer(canvas4);

      // TIMELINE
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

      $scope.imageTest;
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


}]);
