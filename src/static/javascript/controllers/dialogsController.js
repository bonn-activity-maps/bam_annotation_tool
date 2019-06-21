angular.module('CVGTool')

/*
 * Controller of the dialog of the "rename stored video as administrator" action
 */
// .controller('dialogRenameVideoCtrl', ['$scope','adminDatasetsSrvc', 'navSrvc', '$mdDialog', 'video',
//     function ($scope, adminDatasetsSrvc, navSrvc, $mdDialog, video) {
//     $scope.mode = 'normal';
//     $scope.msg = '';
//     $scope.inputMsg = '';
//     $scope.inputError = false;
//
//     $scope.oldName = video.name;
//     $scope.newName = {};  // Odd way to manage variables with ng-model and dialogs, but it's an effective way to bypass the autism of AngularJS
//
//     // Function to cancel all actions and close the dialog
//     $scope.cancel = function() {
//       $mdDialog.cancel();
//     }
//
//     // Callback function if the rename worked
//     var showSuccess = function(response) {
//       $scope.mode = 'success';
//       $scope.msg = 'Video successfully renamed.'
//     }
//
//     // Callback function if the rename didnt worked
//     var showError = function(response) {
//       $scope.mode = 'error';
//       $scope.msg = 'There was an error when renaming the video.'
//     }
//
//     // Function to hide the error messages on click
//     $scope.hiddeError = function() {
//       $scope.inputError = false;
//       $scope.inputMsg = '';
//     }
//
//     // Function that generates the call to the server to rename the file
//     // It does some simple checking (not blank and different from the old name)
//     $scope.rename = function() {
//       if ($scope.newName.name === undefined) {
//         $scope.inputError = true;
//         $scope.inputMsg = "The new name can't be blank.";
//       } else if ($scope.newName.name.localeCompare($scope.oldName) === 0 ) {
//         $scope.inputError = true;
//         $scope.inputMsg = "The new name must be different from the old name.";
//       } else {
//         var newVideoName = $scope.newName.name + video.extension;
//         var oldVideoName = $scope.oldName + video.extension;
//         adminDatasetsSrvc.renameVideo(oldVideoName, newVideoName, navSrvc.getActiveDataset(), showSuccess, showError)
//       }
//     }
// }])

/*
 * Controller of the dialog of the "remove stored video as administrator" action
 */
// .controller('dialogRemoveVideoCtrl', ['$scope','adminDatasetsSrvc', 'navSrvc', '$mdDialog', 'video',
//     function ($scope, adminDatasetsSrvc, navSrvc, $mdDialog, video) {
//     var videoName = video.name + video.extension;
//
//     $scope.mode = 'normal';
//     $scope.msg = '';
//
//     // Function to cancel all actions and close the dialog
//     $scope.cancel = function() {
//       $mdDialog.cancel();
//     }
//
//     // Recall function if the rename worked
//     var showSuccess = function(response) {
//       $scope.mode = 'success';
//       $scope.msg = 'Video successfully removed.'
//     }
//
//     // Recall function if the rename didnt worked
//     var showError = function(response) {
//       $scope.mode = 'error';
//       $scope.msg = 'There was an error when deleting the video.'
//     }
//
//     // Function that generates the call to the server to remove the file
//     $scope.remove = function() {
//       adminDatasetsSrvc.removeVideo(videoName, navSrvc.getActiveDataset(), showSuccess, showError)
//     }
// }])

/*
 * Controller of the dialog of the "remove stored video as administrator" action
 */
.controller('dialogRemoveDatasetCtrl', ['$scope', 'adminDatasetsSrvc', 'navSrvc', '$mdDialog', 'name',
    function($scope, adminDatasetsSrvc, navSrvc, $mdDialog, name) {
        $scope.mode = 'normal';
        $scope.msg = '';

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        // Recall function if the rename worked
        var showSuccess = function(response) {
            $scope.mode = 'success';
            $scope.msg = 'Dataset successfully removed.'
        };

        // Recall function if the rename didnt worked
        var showError = function(response) {
            $scope.mode = 'error';
            $scope.msg = 'There was an error when deleting the dataset.'
        };

        // Function that generates the call to the server to remove the file
        $scope.remove = function() {
            adminDatasetsSrvc.removeDataset(name, showSuccess, showError)
        }
    }
])

/*
 * Controller of the dialog of the "remove stored user as administrator" action
 */
.controller('dialogRemoveUserCtrl', ['$scope', 'adminUsersSrvc', '$mdDialog', 'username', function($scope, adminUsersSrvc, $mdDialog, username) {
    var user = username;

    console.log(user);
    $scope.mode = 'normal';
    $scope.msg = '';

    // Function that generates the call to the server to remove the file
    $scope.remove = function() {
        adminUsersSrvc.removeUser(user, showSuccess, showError)
    };

    // Function to cancel all actions and close the dialog
    $scope.cancel = function() {
        $mdDialog.cancel();
    };

    // Recall function if the rename worked
    var showSuccess = function(response) {
        $scope.mode = 'success';
        $scope.msg = 'User successfully removed.'
    };

    // Recall function if the rename didnt worked
    var showError = function(response) {
        $scope.mode = 'error';
        $scope.msg = 'There was an error when deleting the dataset.'
    };
}])

