angular.module('CVGTool')

    .factory('adminDatasetsSrvc', function ($state, $http, $httpParamSerializer) {

      return {
          getInfoOfVideos: function (callbackSuccess, activeDataset) {
              $http({
                  method: 'GET',
                  url: '/api/dataset/infoVideos',
                  dataset: activeDataset
              }).then(function successCallback(response) {
                  if (response.data.msg.length === 0) {
                    callbackSuccess([])
                  } else {
                    var parsedArray = [];
                    for (i = 0; i < response.data.msg.length; i++) {
                      parsedArray.push(JSON.parse(response.data.msg[i]))
                    }
                    callbackSuccess(parsedArray)
                  }
                }, function errorCallback(response) {
                  console.log("ERROR while retrieving info from videos.")
              });
          },

          unwrapVideo: function (videoName, activeDataset) {
              $http({
                  method: 'POST',
                  url: '/api/dataset/unwrapVideo',
                  data: {
                    'name': videoName,
                    'dataset': activeDataset
                  }
              }).then(function successCallback(response) {
                // TODO: add action when unwrap is finished
                  console.log(response.data.msg)
                }, function errorCallback(response) {
                  console.log(response.data.msg)
              });
          },

          removeVideo: function (videoName, callbackSuccess, callbackError) {
              $http({
                method: 'POST',
                url: '/api/dataset/removeVideo',
                data: {
                  'name': videoName
                }
              }).then(function successCallback(response) {
                callbackSuccess(response.data.msg)
              }, function errorCallback(response) {
                  callbackError(response.data.msg)
              });
          },

          renameVideo: function (oldVideoName, newVideoName, callbackSuccess, callbackError) {
              $http({
                method: 'POST',
                url: '/api/dataset/renameVideo',
                data: {
                  'oldName': oldVideoName,
                  'newName': newVideoName
                }
              }).then(function successCallback(response) {
                callbackSuccess(response.data.msg)
              }, function errorCallback(response) {
                  callbackError(response.data.msg)
              });
          }
      }
});
