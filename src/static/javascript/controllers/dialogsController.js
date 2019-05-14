angular.module('CVGTool')

    /*
     * Controller of the dialog of the "rename stored video as administrator" action
     */
    .controller('dialogRenameVideoCtrl', ['$scope','adminDatasetsSrvc', '$mdDialog', 'video', function ($scope, adminDatasetsSrvc, $mdDialog, video) {
        $scope.mode = 'normal';
        $scope.msg = '';
        $scope.inputMsg = '';
        $scope.inputError = false;

        $scope.oldName = video.name;
        $scope.newName = {};  // Odd way to manage variables with ng-model and dialogs, but it's an effective way to bypass the autism of AngularJS

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
          $mdDialog.cancel();
        }

        // Callback function if the rename worked
        var showSuccess = function(response) {
          $scope.mode = 'success';
          $scope.msg = 'Video successfully renamed.'
        }

        // Callback function if the rename didnt worked
        var showError = function(response) {
          $scope.mode = 'error';
          $scope.msg = 'There was an error when renaming the video.'
        }

        // Function to hide the error messages on click
        $scope.hiddeError = function() {
          $scope.inputError = false;
          $scope.inputMsg = '';
        }

        // Function that generates the call to the server to rename the file
        // It does some simple checking (not blank and different from the old name)
        $scope.rename = function() {
          if ($scope.newName.name === undefined) {
            $scope.inputError = true;
            $scope.inputMsg = "The new name can't be blank.";
          } else if ($scope.newName.name.localeCompare($scope.oldName) == 0 ) {
            $scope.inputError = true;
            $scope.inputMsg = "The new name must be different from the old name.";
          } else {
            var newVideoName = $scope.newName.name + video.extension;
            var oldVideoName = $scope.oldName + video.extension;
            adminDatasetsSrvc.renameVideo(oldVideoName, newVideoName, showSuccess, showError)
          }
        }
    }])

    /*
     * Controller of the dialog of the "remove stored video as administrator" action
     */
    .controller('dialogDeleteVideoCtrl', ['$scope','adminDatasetsSrvc', '$mdDialog', 'video', function ($scope, adminDatasetsSrvc, $mdDialog, video) {
        var videoName = video.name + video.extension;

        $scope.mode = 'normal';
        $scope.msg = '';

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
          $mdDialog.cancel();
        }

        // Recall function if the rename worked
        var showSuccess = function(response) {
          $scope.mode = 'success';
          $scope.msg = 'Video successfully deleted.'
        }

        // Recall function if the rename didnt worked
        var showError = function(response) {
          $scope.mode = 'error';
          $scope.msg = 'There was an error when deleting the video.'
        }

        // Function that generates the call to the server to delete the file
        $scope.delete = function() {
          adminDatasetsSrvc.deleteVideo(videoName, showSuccess, showError)
        }
    }])

    /*
     * Controller of the dialog of the "remove stored video as administrator" action
     */
    .controller('dialogCameraSelectorCtrl', ['$scope','$mdDialog', 'video', 'canvases', function ($scope, $mdDialog, video, canvases) {
        $scope.variables = {
            video: video,
            canvases: canvases
        };

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
          $mdDialog.cancel();
        }

        $scope.switchTo = function(number) {
          $scope.data = {
            video: $scope.variables.video,
            number: number
          }
          $mdDialog.hide($scope.data);
        }
    }])

    /*
     * Controller of the dialog of the "Add new camera to the camera array" action
     */
    .controller('dialogAddNewCameraCtrl', ['$scope', '$timeout','toolSrvc', '$mdDialog', function ($scope, $timeout, toolSrvc, $mdDialog) {
        $scope.isVideoSelected = false;
        $scope.videoSelected;
        $scope.search = {};  // Odd way to manage variables with ng-model and dialogs, but it's an effective way to bypass the autism of AngularJS
        $scope.listOfVideos = [];
        $scope.listOfVideosToShow = [];
        $scope.retrievingData = false;
        $scope.doneRetrievingData = false;
        $scope.targetFrames;
        $scope.retrievedFrames;

        $scope.slider = {   // Options and values for the slider
          from: 1,
          to: 1,
          options: {
            floor: 1,
            ceil: 1,
            step: 1
          },
        }

        // Function called everytime the number input of the slider is changed to check those values
        $scope.checkSlider = function() {
            if ($scope.slider.from < $scope.slider.options.floor) {
              $scope.slider.from = $scope.slider.options.floor;
            }

            if ($scope.slider.to > $scope.slider.options.ceil) {
              $scope.slider.to = $scope.slider.options.ceil
            }

            if ($scope.slider.from > $scope.slider.to) {
              var aux = $scope.slider.from;
              $scope.slider.from = $scope.slider.to;
              $scope.slider.to = aux;
            }
        }

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
          $mdDialog.cancel();
        }

        // Function to update the list of videos using the searchbar
        $scope.searchInListOfVideos = function () {
            if ($scope.search.str === undefined) {
                return;
            } else {
              $scope.listOfVideosToShow = [];

              $scope.listOfVideos.forEach(function(video) {
                if (video.name.includes($scope.search.str.toString())){
                    $scope.listOfVideosToShow.push(video);
                }
              });
            }
        }

        // Function that manages item selection
        $scope.selectItem = function (video) {
            $scope.isVideoSelected = true;      // TODO: FInish the selection of the video, I have to use the bypass (the same way than with search)
            $scope.videoSelected = video.video
            $scope.slider.options.ceil = $scope.videoSelected.frames;
        }

        // Function to update the list of videos
        var showListOfVideos = function (list) {
            $scope.listOfVideos = [];
            for (i = 0; i < list.length; i++) {
              $scope.listOfVideos.push({"name": list[i].name, "extension": list[i].extension, "duration": list[i].duration, "frames": list[i].frames});
            }
            $scope.listOfVideosToShow = $scope.listOfVideos.slice();
        };

        // Recall function if the rename worked
        $scope.getListOfVideos = function() {
            toolSrvc.getInfoOfVideos(showListOfVideos);
        }

        // Function to go back from the dialog once the frames have been retrieved from the server
        $scope.end = function() {
          $mdDialog.hide($scope.retrievedFrames);
        }

        // Function that will be called everytime a frame has been retrieved from the server
        var callbackRetrievingFrame = function(image, fileName, frame) {
          $scope.retrievedFrames.push({ // Store the retrieved frame
            image: image,
            filename: fileName,
            frame: parseInt(frame)
          });

          // Check if we are done
          if ($scope.retrievedFrames.length == $scope.targetFrames) {
            $scope.end();
          }
        }

        // Function to retrieve the selected frame range from the selected video
        $scope.accept = function() {
            var range = Math.abs($scope.slider.from - $scope.slider.to);
            if (range < 0) {
              alert("At least one frame must be selected.")
            } else {
              $scope.retrievingData = true;
              $scope.targetFrames = range + 1;
              $scope.retrievedFrames = [];

              // Make all the petitions
              for (var i=0; ($scope.slider.from + i) < $scope.slider.to + 1; i++) {
                toolSrvc.getFrame($scope.videoSelected.name, $scope.slider.from + i, callbackRetrievingFrame);
              }
            }
        }

        $scope.getListOfVideos();

    }]);