/*
 * Controller of the dialog of the "remove stored video as administrator" action
 */
.controller('dialogCameraSelectorCtrl', ['$scope', '$mdDialog', 'video', 'canvases', function($scope, $mdDialog, video, canvases) {
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
        };

        $mdDialog.hide($scope.data);
    }
}])

/*
 * Controller of the dialog of show password
 */
.controller('dialogShowPasswordCtrl', ['$scope', '$mdDialog', 'username', 'password', function($scope, $mdDialog, username, password) {
    $scope.variables = {
        username: username,
        password: password
    };

    // Function to cancel all actions and close the dialog
    $scope.cancel = function() {
        $mdDialog.cancel();
    }
}])

/*
 * Controller of the dialog of the "Add new camera to the camera array" action
 */
.controller('dialogAddNewCameraCtrl', ['$scope', '$timeout', 'toolSrvc', 'navSrvc', '$mdDialog',
    function($scope, $timeout, toolSrvc, navSrvc, $mdDialog) {
        $scope.isVideoSelected = false;
        $scope.videoSelected;
        $scope.search = {}; // Odd way to manage variables with ng-model and dialogs, but it's an effective way to bypass the autism of AngularJS
        $scope.listOfVideos = [];
        $scope.listOfVideosToShow = [];
        $scope.retrievingData = false;
        $scope.doneRetrievingData = false;
        $scope.targetFrames;
        $scope.retrievedFrames;
        $scope.framesChecked;
        $scope.retrievedObjects;

        // Variables to control progress bars
        $scope.progress = {
            frames: 0,
            maxFrames: 0
        }

        $scope.slider = { // Options and values for the slider
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
        };

        // Function to cancel all actions and close the dialog
        $scope.cancel = function() {
            $mdDialog.cancel();
        }

        // Function to update the list of videos using the searchbar
        $scope.searchInListOfVideos = function() {
            if ($scope.search.str === undefined) {

            } else {
                $scope.listOfVideosToShow = [];

                $scope.listOfVideos.forEach(function(video) {
                    if (video.name.includes($scope.search.str.toString())) {
                        $scope.listOfVideosToShow.push(video);
                    }
                });
            }
        };

        // Function that manages item selection
        $scope.selectItem = function(video) {
            $scope.isVideoSelected = true; // TODO: Finish the selection of the video, I have to use the bypass (the same way than with search)
            $scope.videoSelected = video.video
            $scope.slider.options.ceil = $scope.videoSelected.frames;
        };

        // Function to update the list of videos
        var showListOfVideos = function(list) {
            $scope.listOfVideos = [];
            for (i = 0; i < list.length; i++) {
                $scope.listOfVideos.push({ "name": list[i].name, "extension": list[i].extension, "duration": list[i].duration, "frames": list[i].frames });
            }
            $scope.listOfVideosToShow = $scope.listOfVideos.slice();
        };

        // Recall function if the rename worked
        $scope.getListOfVideos = function() {
            toolSrvc.getInfoOfVideos(showListOfVideos, navSrvc.getActiveDataset().name);
        };

        // Function to go back from the dialog once the frames have been retrieved from the server
        $scope.end = function() {
            $mdDialog.hide($scope.retrievedFrames, $scope.retrievedObjects);
        }

        var callbackRetrievingObjects = function(objects) {
            $scope.framesChecked++; // Update the counter
            console.log(objects)

            // TODO: Append the objects to the object structure and in the end, return both structures


            // Check if we are done
            console.log($scope.framesChecked + " | " + $scope.targetFrames)
            if ($scope.framesChecked == $scope.targetFrames) {
                $scope.end();
            }
        }

        // Function that retrieves the objects from the given videos and frames
        $scope.retrieveExistingObjects = function(fileName) {
            $scope.framesChecked = 0; // Reset the counter

            // Make all the request to obtain the objects from all existing frames
            for (var i = 0; i < $scope.retrievedFrames.length; i++) { // TODO: the removal of the extension is temporal, we need to fix it
                toolSrvc.getAnnotationOfFrame(fileName.split('.').slice(0, -1).join('.'), $scope.retrievedFrames[i].frame, navSrvc.getActiveDataset(), navSrvc.getUser().name, callbackRetrievingObjects);
            }
        }

        // Function that will be called everytime a frame has been retrieved from the server
        var callbackRetrievingFrame = function(image, fileName, frame) {
            $scope.retrievedFrames.push({ // Store the retrieved frame
                image: image,
                filename: fileName,
                frame: parseInt(frame)
            });

            // Keep track of the progress
            $scope.progress.frames++;

            // If we are done, move to retrieve the objects
            if ($scope.retrievedFrames.length == $scope.targetFrames) {
                console.log("lets move to retrieve the objects")
                $scope.retrieveExistingObjects(fileName);
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

                // Keep track of the progress
                $scope.progress.maxFrames = $scope.targetFrames;

                // Make all the petitions
                for (var i = 0;
                    ($scope.slider.from + i) < $scope.slider.to + 1; i++) {
                    toolSrvc.getFrame($scope.videoSelected.name, $scope.slider.from + i, navSrvc.getActiveDataset(),
                        callbackRetrievingFrame);
                }
            }
        };

        $scope.getListOfVideos();
    }
]);